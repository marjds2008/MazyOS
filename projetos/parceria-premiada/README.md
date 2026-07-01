# Parceria Premiada

Plataforma de sorteios colaborativos que conecta consumidores e parceiros comerciais.
Consumidores participam de sorteios de viagem; parceiros patrocinam e ganham visibilidade.

---

## Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│  parceriapremiada.app.br        admin.parceriapremiada.app.br │
│  Landing (HTML estático)        BackOffice (Next.js)          │
└───────────────┬─────────────────────────────┬────────────────┘
                │                             │
                ▼                             ▼
         ┌─────────────┐              ┌──────────────┐
         │   Supabase  │◄─────────────│  RPCs admin  │
         │  PostgreSQL │              │  SECURITY    │
         │  + RLS      │              │  DEFINER     │
         └──────┬──────┘              └──────────────┘
                │
         ┌──────▼──────┐
         │     n8n     │──► Evolution API ──► WhatsApp
         │  Automação  │
         └─────────────┘

Infraestrutura: Docker Swarm + Traefik v3.4 (rede overlay: starlink)
VPS: Contabo | Domínios: parceriapremiada.app.br
```

---

## Estrutura das pastas

```
projetos/parceria-premiada/
├── site/                  ← Landing pública (HTML/JS estático)
│   ├── index.html         ← Página principal com formulário
│   ├── campaign.html      ← Página de campanha dinâmica
│   ├── confirmacao.html   ← Confirmação de participação
│   ├── regulamento.html   ← Regulamento
│   ├── js/
│   │   ├── config.js          ← Supabase URL + anon key
│   │   ├── campaigns.js       ← Lógica principal
│   │   ├── supabase-client.js ← Cliente Supabase
│   │   └── services/          ← campaignService, participantService…
│   └── Dockerfile         ← nginx-unprivileged:alpine, porta 8080
│
├── supabase/migrations/   ← SQL versionado (aplicar em ordem)
│   ├── 001_initial_schema.sql
│   ├── 002_admin_read_views.sql
│   ├── 003_campaign_rules.sql
│   ├── 004_automation_queue.sql
│   ├── 005_whatsapp_logs_type.sql
│   └── 006_backoffice_read_rpcs.sql
│
├── n8n/workflows/
│   └── participant-created-whatsapp.json  ← Workflow exportado
│
└── docs/
    ├── event-contract.md   ← Contrato participant.created
    ├── n8n-events.md
    ├── n8n-flow.md
    └── logging.md
```

O BackOffice (Next.js) fica em `/admin` na raiz do repositório.

---

## Rodar localmente

### Landing (site estático)

```bash
cd projetos/parceria-premiada/site

# Editar js/config.js com SUPABASE_URL e SUPABASE_ANON_KEY
# Abrir index.html no browser ou:
npx serve .
```

### Admin BackOffice (Next.js)

```bash
cd admin
cp .env.local.example .env.local
# Preencher NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev    # http://localhost:3000
```

---

## Configurar Supabase

Supabase self-hosted rodando na VPS. Migrations aplicadas via SSH:

```bash
# Conectar na VPS
ssh root@<VPS_IP>

# Aplicar migrations (via docker exec no container postgres)
docker exec -i <postgres_container> psql -U postgres -d postgres < /caminho/001_initial_schema.sql
# ... repetir para 002 a 006 em ordem
```

> Variáveis necessárias:
> - `SUPABASE_URL` → URL pública do Supabase self-hosted
> - `SUPABASE_ANON_KEY` → chave anon (segura para uso público via RLS)

---

## Configurar n8n

1. Acessar `https://n8n.mundodosbots.app.br`
2. Importar `n8n/workflows/participant-created-whatsapp.json`
3. Configurar credenciais no n8n (não no JSON):
   - **Supabase**: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE` key
   - **Evolution API**: URL + API key + nome da instância
4. Ativar o workflow

> O JSON de workflow exportado tem `SUPABASE_SERVICE_ROLE` marcado como
> `REDACTED_CONFIGURE_IN_N8N_CREDENTIALS`. Nunca commitar a chave real.

---

## Deploy em produção

Ver [`../../deploy/README_DEPLOY.md`](../../deploy/README_DEPLOY.md).

```bash
# Da raiz do repositório
cp deploy/.env.example deploy/.env
nano deploy/.env   # preencher SUPABASE_ANON_KEY e demais

export $(grep -v '^#' deploy/.env | xargs)

docker build -t parceria_site:prod \
  -f projetos/parceria-premiada/site/Dockerfile \
  projetos/parceria-premiada/site/

docker build -t parceria_admin:prod \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  -f admin/Dockerfile admin/

docker stack deploy -c deploy/docker-compose.prod.yml parceria
```

---

## Roadmap

| Sprint | Entrega | Status |
|--------|---------|--------|
| 1  | Landing pública com formulário de participação | ✅ Concluído |
| 2  | Motor de campanhas (múltiplas campanhas, slugs) | ✅ Concluído |
| 3  | Supabase: schema completo, RLS, números da sorte | ✅ Concluído |
| 4  | Admin inicial (integração Amo Viajar BackOffice) | ✅ Concluído |
| 5  | Motor de regras de campanha | ✅ Concluído |
| 6  | Automation Queue (fila de eventos assíncrona) | ✅ Concluído |
| 7  | Contrato de eventos n8n (`participant.created`) | ✅ Concluído |
| 8  | n8n + Evolution API (WhatsApp end-to-end) | ✅ Concluído |
| 9  | BackOffice Operacional PP (7 módulos admin) | ✅ Concluído |
| 10 | Deploy produção (Docker Swarm + Traefik) | ✅ Concluído |
