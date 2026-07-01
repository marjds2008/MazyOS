# Parceria Premiada — Catálogo de Eventos

Todos os eventos que a plataforma produz ou consumirá. Cada evento é uma linha na
tabela `automation_queue` com `event_type` correspondente.

---

## Status do evento na fila

| Status       | Significado                                      |
|:-------------|:-------------------------------------------------|
| `pending`    | Aguardando processamento pelo n8n                |
| `processing` | n8n iniciou o processamento                      |
| `done`       | Processado com sucesso                           |
| `failed`     | Falhou — `retry_count` incrementado              |
| `cancelled`  | Cancelado manualmente (não deve ser reprocessado)|

---

## Eventos ativos

### `participant.created`

**Gatilho:** INSERT em `lucky_numbers` (trigger `trg_enqueue_participant_created`)
**Quando:** Um participante conclui o cadastro e recebe número da sorte.

**Payload:**

```json
{
  "participant_id": "uuid",
  "campaign_id":    "uuid",
  "campaign_slug":  "santa-rita-jacutinga",
  "participant_name": "Roberto Silva",
  "whatsapp":       "21997782395",
  "instagram":      "testeparceriapremiada",
  "lucky_number":   1,
  "city":           "rio de janeiro",
  "state":          "RJ",
  "created_at":     "2026-06-29T22:50:00Z"
}
```

**Ações esperadas pelo n8n:**
1. Marcar como `processing`
2. HOOK Evolution: enviar WhatsApp de boas-vindas com número da sorte
3. HOOK CRM: criar/atualizar contato
4. HOOK EMAIL: enviar email de boas-vindas (se email disponível)
5. Inserir log em `whatsapp_logs`
6. Marcar como `done` ou `failed`

---

## Eventos previstos (não implementados)

### `participant.validated`

**Gatilho:** Admin atualiza `participants.status` para `validated`
**Payload previsto:**

```json
{
  "participant_id":   "uuid",
  "campaign_id":      "uuid",
  "campaign_slug":    "string",
  "participant_name": "string",
  "whatsapp":         "string",
  "validated_at":     "ISO8601"
}
```

---

### `participant.completed`

**Gatilho:** Todas as `campaign_tasks` marcadas como `completed` para o participante
**Payload previsto:**

```json
{
  "participant_id":   "uuid",
  "campaign_id":      "uuid",
  "tasks_completed":  5,
  "completed_at":     "ISO8601"
}
```

---

### `campaign.started`

**Gatilho:** `campaigns.status` muda para `active`
**Payload previsto:**

```json
{
  "campaign_id":   "uuid",
  "campaign_slug": "string",
  "title":         "string",
  "draw_date":     "ISO8601",
  "started_at":    "ISO8601"
}
```

---

### `campaign.finished`

**Gatilho:** `campaigns.status` muda para `finished`
**Payload previsto:**

```json
{
  "campaign_id":     "uuid",
  "campaign_slug":   "string",
  "total_participants": 0,
  "finished_at":     "ISO8601"
}
```

---

### `winner.selected`

**Gatilho:** INSERT em `draw_results`
**Payload previsto:**

```json
{
  "campaign_id":      "uuid",
  "participant_id":   "uuid",
  "lucky_number":     0,
  "participant_name": "string",
  "whatsapp":         "string",
  "draw_date":        "ISO8601"
}
```

---

### `partner.created`

**Gatilho:** INSERT em `partners`
**Payload previsto:**

```json
{
  "partner_id":   "uuid",
  "campaign_id":  "uuid",
  "name":         "string",
  "instagram":    "string",
  "created_at":   "ISO8601"
}
```

---

### `partner.approved`

**Gatilho:** `partners.status` muda para `approved`
**Payload previsto:** igual ao `partner.created`

---

### `notification.send`

**Gatilho:** INSERT em `notifications` com `status='pending'`
**Payload previsto:**

```json
{
  "notification_id": "uuid",
  "participant_id":  "uuid",
  "channel":         "whatsapp",
  "type":            "task_reminder",
  "title":           "string",
  "message":         "string"
}
```

---

## Endpoints de consumo

| Método | Endpoint                      | Uso                                   |
|:-------|:------------------------------|:--------------------------------------|
| GET    | `/api/automation/pending`     | n8n busca eventos pendentes           |
| POST   | `/api/automation/update`      | n8n atualiza status após processar    |
| POST   | `/api/automation/retry`       | Admin reprocessa evento com erro      |
| GET    | `/api/automation/stats`       | Admin monitora totais por status      |
