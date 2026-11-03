# Comprovante de Coleta — Protótipo v2

## O que esta versão demonstra
- Dados iniciais: nome do cliente, base e contrato.
- Perfil local: empresa, nome do técnico e login.
- Seleção dos sete tipos de equipamento e quantidade.
- Para EMTA, Decoder Digital, Wi-Fi Mesh e Câmera Smart Home: um número de série e uma foto por unidade.
- Comprovante com dados, lista de números de série e registro fotográfico no final.
- Histórico local e exportação CSV com uma linha por unidade de equipamento, repetindo os dados da coleta.
- PWA com cache básico para abrir offline após a primeira visita online.

## Limitações importantes
- É um protótipo demonstrativo, não pronto para uso operacional com dados reais.
- Perfil não é autenticação segura: fica salvo localmente no aparelho.
- Registros e fotos ficam no armazenamento local do navegador. Não há sincronização com servidor nem envio automático para Google Sheets/Excel.
- O CSV é exportado manualmente e contém dados textuais; as fotos não entram na planilha.
- O comprovante pode ser impresso/salvo como PDF pelo menu de impressão do iPhone/navegador.
- O armazenamento do navegador pode ter limites; exporte e preserve os registros de teste.
- Não usar dados reais de clientes até implementar autenticação, armazenamento seguro, backup, sincronização, controle de acesso e política de retenção.

## Publicação
Hospede todos os arquivos na raiz de um repositório GitHub Pages com HTTPS. Abra uma vez online no Safari e adicione à Tela de Início. Para testar offline, abra o app instalado uma vez com internet, depois ative modo avião.
