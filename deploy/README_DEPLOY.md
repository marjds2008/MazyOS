# Deploy — Parceria Premiada

Stack Docker Swarm com Traefik v3.4. Dois serviços independentes:
- `parceria_site` → landing estática em nginx (parceriapremiada.app.br)
- `parceria_admin` → Next.js BackOffice (admin.parceriapremiada.app.br)

---

## 1. Pré-requisitos

Na VPS, confirmar que todos estão ativos:

```bash
docker node ls                        # Swarm ativo
docker network ls | grep starlink     # rede overlay existe
docker service ls | grep traefik      # Traefik rodando
```

DNS dos domínios apontando para o IP da VPS:
- `parceriapremiada.app.br` → IP da VPS
- `admin.parceriapremiada.app.br` → IP da VPS

---

## 2. Preparar o ambiente

```bash
# Clonar ou atualizar o repo na VPS
git clone https://github.com/marjds2008/MazyOS.git /opt/parceria
# ou, se já existe:
cd /opt/parceria && git pull

# Criar o .env a partir do exemplo
cp deploy/.env.example deploy/.env
nano deploy/.env   # preencher SUPABASE_ANON_KEY e demais valores
```

---

## 3. Build das imagens

> O `docker stack deploy` não faz build — as imagens precisam existir antes do deploy.
> As variáveis `NEXT_PUBLIC_*` são baked no bundle do Next.js em build time.

```bash
cd /opt/parceria

# Carregar variáveis do .env
export $(grep -v '^#' deploy/.env | xargs)

# Build da landing (site estático)
docker build \
  -t parceria_site:prod \
  -f projetos/parceria-premiada/site/Dockerfile \
  projetos/parceria-premiada/site/

# Build do admin (Next.js — usa SUPABASE_URL e SUPABASE_ANON_KEY como build args)
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  -t parceria_admin:prod \
  -f admin/Dockerfile \
  admin/
```

---

## 4. Deploy da stack

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
```

Esperar status `1/1` em ambos antes de testar.

---

## 5. Ver logs

```bash
# Landing
docker service logs -f parceria_parceria_site

# Admin
docker service logs -f parceria_parceria_admin
```

---

## 6. Restart forçado (após novo build)

```bash
docker service update --force parceria_parceria_site
docker service update --force parceria_parceria_admin
```

---

## 7. Remover a stack

```bash
docker stack rm parceria
```

---

## 8. Testes após deploy

| Teste | URL | Esperado |
|-------|-----|----------|
| Landing carrega | https://parceriapremiada.app.br | Página da campanha |
| Admin carrega | https://admin.parceriapremiada.app.br | Tela de login / dashboard |
| SSL ativo | Ambos | Cadeado verde, cert Let's Encrypt |
| Cadastro na landing | Formulário de participação | Participante salvo no Supabase |
| Admin mostra dados | Dashboard PP | Totais corretos |
| n8n continua enviando | — | Logs de WhatsApp no admin |

---

## 9. Rebuild após alteração de código

```bash
cd /opt/parceria && git pull

export $(grep -v '^#' deploy/.env | xargs)

# Rebuildar apenas o serviço alterado
docker build -t parceria_admin:prod \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  -f admin/Dockerfile admin/

docker service update --force parceria_parceria_admin
```

---

## Estrutura dos arquivos

```
deploy/
├── docker-compose.prod.yml   ← Stack Swarm (site + admin)
├── .env.example              ← Template de variáveis
├── .env                      ← Valores reais (não commitar)
└── README_DEPLOY.md          ← Este arquivo

projetos/parceria-premiada/site/
├── Dockerfile                ← nginx:alpine, serve HTML estático
└── .dockerignore

admin/
├── Dockerfile                ← node:20-alpine, multi-stage build
└── .dockerignore
```
