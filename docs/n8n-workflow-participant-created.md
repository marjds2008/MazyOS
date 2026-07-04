# Workflow: PP — participant.created → WhatsApp

Consome eventos `participant.created` da `automation_queue` e envia WhatsApp de confirmação com o número da sorte via Evolution API.

---

## Arquivo

| Versão | Arquivo |
|--------|---------|
| v1 (legado) | `projetos/parceria-premiada/n8n/workflows/participant-created-whatsapp.json` |
| v2 (Draw Engine) | `projetos/parceria-premiada/n8n/workflows/participant-created-whatsapp-draw-engine.json` |

---

## Fluxo

```
Cron 1min
  → GET /api/automation/pending
  → Se há eventos
    → Extrair em itens individuais
    → Loop por evento
      → Marcar processing
      → Normalizar dados + montar mensagem   ← alterado na v2
      → Verificar idempotência (check_whatsapp_sent)
      → Se já enviado → marcar done
      → Senão → Evolution API (sendText)
        → Log sucesso → marcar done
        → (erro) Log falha → marcar failed
```

---

## Compatibilidade com Draw Engine

### Número da sorte — lógica de prioridade (node `🛠️ Normalizar Dados e Montar Mensagem`)

| Prioridade | Campo | Origem | Formato |
|-----------|-------|--------|---------|
| 1 | `display_number` | Draw Engine v2 | int 0–99999 |
| 2 | `lucky_number` | Legado sequencial | int 1, 2, 3... |
| 3 | ausente | — | Erro `Número da sorte ausente no payload` |

Formatação final: sempre `PP-XXXXX` com 5 dígitos.

```javascript
// Exemplos
display_number = 7     → 'PP-00007'
display_number = 123   → 'PP-00123'
display_number = 98765 → 'PP-98765'
```

### Campo `display_hash`

`display_hash` = `SHA256(seed:sequence:display_number)` — prova criptográfica do número.

Está presente no payload quando o Draw Engine está ativo. Disponível em `$('Normalizar Dados e Montar Mensagem').first().json.display_hash` para uso futuro.

Não é enviado na mensagem de WhatsApp por padrão (informação técnica). O participante pode verificar em `parceriapremiada.app.br/transparencia`.

### Campo `number_source`

Indica qual campo foi usado para gerar o número:
- `draw_engine_v2` — `display_number` do Draw Engine
- `legacy_sequential` — `lucky_number` antigo

Útil para debugging no log de execução do n8n.

---

## Mensagem WhatsApp

```
🎉 Olá, {nome}!

Seu cadastro no sorteio da Parceria Premiada foi realizado com sucesso.

🎁 Campanha:
{título da campanha}

🎟️ Seu número da sorte oficial:
PP-XXXXX

Agora falta validar sua participação no Instagram:

✅ Siga @parceriapremiada
✅ Siga os parceiros oficiais
✅ Curta a publicação oficial do sorteio
✅ Marque 3 amigos reais nos comentários

⚠️ Não vale perfil fake, famoso ou comercial.

🔎 Transparência:
Seu número foi gerado pelo Draw Engine da Parceria Premiada, com algoritmo auditável e verificável.

📌 Regulamento:
https://parceriapremiada.app.br/regulamento.html?campaign={slug}

Boa sorte! 🍀
```

---

## Idempotência

Antes de enviar, o workflow chama a RPC `check_whatsapp_sent` com:
- `p_participant_id`
- `p_campaign_id`
- `p_type = 'participant.created'`

Se `already_sent = true`, pula o envio e marca o evento como `done`. Garante que o mesmo participante não receba duplicatas mesmo se o evento ficar em fila por mais de um ciclo.

---

## Logs (whatsapp_logs)

Campos registrados em `whatsapp_logs` após cada envio:

| Campo | Valor |
|-------|-------|
| `p_participant_id` | UUID do participante |
| `p_campaign_id` | UUID da campanha |
| `p_phone` | Telefone normalizado (55 + DDD + número) |
| `p_message` | Mensagem completa enviada |
| `p_status` | `sent` ou `failed` |
| `p_type` | `participant.created` |
| `p_evolution_msg_id` | ID retornado pela Evolution (se existir) |

---

## Variáveis de ambiente necessárias (n8n)

| Variável | Descrição |
|----------|-----------|
| `ADMIN_API_BASE_URL` | Ex: `https://admin.parceriapremiada.app.br` |
| `SUPABASE_URL` | Ex: `https://supabase.mundodosbots.app.br` |
| `SUPABASE_ANON_KEY` | Anon key do Supabase |
| `EVOLUTION_API_URL` | Ex: `https://api.mundodosbots.app.br` |
| `EVOLUTION_API_KEY` | API key da Evolution |
| `EVOLUTION_INSTANCE_NAME` | Nome da instância |

---

## Como importar no n8n

**[VPS]**

```bash
# Copiar o arquivo para dentro do container n8n
docker cp /opt/parceria/projetos/parceria-premiada/n8n/workflows/participant-created-whatsapp-draw-engine.json \
  $(docker ps -qf 'name=n8n'):/tmp/workflow-v2.json
```

Depois no painel do n8n: **Workflows → Import → From file** → selecionar `/tmp/workflow-v2.json`.

Desativar o workflow antigo (`participant.created → WhatsApp`) antes de ativar o novo.
