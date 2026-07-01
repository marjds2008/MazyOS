# Changelog — Parceria Premiada

Todas as sprints do projeto, em ordem cronológica.

---

## Sprint 10 — Deploy Produção
**Docker Swarm + Traefik v3.4**

- Dockerfiles criados: `site/Dockerfile` (nginx-unprivileged) e `admin/Dockerfile` (node multi-stage)
- `deploy/docker-compose.prod.yml` com labels Traefik, rede `starlink`, sem portas expostas
- `.env.example` com todas as variáveis necessárias
- `deploy/README_DEPLOY.md` com instruções completas de build e deploy
- Imagens com usuário não-root e HEALTHCHECK
- `.gitignore` revisado — `deploy/.env` e `dist/` excluídos
- `service_role` JWT removido do workflow n8n versionado

---

## Sprint 9 — BackOffice Operacional
**7 módulos no admin.parceriapremiada.app.br**

- Dashboard PP com 8 métricas em cards clicáveis
- Participantes: busca, filtro por campanha, modal de detalhe, exportar CSV
- Parceiros: lista com filtro por campanha, links Instagram
- Automações: fila de eventos com retry manual para `failed/cancelled`
- WhatsApp Logs: histórico de envios com filtros de status e tipo
- Configurações: constantes do sistema e status dos serviços
- Sidebar com seção "Parceria Premiada" (ícone Trophy âmbar)
- 6 RPCs `SECURITY DEFINER` criadas no Supabase (`006_backoffice_read_rpcs.sql`)
- Admin migrado de `output: export` para servidor Node.js (compatibilidade com API routes)

---

## Sprint 8 — n8n + Evolution API
**WhatsApp end-to-end**

- Workflow `PP — participant.created → WhatsApp` criado e publicado no n8n
- Integração Evolution API com instância "Parceria Premiada"
- Fix: SplitInBatches com branches Done/Loop invertidas — corrigido
- Fix: credenciais de autenticação adicionadas ao nó "Marcar como Done"
- Workflow testado com participante real (Roberto) — WhatsApp recebido com sucesso
- Workflow publicado e ativo

---

## Sprint 7 — Contrato de Eventos
**Padronização do contrato `participant.created`**

- Documentação do contrato em `docs/event-contract.md`
- Schema de payload definido: `participant_id`, `campaign_id`, `whatsapp`, `name`, `lucky_number`
- Guia de logging em `docs/logging.md`
- Documentação do fluxo n8n em `docs/n8n-flow.md` e `docs/n8n-events.md`

---

## Sprint 6 — Automation Queue
**Fila de eventos assíncrona**

- Tabela `automation_queue` criada (`004_automation_queue.sql`)
- Trigger `on_participant_created` popula a fila automaticamente
- Campo `type` adicionado em `whatsapp_logs` (`005_whatsapp_logs_type.sql`)
- Campos: `event_type`, `entity_type`, `entity_id`, `status`, `retry_count`, `error_message`
- n8n lê da fila, processa e atualiza status via RPCs

---

## Sprint 5 — Motor de Regras
**Regras de campanha e validação**

- Tabela `campaign_rules` criada (`003_campaign_rules.sql`)
- Validações: limite de participantes, período de inscrição, elegibilidade por estado
- RPC `validate_participant_eligibility` com retorno estruturado
- Números da sorte gerados automaticamente via trigger com formatação `PP-000001`

---

## Sprint 4 — Admin BackOffice (Base)
**Painel de administração inicial**

- Next.js admin com layout, sidebar e autenticação básica
- Módulos Amo Viajar: Campanhas, Viagens, Clientes, Galeria, Funil, Dashboard
- Cliente Supabase browser e servidor configurados
- API route `campanhas/enviar` integrada com n8n webhook

---

## Sprint 3 — Supabase Schema
**Banco de dados completo**

- Schema inicial: `participants`, `campaigns`, `partners`, `campaign_partners`, `lucky_numbers` (`001_initial_schema.sql`)
- Views de leitura para admin (`002_admin_read_views.sql`)
- RLS configurado: anon pode ler campanhas/parceiros; participantes protegidos por RPCs
- Supabase self-hosted na VPS (Contabo) via Docker Swarm

---

## Sprint 2 — Motor de Campanhas
**Múltiplas campanhas com slugs**

- Suporte a múltiplas campanhas simultâneas via `slug`
- `campaign.html` com carregamento dinâmico por URL (`?slug=nome-da-campanha`)
- Serviços JS modulares: `campaignService`, `participantService`, `luckyNumberService`, `partnerService`
- Página de confirmação com número da sorte exibido

---

## Sprint 1 — Landing Pública
**Site estático do sorteio**

- `index.html` com formulário de participação (nome, WhatsApp, Instagram, cidade/estado)
- Integração Supabase JS (anon key, RLS)
- `confirmacao.html` com número da sorte
- `regulamento.html`
- `js/config.js` com configuração centralizada do Supabase
- Design responsivo com identidade visual da Parceria Premiada
