const $ = (id) => document.getElementById(id);
const DB_NAME = "coleta-offline-db";
const DB_VERSION = 1;
let db;
let currentTechnician = null;
let activeRecord = null;

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains("records"))d.createObjectStore("records",{keyPath:"id"});if(!d.objectStoreNames.contains("settings"))d.createObjectStore("settings",{keyPath:"key"});};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
function store(name,mode="readonly"){return db.transaction(name,mode).objectStore(name);}
function getItem(name,key){return new Promise((res,rej)=>{const r=store(name).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
function putItem(name,value){return new Promise((res,rej)=>{const r=store(name,"readwrite").put(value);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
function getAllRecords(){return new Promise((res,rej)=>{const r=store("records").getAll();r.onsuccess=()=>res(r.result.sort((a,b)=>b.createdAt-a.createdAt));r.onerror=()=>rej(r.error);});}
function uuid(){return "COL-"+crypto.randomUUID().toUpperCase();}
function fmtDate(iso){return new Date(iso).toLocaleString("pt-BR");}
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function pinHash(pin){const data=new TextEncoder().encode(pin);const digest=await crypto.subtle.digest("SHA-256",data);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2600);}

async function ensureQRCode(){
  if(window.QRCode) return true;
  return new Promise(resolve=>{
    const script=document.createElement("script");
    script.src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.onload=()=>resolve(!!window.QRCode);
    script.onerror=()=>resolve(false);
    document.head.appendChild(script);
  });
}
async function init(){
  await ensureQRCode();
  db=await openDB();
  const session=await getItem("settings","technician");
  if(session){$("techName").value=session.name;$("loginView").classList.remove("hidden");}
  $("loginForm").addEventListener("submit",login);
  $("collectionForm").addEventListener("submit",saveCollection);
  $("logoutBtn").addEventListener("click",logout);
  $("closeModal").addEventListener("click",closeReceipt);
  $("printBtn").addEventListener("click",()=>window.print());
  $("shareBtn").addEventListener("click",shareReceipt);
  $("exportBtn").addEventListener("click",exportBackup);
  if("serviceWorker" in navigator && location.protocol.startsWith("http")){navigator.serviceWorker.register("./sw.js").catch(()=>{});}
}
async function login(e){
  e.preventDefault();$("loginError").textContent="";
  const name=$("techName").value.trim(),pin=$("techPin").value.trim();
  if(name.length<3||!/^\d{4,8}$/.test(pin)){$("loginError").textContent="Informe nome e PIN de 4 a 8 dígitos.";return;}
  const saved=await getItem("settings","technician"),hash=await pinHash(pin);
  if(saved && saved.pinHash!==hash){$("loginError").textContent="PIN incorreto neste aparelho.";return;}
  currentTechnician={name:saved?.name||name,pinHash:hash};
  if(!saved)await putItem("settings",{key:"technician",name,pinHash:hash});
  $("loginView").classList.add("hidden");$("appView").classList.remove("hidden");$("logoutBtn").classList.remove("hidden");
  $("welcomeText").textContent="Técnico: "+currentTechnician.name;
  $("techPin").value="";
  await renderRecords();
}
function logout(){currentTechnician=null;$("appView").classList.add("hidden");$("loginView").classList.remove("hidden");$("logoutBtn").classList.add("hidden");}
async function saveCollection(e){
  e.preventDefault();
  if(!currentTechnician)return;
  const customer=$("customer").value.trim(),protocol=$("protocol").value.trim(),equipment=$("equipment").value.trim();
  if(!customer||!protocol||!equipment){toast("Preencha os campos obrigatórios.");return;}
  const now=new Date().toISOString();
  const record={id:uuid(),customer,protocol,equipment,notes:$("notes").value.trim(),technician:currentTechnician.name,createdAt:Date.now(),deviceDate:now,status:"pending",version:1};
  await putItem("records",record);
  $("collectionForm").reset();
  await renderRecords();
  openReceipt(record);
  toast("Coleta salva neste aparelho.");
}
async function renderRecords(){
  const records=await getAllRecords();$("recordCount").textContent=records.length;
  if(!records.length){$("recordsList").innerHTML='<p class="muted">Nenhuma coleta registrada.</p>';return;}
  $("recordsList").innerHTML=records.map(r=>`<div class="record"><div><strong>${escapeHTML(r.customer)} · ${escapeHTML(r.protocol)}</strong><small>${escapeHTML(r.id)} · ${fmtDate(r.deviceDate)} · Pendente de sincronização</small></div><button data-id="${escapeHTML(r.id)}">Abrir</button></div>`).join("");
  $("recordsList").querySelectorAll("button").forEach(b=>b.addEventListener("click",async()=>{const r=await getItem("records",b.dataset.id);if(r)openReceipt(r);}));
}
function openReceipt(r){
  activeRecord=r;$("receiptId").textContent=r.id;
  const fields=[["Cliente",r.customer],["Protocolo / ordem",r.protocol],["Data e hora do aparelho",fmtDate(r.deviceDate)],["Técnico",r.technician],["Equipamentos recolhidos",r.equipment],["Observações",r.notes||"Não informado"]];
  $("receiptFields").innerHTML=fields.map(([k,v])=>`<div class="field-row"><b>${k}</b><div class="value">${escapeHTML(v)}</div></div>`).join("");
  $("qrcode").innerHTML="";
  const payload=JSON.stringify({id:r.id,protocol:r.protocol,createdAt:r.deviceDate,version:1});
  if(window.QRCode){new QRCode($("qrcode"),{text:payload,width:180,height:180,colorDark:"#111111",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});}
  else $("qrcode").textContent="Biblioteca de QR Code indisponível. Conecte-se à internet e recarregue o aplicativo.";
  $("receiptModal").classList.remove("hidden");
}
function closeReceipt(){$("receiptModal").classList.add("hidden");}
async function shareReceipt(){
  if(!activeRecord)return;
  const text=`Comprovante ${activeRecord.id}\nCliente: ${activeRecord.customer}\nProtocolo: ${activeRecord.protocol}\nData: ${fmtDate(activeRecord.deviceDate)}\nEquipamentos: ${activeRecord.equipment}`;
  if(navigator.share){try{await navigator.share({title:"Comprovante de coleta",text});}catch(e){}}
  else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast("Resumo copiado. Use imprimir/salvar em PDF para compartilhar o documento.");}
  else toast("Use Imprimir / salvar em PDF para entregar o comprovante.");
}
async function exportBackup(){
  const records=await getAllRecords();const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),records},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="backup-coletas-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(url);
}
init().catch(err=>{console.error(err);toast("Não foi possível iniciar o banco local.");});
