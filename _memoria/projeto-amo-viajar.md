# Relatório de Evolução — Amo Viajar

> Contexto completo do projeto: o que foi feito, o que está em andamento e o que vem pela frente.
> Leitura recomendada antes de qualquer tarefa de desenvolvimento ou conteúdo do Amo Viajar.

---

## Objetivo do Projeto

Transformar a Amo Viajar de uma operação baseada em WhatsApp e planilhas em uma plataforma própria de gestão, relacionamento e vendas, capaz de:

- Organizar viagens
- Capturar leads
- Gerenciar clientes
- Automatizar comunicação
- Fortalecer a comunidade Amo Viajar
- Escalar as vendas mantendo o atendimento humanizado da Lisa

---

## Etapa 1 — Site Institucional ✅ CONCLUÍDA

Construído com foco em autoridade, confiança, conversão e comunidade.

**Implementado:**
- Hero, história da Lisa, apresentação da Amo Viajar, destinos, comunidade, depoimentos, Clube VIP, contato
- Credenciais: 3+ anos, 1.200+ passageiros, Cadastur, Guia de Turismo, Ministério do Turismo
- Posicionamento: "A Amo Viajar não vende apenas excursões. A Amo Viajar conecta pessoas."
- Galeria de depoimentos com upload de prints reais, lightbox

---

## Etapa 2 — Painel Administrativo ✅ CONCLUÍDA

Retaguarda própria com:

- **Dashboard:** viagens abertas, leads novos, total de leads, Família VIP, próximas viagens, últimos leads
- **Gestão de Viagens:** CRUD completo (criar, editar, excluir, upload de imagem, controle de status)
- **Gestão de Leads:** lista, filtro por status, alteração de status, acesso rápido ao WhatsApp
- **Lista VIP:** cadastro pelo site, busca por nome/cidade/WhatsApp, estatísticas
- **Depoimentos:** upload, destaque, ordem de exibição, exclusão
- **Galeria:** upload múltiplo, organização, destaques

---

## Etapa 3 — Infraestrutura ✅ CONCLUÍDA

**Supabase configurado:**

Tabelas: `viagens`, `leads`, `lista_vip`, `depoimentos`, `galeria`, `clientes`, `participacoes`, `campanhas_whatsapp`, `mensagens_whatsapp`, `reservas`

Storage buckets: `viagens`, `depoimentos`, `galeria`, `midias-campanha`

Autenticação: usuário administrador

**Edge Functions (Deno, Supabase):**
- `checkout` — cria preferência Mercado Pago + salva reserva
- `mp-webhook` — processa pagamento aprovado (decrementa vagas, atualiza lead)
- `campanhas-enviar` — dispara campanha via n8n (fire-and-forget com timeout de 5s)

**Deploy:**
- Site principal: export estático → Hostinger (`amoviajar.app.br`) com `.htaccess` para RSC files
- Admin: export estático → Hostinger subdomínio (`admin.amoviajar.app.br`) com `.htaccess`
- Build obrigatório após criar/alterar viagens (dados são baked no HTML no momento do build)

---

## Etapa 4 — CRM Amo Viajar ✅ CONCLUÍDA

Cadastro único de cliente com:
- Nome, WhatsApp, cidade, data de nascimento
- Categoria favorita de destino (serra, praia, fé, cultura, interior_rj)
- Histórico de viagens (participações)
- Observações, opt-in para mensagens, opt-out
- **Importação em massa via CSV** (upload, preview com validação, inserção em lotes, deduplicação por WhatsApp)

---

## Checkout e Pagamento Online ✅ CONCLUÍDO

Reserva online pelo site com:
- Formulário de reserva (nome, WhatsApp, quantidade de pessoas)
- Checkout via **Mercado Pago** (redirect para pagamento) ou **PIX direto** (QR Code gerado no client + copia-e-cola)
- Chave PIX: CNPJ `54001832000151`
- Tabela `reservas` no Supabase
- Edge Functions: `checkout` (cria preferência MP, salva reserva) e `mp-webhook` (atualiza status no pagamento aprovado)
- Vagas decrementadas automaticamente ao aprovar pagamento

---

## Landing Page Lista VIP ✅ CONCLUÍDA (junho/2026)

Página pública de captura de leads em `/lista-vip`:
- Formulário nome + WhatsApp + cidade (opcional)
- Integração direta com Supabase (tabela `lista_vip`, RLS com policy de insert público)
- Design CRO com foto da Lisa, prova social, benefícios, mensagem humanizada
- Meta Pixel instalado globalmente (ID `1526440209138815`) — eventos PageView + Lead ativos
- `src/lib/meta-pixel.ts` — funções prontas para Lead, Contact, ViewContent, Purchase

---

## Etapa 5 — Histórico de Passageiros ⚙️ EM ANDAMENTO

Perfil completo por cliente: viagens realizadas, total de viagens, última viagem, categoria favorita.

---

## Etapa 6 — Funil Comercial ✅ CONCLUÍDA

Status do funil: Novo Lead → Contatado → Negociando → Reservado → Pago → Viajou → Perdido

Dashboard comercial com indicadores por status. Cadastro manual de lead pelo admin. Leads capturados automaticamente pelo site.

---

## Etapa 7 — Campanhas Segmentadas ✅ CONCLUÍDA

Envio em massa via WhatsApp (n8n + Evolution API) com:
- Segmentos: todos os contatos, clientes, leads, VIP, por categoria, por viagem específica
- Suporte a imagem (sendMedia) e áudio de voz (sendWhatsAppAudio)
- Log de envios em `mensagens_whatsapp`
- Duplicar campanha enviada para reenvio

---

## Etapa 8 — Integração n8n + Evolution (WhatsApp) ✅ CONCLUÍDA

Fluxo: Site → Supabase → CRM → n8n → Evolution → WhatsApp

Automações previstas:
- Aviso de abertura de viagem (segmentado por interesse)
- Alerta de últimas vagas
- Comunicações exclusivas Lista VIP
- Agradecimento pós-viagem + solicitação de depoimento

---

## Etapa 9 — Comunidade Amo Viajar

- Clube Amo Viajar
- Níveis de fidelidade
- Histórico de participação
- Aniversariantes
- Benefícios exclusivos
- Indicação premiada

---

## Visão Final

A Amo Viajar se tornará uma plataforma de relacionamento com foco em comunidade, fidelização, experiência, automação inteligente e crescimento previsível — preservando a proximidade humana da Lisa como diferencial central.
