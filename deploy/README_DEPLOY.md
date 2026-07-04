# Deploy — Parceria Premiada

Stack Docker Swarm com Traefik v3.4. Dois serviços independentes:
- `parceria_site`  → landing estática em nginx (`parceriapremiada.app.br`)
- `parceria_admin` → PP Admin Next.js 16 isolado (`admin.parceriapremiada.app.br`)

> **PP Admin** é um app Next.js separado em `projetos/parceria-premiada/admin/`
> (não confundir com `admin/` que é o Amo Viajar admin)

---

## 1. Pré-requisitos

**[VPS]** — confirmar que tudo está ativo:

```bash
docker node ls                        # Swarm ativo
docker network ls | grep starlink     # rede overlay existe
docker service ls | grep traefik      # Traefik rodando
```

DNS apontando pro IP da VPS (`86.48.5.174`):
- `parceriapremiada.app.br`
- `admin.parceriapremiada.app.br`

---

## 2. Preparar o ambiente na VPS

**[VPS]**:

```bash
# Clonar ou atualizar o repo
cd /opt/parceria && git pull

# Criar .env a partir do exemplo (só na primeira vez)
cp deploy/.env.example deploy/.env
nano deploy/.env    # preencher SUPABASE_ANON_KEY e EVOLUTION_API_KEY
```

Conteúdo mínimo do `.env`:

```env
SUPABASE_URL=https://supabase.mundodosbots.app.br
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PUBLIC_SITE_URL=https://parceriapremiada.app.br
ADMIN_API_BASE_URL=https://admin.parceriapremiada.app.br
```

---

## 3. Build das imagens

> `docker stack deploy` não faz build. As imagens precisam existir antes do deploy.
> `NEXT_PUBLIC_*` são baked no bundle do Next.js em build time.

**[VPS]**:

```bash
cd /opt/parceria

# Carregar variáveis
export $(grep -v '^#' deploy/.env | xargs)

# Build do PP Admin (novo app isolado)
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  -t parceria_admin:prod \
  projetos/parceria-premiada/admin/

# Build da landing (se alterada)
docker build \
  -t parceria_site:prod \
  projetos/parceria-premiada/site/
```

---

## 4. Deploy da stack

**[VPS]**:

```bash
cd /opt/parceria

docker stack deploy \
  --with-registry-auth \
  -c deploy/docker-compose.prod.yml \
  parceria
```

Aguardar os serviços subirem:

```bash
docker service ls | grep parceria
# Esperar status 1/1 em ambos
```

---

## 5. Ver logs

**[VPS]**:

```bash
# PP Admin
docker service logs -f parceria_parceria_admin

# Landing
docker service logs -f parceria_parceria_site
```

---

## 6. Restart forçado (após novo build)

**[VPS]**:

```bash
docker service update --force parceria_parceria_admin
docker service update --force parceria_parceria_site
```

---

## 7. Rebuild após alteração de código

**[LOCAL]** — commitar e enviar:

```bash
git add -p
git commit -m "..."
git push
```

**[VPS]** — puxar e rebuildar:

```bash
cd /opt/parceria && git pull

export $(grep -v '^#' deploy/.env | xargs)

docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  -t parceria_admin:prod \
  projetos/parceria-premiada/admin/

docker service update --force parceria_parceria_admin
```

---

## 8. Remover a stack

**[VPS]**:

```bash
docker stack rm parceria
```

---

## 9. Testes após deploy

| Teste | URL | Esperado |
|-------|-----|----------|
| Landing carrega | https://parceriapremiada.app.br | Página da campanha |
| Admin carrega | https://admin.parceriapremiada.app.br | Tela de login (amber) |
| SSL ativo | Ambos | Cadeado verde, cert Let's Encrypt |
| Login funciona | /login → /dashboard | Dashboard com stats |
| Admin **não** interfere no AV | admin.amoviajar.app.br | AV admin continua normal |

---

## 10. Estrutura dos arquivos

```
deploy/
├── docker-compose.prod.yml            ← Stack Swarm (site + pp-admin)
├── .env.example                       ← Template (commitar)
├── .env                               ← Valores reais (NÃO commitar)
└── README_DEPLOY.md                   ← Este arquivo

projetos/parceria-premiada/
├── admin/
│   ├── Dockerfile                     ← node:20-alpine, multi-stage
│   ├── .dockerignore
│   └── src/ ...                       ← Next.js 16, porta 3000 no container
└── site/
    ├── Dockerfile                     ← nginx:alpine, porta 8080
    └── .dockerignore

admin/                                 ← Amo Viajar admin (app SEPARADO)
└── Dockerfile                         ← deploy independente, não interfere aqui
```

---

## 11. Portas e roteamento

| Serviço | Container | Traefik | Domínio |
|---------|-----------|---------|---------|
| `parceria_site` | 8080 | websecure + TLS | `parceriapremiada.app.br` |
| `parceria_admin` | 3000 | websecure + TLS | `admin.parceriapremiada.app.br` |

Nenhuma porta é exposta diretamente — tudo passa pela rede `starlink` via Traefik.
