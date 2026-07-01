# Parceria Premiada — Contrato de Eventos

Este documento é a referência oficial para todos os eventos da plataforma.
Todo fluxo n8n deve ser construído com base neste contrato.

**Regra fundamental:** O Supabase é a fonte da verdade. O n8n executa.
Nenhuma lógica de negócio deve existir dentro do n8n.

---

## Estrutura base de um evento

Todo evento na `automation_queue` segue esta estrutura:

```json
{
  "queue_id":    "uuid",
  "event_type":  "participant.created",
  "entity_type": "participant",
  "entity_id":   "uuid",
  "campaign_id": "uuid",
  "payload":     { ... },
  "retry_count": 0,
  "created_at":  "ISO8601"
}
```

---

## Contrato: `participant.created`

**Status:** ✅ Ativo

**Gatilho:** Trigger `trg_enqueue_participant_created` no INSERT de `lucky_numbers`

**Garantias:**
- Gerado exatamente uma vez por cadastro
- `lucky_number` é único por campanha
- `whatsapp` contém apenas dígitos (sem formatação)
- `instagram` está em lowercase, sem `@`

**Payload completo:**

```json
{
  "participant_id":   "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "campaign_id":      "7e4a6b8c-3f2d-4a1e-8d9c-1b2c3d4e5f60",
  "campaign_slug":    "santa-rita-jacutinga",
  "participant_name": "Roberto Silva",
  "whatsapp":         "21997782395",
  "instagram":        "robertosilva",
  "lucky_number":     1,
  "city":             "rio de janeiro",
  "state":            "RJ",
  "created_at":       "2026-06-29T22:50:00Z"
}
```

**Campos opcionais (podem ser null):**
- `instagram` — participante pode não ter informado
- `city`, `state` — campos opcionais no formulário

**Ações esperadas do consumidor (n8n):**

```
1. marcar como processing
2. enviar WhatsApp de boas-vindas (HOOK Evolution)
3. criar contato no CRM (HOOK CRM)
4. enviar email de boas-vindas se email disponível (HOOK Email)
5. registrar em whatsapp_logs
6. marcar como done
```

**Em caso de falha:**
- Marcar como `failed` com `error_message`
- `retry_count` é incrementado automaticamente pelo RPC `update_queue_status`
- Reprocessar via `POST /api/automation/retry`

---

## Contrato: `participant.validated`

**Status:** 🔜 Previsto

**Gatilho:** Admin atualiza `participants.status = 'validated'`
**Implementação:** Trigger `AFTER UPDATE ON participants` (a criar)

**Payload previsto:**

```json
{
  "participant_id":   "uuid",
  "campaign_id":      "uuid",
  "campaign_slug":    "string",
  "participant_name": "string",
  "whatsapp":         "string",
  "lucky_number":     0,
  "validated_at":     "ISO8601"
}
```

---

## Contrato: `participant.completed`

**Status:** 🔜 Previsto

**Gatilho:** Todas as `campaign_tasks` com `required=true` marcadas como `completed`
**Implementação:** Trigger ou RPC de validação de progresso (a criar)

**Payload previsto:**

```json
{
  "participant_id":   "uuid",
  "campaign_id":      "uuid",
  "campaign_slug":    "string",
  "participant_name": "string",
  "whatsapp":         "string",
  "tasks_completed":  5,
  "tasks_total":      5,
  "completed_at":     "ISO8601"
}
```

---

## Contrato: `campaign.started`

**Status:** 🔜 Previsto

**Gatilho:** `campaigns.status` → `active`
**Implementação:** Trigger `AFTER UPDATE ON campaigns` (a criar)

**Payload previsto:**

```json
{
  "campaign_id":          "uuid",
  "campaign_slug":        "string",
  "title":                "string",
  "draw_date":            "ISO8601",
  "total_participants":   0,
  "started_at":           "ISO8601"
}
```

---

## Contrato: `campaign.finished`

**Status:** 🔜 Previsto

**Gatilho:** `campaigns.status` → `finished`

**Payload previsto:**

```json
{
  "campaign_id":          "uuid",
  "campaign_slug":        "string",
  "title":                "string",
  "total_participants":   0,
  "total_numbers":        0,
  "finished_at":          "ISO8601"
}
```

---

## Contrato: `winner.selected`

**Status:** 🔜 Previsto

**Gatilho:** INSERT em `draw_results`
**Implementação:** Trigger `AFTER INSERT ON draw_results` (a criar)

**Payload previsto:**

```json
{
  "campaign_id":      "uuid",
  "campaign_slug":    "string",
  "participant_id":   "uuid",
  "participant_name": "string",
  "whatsapp":         "string",
  "lucky_number":     0,
  "draw_date":        "ISO8601"
}
```

---

## Contrato: `partner.created`

**Status:** 🔜 Previsto

**Payload previsto:**

```json
{
  "partner_id":       "uuid",
  "campaign_id":      "uuid",
  "campaign_slug":    "string",
  "name":             "string",
  "instagram":        "string",
  "instagram_url":    "string",
  "created_at":       "ISO8601"
}
```

---

## Contrato: `partner.approved`

**Status:** 🔜 Previsto

**Payload previsto:** igual ao `partner.created` com campo adicional:

```json
{
  ...
  "approved_at": "ISO8601"
}
```

---

## Contrato: `notification.send`

**Status:** 🔜 Previsto

**Payload previsto:**

```json
{
  "notification_id": "uuid",
  "participant_id":  "uuid",
  "campaign_id":     "uuid",
  "campaign_slug":   "string",
  "channel":         "whatsapp",
  "type":            "task_reminder",
  "title":           "string",
  "message":         "string"
}
```

---

## Regras de idempotência

O n8n DEVE verificar o status atual antes de processar:

```
SE status == 'done' → pular (já processado)
SE status == 'processing' → verificar se não é processamento paralelo
SE status == 'cancelled' → pular
SE status == 'pending' → processar
```

---

## Ciclo de vida de um evento

```
pending
  │
  ├─► processing ──► done
  │
  └─► failed ──► pending (via retry)
                    │
                    └─► failed (max retries → cancelar manualmente)
```

**Limite de retries sugerido:** 3 tentativas. Após a 3ª falha, marcar como
`cancelled` e alertar o admin.

---

## Versionamento

Este contrato é a versão `1.0` do event schema da Parceria Premiada.
Mudanças que quebrem compatibilidade devem incrementar a versão e manter
um campo `schema_version` no payload.
