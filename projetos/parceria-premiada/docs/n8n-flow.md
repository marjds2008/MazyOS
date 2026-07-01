# Parceria Premiada — Fluxo n8n

Guia técnico para integrar o n8n com a fila de automação da plataforma.

---

## Arquitetura geral

```
Landing (formulário)
  │
  ▼
Supabase RPC: create_participant_with_number
  │  (cria participante + número da sorte atomicamente)
  │
  ▼
Trigger: trg_enqueue_participant_created
  │  (disparado ao inserir lucky_number)
  │
  ▼
automation_queue  ← evento: participant.created
  │
  ▼
n8n (polling ou webhook)
  │
  ├─► Evolution API → WhatsApp do participante
  │
  ├─► CRM (futuro)
  │
  └─► Email (futuro)
        │
        ▼
  POST /api/automation/update  ← marca done ou failed
        │
        ▼
  whatsapp_logs (INSERT via n8n ou Evolution)
```

**A landing não espera nenhuma automação.** O cadastro é confirmado assim que
o Supabase responde. Toda automação acontece de forma assíncrona via fila.

---

## Princípios de design

| Princípio              | Implementação                                               |
|:-----------------------|:------------------------------------------------------------|
| Desacoplamento         | Landing não conhece o n8n                                   |
| Regras no Supabase     | n8n apenas executa — lógica de negócio permanece no banco   |
| Idempotência           | Verificar `status != 'done'` antes de processar             |
| Rastreabilidade        | Toda ação registrada em `whatsapp_logs` ou `pp_audit_logs`  |
| Resiliência            | Falhas incrementam `retry_count` — não perdem o evento      |

---

## Configuração no n8n

### Workflow: Processar automation_queue

**1. Trigger: Schedule (a cada 1 minuto)**

```
Tipo: Schedule Trigger
Intervalo: 1 minuto
```

**2. Nó: HTTP Request — Buscar eventos pendentes**

```
Método: GET
URL: https://admin.amoviajar.app.br/api/automation/pending?limit=10
Headers:
  Content-Type: application/json
  # TODO: adicionar Authorization header quando auth for implementada
```

**3. Nó: IF — Há eventos?**

```
Condição: {{ $json.count }} > 0
```

**4. Nó: SplitInBatches — Processar um por vez**

```
Batch Size: 1
```

**5. Nó: HTTP Request — Marcar como processing**

```
Método: POST
URL: https://admin.amoviajar.app.br/api/automation/update
Body:
{
  "queue_id": "{{ $json.events[0].queue_id }}",
  "status":   "processing"
}
```

**6. Nó: Switch — Roteamento por event_type**

```
participant.created → Branch A
participant.validated → Branch B (futuro)
(outros) → Branch Default (marcar done sem ação)
```

**7. Branch A: participant.created**

```
7a. HOOK Evolution: POST para Evolution API
    Endpoint: /message/sendText/<instance>
    Body: {
      number:  "55{{ payload.whatsapp }}",
      text:    "Olá {{ payload.participant_name }}! Seu número da sorte é PP-{{ payload.lucky_number }}..."
    }

7b. HTTP Request → POST /api/automation/update
    Body: { queue_id, status: "done" }
    (ou status: "failed" se Evolution retornou erro)
```

**8. Nó: Error Handling**

```
Se qualquer nó falhar:
  POST /api/automation/update
  Body: {
    "queue_id": "{{ $json.queue_id }}",
    "status":   "failed",
    "error":    "{{ $json.error.message }}"
  }
```

---

## Domínios do projeto

| Componente | URL |
|---|---|
| Landing PP (site estático) | `https://parceriapremiada.app.br` |
| API de automação | `https://admin.amoviajar.app.br/api/automation/` |
| Supabase | `https://supabase.mundodosbots.app.br` |
| Evolution API | `https://api.mundodosbots.app.br` |
| n8n | `https://mundodosbots.app.br` |

> `parceriapremiada.app.br` é HTML estático — não serve API.
> Os endpoints `/api/automation/` ficam no Next.js do Amo Viajar em `admin.amoviajar.app.br`.

---

## Variáveis de ambiente necessárias no n8n

```env
ADMIN_API_BASE_URL=https://admin.amoviajar.app.br
AUTOMATION_API_KEY=<a definir quando auth for implementada>
SUPABASE_URL=https://supabase.mundodosbots.app.br
SUPABASE_ANON_KEY=<anon key do Supabase>
EVOLUTION_API_URL=https://api.mundodosbots.app.br
EVOLUTION_API_KEY=<ver credenciais no manager: api.mundodosbots.app.br/manager>
EVOLUTION_INSTANCE_NAME=Parceria Premiada
```

---

## Endpoint de retry (admin)

Para reprocessar um evento com falha manualmente:

```bash
curl -X POST https://admin.amoviajar.app.br/api/automation/retry \
  -H "Content-Type: application/json" \
  -d '{ "queue_id": "<uuid>" }'
```

---

## Verificação de saúde

```bash
# Ver eventos pendentes
curl https://admin.amoviajar.app.br/api/automation/pending?limit=5

# Ver estatísticas da fila
curl https://admin.amoviajar.app.br/api/automation/stats
```
