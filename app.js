const EQUIPMENT = [
  {name:"EMTA", serial:true}, {name:"DECODER DIGITAL", serial:true},
  {name:"WIFI-MESH", serial:true}, {name:"CONTROLE REMOTO", serial:false},
  {name:"FONTE", serial:false}, {name:"CÂMERA SMART HOME", serial:true},
  {name:"SMART CARD", serial:false}
];
const $ = id => document.getElementById(id);
const qs = selector => document.querySelector(selector);
let profile = JSON.parse(localStorage.getItem("cc_profile") || "null");
let records = JSON.parse(localStorage.getItem("cc_records") || "[]");
let currentReceipt = null;

function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderProfile(){
  $("profileSummary").textContent = profile ? `${profile.company} · ${profile.technician} · Login: ${profile.login}` : "Perfil não configurado. Configure a empresa e o técnico antes de registrar.";
}
function openProfile(){if(profile){$("company").value=profile.company;$("technician").value=profile.technician;$("login").value=profile.login;} $("profileDialog").showModal();}
$("profileBtn").onclick=openProfile;$("editProfile").onclick=openProfile;
$("cancelProfile").onclick=()=>$("profileDialog").close();
$("profileForm").onsubmit=e=>{e.preventDefault();profile={company:$("company").value.trim(),technician:$("technician").value.trim(),login:$("login").value.trim()};localStorage.setItem("cc_profile",JSON.stringify(profile));renderProfile();$("profileDialog").close();};
function renderEquipment(){
  $("equipmentList").innerHTML=EQUIPMENT.map((e,i)=>`<div class="equipment-block">
    <div class="equipment-row"><label class="equip-name"><input type="checkbox" data-check="${i}"> ${e.name}</label><label class="qty"><input type="number" min="1" max="30" value="1" data-qty="${i}" aria-label="Quantidade ${e.name}" disabled></label></div>
    <div id="units-${i}"></div></div>`).join("");
  $("equipmentList").querySelectorAll("[data-check]").forEach(ch=>ch.addEventListener("change",()=>{const i=+ch.dataset.check;const q=qs(`[data-qty="${i}"]`);q.disabled=!ch.checked;if(ch.checked){renderUnits(i,Math.max(1,+q.value||1));}else{$(`units-${i}`).innerHTML="";}}));
  $("equipmentList").querySelectorAll("[data-qty]").forEach(q=>q.addEventListener("change",()=>{const i=+q.dataset.qty;let n=Math.max(1,Math.min(30,+q.value||1));q.value=n;if(qs(`[data-check="${i}"]`).checked)renderUnits(i,n);}));
}
function renderUnits(i,n){
 const e=EQUIPMENT[i], box=$(`units-${i}`);if(!e.serial){box.innerHTML=`<p class="muted">Quantidade selecionada: ${n}. Não é exigido número de série nem foto para este equipamento.</p>`;return;}
 const old=[...box.querySelectorAll(".unit-card")].map(card=>({serial:card.querySelector(".serial")?.value||"",photo:card.querySelector(".photo-data")?.value||""}));
 box.innerHTML=Array.from({length:n},(_,u)=>`<div class="unit-card"><div class="unit-title">${e.name} — Unidade ${u+1}</div><label>Número de série *<input class="serial" required placeholder="Número de série" value="${escapeHtml(old[u]?.serial||"")}"></label><label>Foto da etiqueta *<input class="photo-input" type="file" accept="image/*" capture="environment"></label><input class="photo-data" type="hidden" value="${old[u]?.photo||""}"><div class="photo-status muted">${old[u]?.photo?"Foto anexada": "Nenhuma foto anexada"}</div><img class="photo-preview" ${old[u]?.photo?`src="${old[u].photo}"`:"hidden"}></div>`).join("");
 box.querySelectorAll(".unit-card").forEach(card=>{const file=card.querySelector('input[type=file]');file.addEventListener("change",async()=>{const f=file.files[0];if(!f)return;if(f.size>5*1024*1024){alert("Escolha uma foto de até 5 MB.");file.value="";return;}const data=await compressImage(f);card.querySelector(".photo-data").value=data;card.querySelector(".photo-status").textContent="Foto anexada";const img=card.querySelector("img");img.src=data;img.hidden=false;});});
}
function compressImage(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const scale=Math.min(1,1200/Math.max(img.width,img.height));const c=document.createElement("canvas");c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext("2d").drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL("image/jpeg",.72));};img.onerror=reject;img.src=reader.result;};reader.onerror=reject;reader.readAsDataURL(file);});}
function collectItems(){
 const out=[];EQUIPMENT.forEach((e,i)=>{if(!qs(`[data-check="${i}"]`).checked)return;const n=Math.max(1,+qs(`[data-qty="${i}"]`).value||1);for(let u=0;u<n;u++){let serial="",photo="";if(e.serial){const card=$(`units-${i}`).querySelectorAll(".unit-card")[u];serial=card.querySelector(".serial").value.trim();photo=card.querySelector(".photo-data").value;if(!serial||!photo)throw new Error(`Preencha o número de série e anexe a foto de ${e.name}, unidade ${u+1}.`);}out.push({equipment:e.name,serial,photo});}});return out;
}
$("collectionForm").onsubmit=e=>{e.preventDefault();if(!profile){openProfile();alert("Configure a empresa e o técnico antes de gerar o comprovante.");return;}let items;try{items=collectItems();}catch(err){alert(err.message);return;}if(!items.length){alert("Selecione pelo menos um equipamento.");return;}
 const record={id:"COL-"+crypto.randomUUID(),date:new Date().toLocaleString("pt-BR"),customer:$("customer").value.trim(),base:$("base").value.trim(),contract:$("contract").value.trim(),...profile,items,notes:$("notes").value.trim()};
 records.unshift(record);try{localStorage.setItem("cc_records",JSON.stringify(records));}catch(err){records.shift();alert("O armazenamento deste aparelho está cheio. Reduza o tamanho das fotos ou exporte os registros.");return;}showReceipt(record);renderHistory();};
function showReceipt(r){currentReceipt=r;$("receipt").innerHTML=`
<h1>Comprovante de coleta de equipamentos</h1><div class="receipt-meta">Identificador: ${escapeHtml(r.id)} · Data e hora: ${escapeHtml(r.date)}</div>
<h2>Dados do cliente</h2><div class="receipt-grid">${field("Nome do cliente",r.customer)}${field("Base",r.base)}${field("Contrato",r.contract)}</div>
<h2>Identificação da coleta</h2><div class="receipt-grid">${field("Empresa",r.company)}${field("Técnico",r.technician)}${field("Login",r.login)}</div>
<h2>Equipamentos coletados</h2><table><thead><tr><th>Equipamento</th><th>Número de série</th></tr></thead><tbody>${r.items.map(x=>`<tr><td>${escapeHtml(x.equipment)}</td><td>${escapeHtml(x.serial||"—")}</td></tr>`).join("")}</tbody></table>
${r.notes?`<h2>Observações</h2><p>${escapeHtml(r.notes)}</p>`:""}
<h2>Registro fotográfico dos equipamentos</h2>${r.items.filter(x=>x.photo).map(x=>`<div class="photo-record"><div><strong>${escapeHtml(x.equipment)}</strong><p>Número de série: ${escapeHtml(x.serial)}</p></div><img src="${x.photo}" alt="Etiqueta ${escapeHtml(x.equipment)} ${escapeHtml(x.serial)}"></div>`).join("")||"<p>Não há fotos anexadas.</p>"}
<p class="footer-note">Este documento registra os equipamentos informados como fisicamente coletados. Guarde este comprovante para consulta.</p>`;
$("receiptView").hidden=false;document.querySelector("main").hidden=true;window.scrollTo(0,0);}
function field(label,value){return `<div class="receipt-field"><b>${label}</b>${escapeHtml(value)}</div>`;}
$("backToApp").onclick=()=>{$("receiptView").hidden=true;document.querySelector("main").hidden=false;window.scrollTo(0,0);};
$("printReceipt").onclick=()=>window.print();
function renderHistory(){$("history").innerHTML=records.length?records.map(r=>`<div class="history-item"><div><strong>${escapeHtml(r.customer)} — ${escapeHtml(r.contract)}</strong><small>${escapeHtml(r.date)} · ${r.items.length} unidade(s) · ${escapeHtml(r.id)}</small></div><button class="secondary small" data-open="${r.id}">Abrir</button></div>`).join(""):'<p class="muted">Nenhuma coleta salva ainda.</p>';$("history").querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>showReceipt(records.find(r=>r.id===b.dataset.open)));}
$("exportBtn").onclick=()=>{const cols=["Data e hora","Nome do cliente","Base","Contrato","Empresa","Nome do técnico","Login do técnico","ID do comprovante","Equipamento","Quantidade","Número de série","Observações"];const lines=[cols,...records.flatMap(r=>r.items.map(it=>[r.date,r.customer,r.base,r.contract,r.company,r.technician,r.login,r.id,it.equipment,1,it.serial,r.notes]))];const csv="\uFEFF"+lines.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(";")).join("\r\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="coletas.csv";a.click();URL.revokeObjectURL(a.href);};
renderProfile();renderEquipment();renderHistory();
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
