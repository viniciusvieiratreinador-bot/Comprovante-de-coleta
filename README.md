# Protótipo — Comprovante de Coleta

## O que esta versão já faz
- Interface responsiva para Android e iPhone.
- Primeiro acesso com cadastro local de nome e PIN.
- Registro de cliente, protocolo, equipamentos em texto livre e observações.
- Identificador único para cada coleta.
- Armazenamento local usando IndexedDB.
- Histórico local das coletas.
- Geração de comprovante com QR Code.
- Impressão / salvar como PDF pelo navegador.
- Compartilhamento do resumo pelo menu nativo, quando disponível.
- Exportação de backup JSON.
- Cache de arquivos do aplicativo para reabertura offline após a primeira carga online.

## Limitações importantes desta versão
1. É um protótipo, não um sistema oficial ou aprovado pela Claro.
2. O login e o PIN são locais ao aparelho. Não existe autenticação central, gestão de técnicos ou recuperação de conta.
3. Não existe sincronização com servidor nesta versão. Os registros ficam no aparelho e aparecem como "Pendente de sincronização".
4. O QR Code contém identificador, protocolo e data do registro. Ainda não abre uma página pública nem prova autenticidade criptográfica. Isso exige backend e assinatura/validação no servidor.
5. O QR Code é carregado de uma biblioteca externa na primeira instalação online e armazenado em cache pelo Service Worker. Teste a instalação com internet antes de operar offline.
6. O botão de compartilhamento compartilha o resumo textual. Para entregar o PDF, use "Imprimir / salvar em PDF" e depois compartilhe o arquivo.
7. Não armazene dados reais de clientes nesta versão de demonstração.

## Como testar
Service Workers e instalação PWA precisam de HTTPS (ou localhost). Não abra `index.html` diretamente como arquivo.

1. Publique os arquivos em um servidor HTTPS de teste ou execute um servidor local em `localhost`.
2. Abra o endereço no Chrome (Android) ou Safari (iPhone).
3. Faça o primeiro acesso com nome e PIN de 4 a 8 dígitos.
4. Registre uma coleta de teste.
5. Gere o comprovante e use "Imprimir / salvar em PDF".
6. Com o aplicativo carregado uma vez, ative modo avião e reabra para testar o funcionamento offline.
7. Faça backup pelo botão "Exportar backup".

## Próxima etapa para produção
- Backend central (por exemplo, Supabase/PostgreSQL ou API própria).
- Autenticação individual e gestão de permissões.
- Sincronização com fila, retentativas, idempotência e confirmação do servidor.
- Endpoint público de validação do QR Code, sem expor dados pessoais.
- Assinatura criptográfica do registro no servidor.
- Política de retenção, criptografia local, logs e adequação à LGPD.
- Distribuição gerenciada para Android e iOS.

## Observação sobre identidade visual
O protótipo usa uma paleta vermelha e branca inspirada no pedido visual. Não utiliza logotipo oficial nem se apresenta como aplicativo oficial da Claro.
