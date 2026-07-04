# n8n — Eventos da Parceria Premiada

Documentação dos eventos que transitam pela `automation_queue` e são consumidos pelos workflows n8n.

---

## Evento: `participant.created`

Disparado sempre que um novo participante é registrado com sucesso via `create_participant_with_number`.

### Payload completo (Draw Engine v2)

```json
{
  "event_type": "participant.created",
  "participant_id": "uuid-do-participante",
  "campaign_id": "uuid-da-campanha",
  "campaign_slug": "nome-da-campanha",
  "campaign_title": "Nome Completo da Campanha",

  "name": "Nome do Participante",
  "participant_name": "Nome do Participante",
  "whatsapp": "(21) 99999-9999",
  "instagram": "@usuario",
  "city": "Rio de Janeiro",
  "state": "RJ",
  "email": "opcional@email.com",

  "lucky_number": 42,
  "sequence_number": 7,
  "display_number": 58391,
  "display_number_fmt": "58391",
  "display_hash": "a3f9c2...8d1e",
  "numero_sorte": "PP-58391",

  "created_at": "2026-06-29T15:30:00Z"
}
```

### Campos — Número da Sorte

| Campo | Tipo | Presença | Descrição |
|-------|------|----------|-----------|
| `lucky_number` | int | sempre | Número sequencial (legado, 1, 2, 3...) |
| `sequence_number` | int | Draw Engine ativo | Posição na sequência da campanha (1-based) |
| `display_number` | int | Draw Engine ativo | Número da sorte do Draw Engine (0–99999) |
| `display_number_fmt` | string | Draw Engine ativo | Zero-padded: `"58391"` |
| `display_hash` | string | Draw Engine ativo | `SHA256(seed:sequence:display_number)` |
| `numero_sorte` | string | Draw Engine ativo | Formatado: `"PP-58391"` |

**Regra de uso no workflow WhatsApp:**
1. Se `display_number` existe → `PP-` + `display_number.padStart(5, '0')`
2. Senão se `lucky_number` existe → `PP-` + `lucky_number.padStart(5, '0')` (fallback legado)
3. Senão → lançar erro (campanha sem seed configurada)

---

### Como o evento é gerado

```sql
-- fn_enqueue_participant_created (trigger em pp_participantes)
INSERT INTO automation_queue (event_type, payload, status)
VALUES (
  'participant.created',
  jsonb_build_object(
    'participant_id',    NEW.id,
    'campaign_id',       NEW.campanha_id,
    'campaign_slug',     c.slug,
    'name',              NEW.nome,
    'participant_name',  NEW.nome,
    'whatsapp',          NEW.telefone,
    'lucky_number',      ln.number,          -- legado
    'sequence_number',   NEW.sequence_number, -- Draw Engine v2
    'display_number',    NEW.display_number,  -- Draw Engine v2
    'display_number_fmt',NEW.display_number_fmt,
    'display_hash',      NEW.display_hash,
    'numero_sorte',      'PP-' || NEW.display_number_fmt,
    'created_at',        NEW.created_at
  ),
  'pending'
);
```

---

### Como o evento é consumido

Workflow: [participant-created-whatsapp-draw-engine.json](../projetos/parceria-premiada/n8n/workflows/participant-created-whatsapp-draw-engine.json)

1. Cron 1min → GET `/api/automation/pending?limit=20`
2. Loop → Marcar `processing`
3. Normalizar dados e montar mensagem (prioridade Draw Engine)
4. Verificar idempotência (`check_whatsapp_sent`)
5. Enviar via Evolution API
6. Registrar em `whatsapp_logs` + marcar `done`/`failed`

---

## Estados da `automation_queue`

| Status | Descrição |
|--------|-----------|
| `pending` | Evento aguardando processamento |
| `processing` | Workflow está processando (lock) |
| `done` | Enviado com sucesso |
| `failed` | Falhou — ver `error` field |

---

## Idempotência

A RPC `check_whatsapp_sent(p_participant_id, p_campaign_id, p_type)` verifica se já existe um registro em `whatsapp_logs` para a combinação. Retorna `{ already_sent: boolean }`.

Garante que um participante não receba duplicatas caso o evento fique em fila por mais de um ciclo de 1 minuto.

---

## Eventos futuros previstos

| Evento | Trigger | Status |
|--------|---------|--------|
| `participant.validated` | Admin valida participação no Instagram | Planejado |
| `winner.selected` | Sorteio realizado pelo Draw Engine | Planejado |
| `partner.lead` | Formulário de parceiro enviado | Planejado |
