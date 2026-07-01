# Parceria Premiada — Estratégia de Logging

Guia das tabelas de log e rastreabilidade da plataforma.

---

## Tabelas de log

### `automation_queue`

**Propósito:** Fila central de eventos assíncronos. É o log primário de tudo que
aconteceu ou precisa acontecer na automação.

**Quando usar:** Para rastrear o ciclo de vida de cada evento desde a criação até
o processamento final.

```sql
SELECT * FROM automation_queue
WHERE event_type = 'participant.created'
ORDER BY created_at DESC;
```

| Campo           | Uso no log                                        |
|:----------------|:--------------------------------------------------|
| `status`        | Estado atual do processamento                     |
| `retry_count`   | Quantas vezes falhou                              |
| `error_message` | Último erro registrado                            |
| `processed_at`  | Quando foi processado com sucesso                 |
| `payload`       | Snapshot dos dados no momento do evento           |

---

### `whatsapp_logs`

**Propósito:** Registro de cada mensagem WhatsApp enviada via Evolution API.

**Quando usar:** Para auditar envios, rastrear entregas e diagnosticar falhas de
mensageria.

**Campos esperados (a implementar quando Evolution for integrada):**

```sql
-- Estrutura sugerida para whatsapp_logs
participant_id  UUID      -- destinatário
campaign_id     UUID      -- campanha
phone           TEXT      -- número formatado com 55
message         TEXT      -- conteúdo enviado
status          TEXT      -- queued | sent | delivered | failed
evolution_id    TEXT      -- ID retornado pela Evolution API
sent_at         TIMESTAMPTZ
created_at      TIMESTAMPTZ
```

**Nota:** A tabela `whatsapp_logs` já existe no schema (migration 001). O n8n
deve inserir um registro após cada tentativa de envio, seja sucesso ou falha.

---

### `pp_audit_logs`

**Propósito:** Auditoria de operações críticas — criação de participantes,
atualização de status, alterações administrativas.

**Quando usar:** Para rastrear quem fez o quê e quando em operações sensíveis.

```sql
SELECT * FROM pp_audit_logs
WHERE table_name = 'participants'
ORDER BY created_at DESC;
```

| Campo        | Uso                                              |
|:-------------|:-------------------------------------------------|
| `table_name` | Tabela afetada (`participants`, `campaigns`, ...) |
| `record_id`  | UUID do registro alterado                        |
| `action`     | `INSERT`, `UPDATE`, `STATUS_CHANGE`, etc.        |
| `description`| Descrição legível da operação                    |

**Criado por:** RPC `create_participant_with_number` (Sprint 3).

---

### `participant_actions`

**Propósito:** Log de progresso de cada participante em cada tarefa da campanha.

**Quando usar:** Para saber quais tarefas foram concluídas, rejeitadas ou ainda
pendentes para cada participante.

```sql
SELECT ct.name, pa.status, pa.completed_at
FROM participant_actions pa
JOIN campaign_tasks ct ON ct.id = pa.campaign_task_id
WHERE pa.participant_id = '<uuid>'
ORDER BY ct.display_order;
```

| Status      | Significado                                        |
|:------------|:---------------------------------------------------|
| `pending`   | Tarefa ainda não completada pelo participante       |
| `completed` | Tarefa verificada e aprovada                       |
| `rejected`  | Tentativa rejeitada (prova inválida, por exemplo)  |

**HOOK N8N futuro:** Quando uma ação for aprovada pelo admin (status → completed),
disparar evento `task.completed` na automation_queue para notificar o participante.

---

### `notifications`

**Propósito:** Fila de notificações preparada para múltiplos canais
(WhatsApp, email, push, SMS).

**Quando usar:** Para enfileirar notificações que serão enviadas por canais
específicos, com controle de status individual por notificação.

```sql
-- Ver notificações pendentes por canal
SELECT channel, COUNT(*) as total
FROM notifications
WHERE status = 'pending'
GROUP BY channel;
```

**Diferença em relação a `automation_queue`:**
- `automation_queue`: eventos de negócio (participante criado, vencedor selecionado)
- `notifications`: mensagens direcionadas a um participante específico em um canal específico

---

## Fluxo de rastreabilidade completo

```
1. Cadastro → pp_audit_logs (via RPC)
2. Cadastro → automation_queue: participant.created (via trigger)
3. n8n processa → automation_queue.status = processing
4. n8n envia WhatsApp → whatsapp_logs (INSERT)
5. n8n finaliza → automation_queue.status = done | failed
6. Admin valida → participant_actions.status = completed
7. Admin valida → pp_audit_logs (via RPC futura)
8. Admin valida → automation_queue: participant.validated (futuro)
```

---

## Queries úteis de monitoramento

```sql
-- Fila de automação por status
SELECT status, COUNT(*) FROM automation_queue GROUP BY status;

-- Eventos com falha e motivo
SELECT id, payload->>'participant_name', error_message, retry_count
FROM automation_queue
WHERE status = 'failed'
ORDER BY retry_count DESC;

-- Progresso de tarefas por campanha
SELECT ct.name, pa.status, COUNT(*)
FROM participant_actions pa
JOIN campaign_tasks ct ON ct.id = pa.campaign_task_id
GROUP BY ct.name, pa.status
ORDER BY ct.name;
```
