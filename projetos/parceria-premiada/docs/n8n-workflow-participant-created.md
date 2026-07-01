# n8n Workflow — participant.created → WhatsApp

Documentação completa do workflow que consome eventos `participant.created`
da `automation_queue` e envia mensagem de confirmação via Evolution API.

---

## Visão geral

```
[Cron 1min] → [GET pending] → [IF há eventos] → [Split 1 a 1]
  → [Mark processing] → [Code: normalizar] → [Check já enviado]
  → [IF já enviado] → ✅ [Mark done]
  →                → [POST Evolution] → [Log whatsapp_logs]
                                      → [Mark done]
  Error em qualquer nó → [Mark failed]
```

**Princípios:**
- O n8n não contém regra de negócio — apenas executa e registra
- Idempotência garantida via `check_whatsapp_sent` RPC
- Toda falha é registrada em `automation_queue.error_message`
- A landing não sabe que o n8n existe

---

## Variáveis de ambiente necessárias

Configurar em **n8n → Settings → Variables** (ou como credenciais):

| Variável                | Exemplo                              |
|:------------------------|:-------------------------------------|
| `ADMIN_API_BASE_URL`    | `https://admin.amoviajar.app.br`     |
| `SUPABASE_URL`          | `https://supabase.mundodosbots.app.br` |
| `SUPABASE_ANON_KEY`     | `eyJhbGci...`                        |
| `EVOLUTION_API_URL`     | `https://api.mundodosbots.app.br`    |
| `EVOLUTION_API_KEY`     | `74DA3D86C3AF-4D2A-A378-1762C2D818E4` |
| `EVOLUTION_INSTANCE_NAME` | `Parceria Premiada`               |

---

## Nodes do workflow

### Node 1 — Schedule Trigger

```
Tipo: n8n-nodes-base.scheduleTrigger
Intervalo: A cada 1 minuto
```

---

### Node 2 — HTTP Request: Buscar pendentes

```
Tipo: HTTP Request
Método: GET
URL: {{ $env.ADMIN_API_BASE_URL }}/api/automation/pending?limit=20
Headers: Content-Type: application/json
```

**Resposta esperada:**
```json
{
  "events": [...],
  "count": 1,
  "fetched_at": "ISO8601"
}
```

---

### Node 3 — IF: Há eventos?

```
Condição: {{ $json.count }} > 0
Verdadeiro → continua
Falso → fim do workflow
```

---

### Node 4 — Split In Batches

```
Tipo: SplitInBatches
Campo de array: events
Batch Size: 1
```

Cada iteração processa um evento por vez.

---

### Node 5 — HTTP Request: Marcar processing

```
Método: POST
URL: {{ $env.ADMIN_API_BASE_URL }}/api/automation/update
Body (JSON):
{
  "queue_id": "{{ $json.queue_id }}",
  "status": "processing"
}
```

---

### Node 6 — Code: Normalizar dados e montar mensagem

```javascript
const event   = $input.first().json;
const payload = event.payload;

// Formatar WhatsApp: apenas dígitos + prefixo 55
const digits = (payload.whatsapp || '').replace(/\D/g, '');
const phone  = digits.startsWith('55') ? digits : '55' + digits;

// Formatar número da sorte
const num            = parseInt(payload.lucky_number) || 0;
const luckyFormatted = 'PP-' + String(num).padStart(6, '0');

// Dados da campanha
const participantName = payload.participant_name || payload.name || 'Participante';
const campaignTitle   = payload.campaign_title   || payload.campaign_slug || 'Parceria Premiada';
const campaignSlug    = payload.campaign_slug    || '';
const regulationUrl   = $env.ADMIN_API_BASE_URL  + '/regulamento.html?campaign=' + campaignSlug;

// Montar mensagem
const message = `🎉 Olá, ${participantName}!

Seu cadastro no sorteio da Parceria Premiada foi realizado com sucesso.

🎁 Campanha:
${campaignTitle}

🎟️ Seu número da sorte:
${luckyFormatted}

Agora falta validar sua participação no Instagram:

✅ Siga @parceriapremiada
✅ Siga os parceiros oficiais
✅ Curta a publicação oficial do sorteio
✅ Marque 3 amigos reais nos comentários

⚠️ Não vale perfil fake, famoso ou comercial.

📌 Regulamento:
${regulationUrl}

Boa sorte! 🍀`;

return [{
  json: {
    queue_id:        event.queue_id,
    participant_id:  payload.participant_id,
    campaign_id:     payload.campaign_id,
    campaign_slug:   campaignSlug,
    phone,
    lucky_formatted: luckyFormatted,
    participant_name: participantName,
    message,
  }
}];
```

---

### Node 7 — HTTP Request: Verificar idempotência

Chama RPC `check_whatsapp_sent` no Supabase.

```
Método: POST
URL: {{ $env.SUPABASE_URL }}/rest/v1/rpc/check_whatsapp_sent
Headers:
  apikey: {{ $env.SUPABASE_ANON_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_ANON_KEY }}
  Content-Type: application/json
Body:
{
  "p_participant_id": "{{ $json.participant_id }}",
  "p_campaign_id":    "{{ $json.campaign_id }}",
  "p_type":           "participant.created"
}
```

**Resposta:** `true` (já enviado) ou `false` (não enviado)

---

### Node 8 — IF: Já enviado?

```
Condição: {{ $json }} === true
Verdadeiro → ir direto para Mark done (evento duplicado, não reenviar)
Falso → continuar para envio
```

---

### Node 9 — HTTP Request: Enviar WhatsApp via Evolution API

```
Método: POST
URL: {{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE_NAME }}
Headers:
  apikey: {{ $env.EVOLUTION_API_KEY }}
  Content-Type: application/json
Body:
{
  "number": "{{ $json.phone }}",
  "text":   "{{ $json.message }}"
}
```

**Resposta esperada (sucesso):**
```json
{
  "key": { "id": "ABCD1234" },
  "status": "PENDING"
}
```

---

### Node 10 — HTTP Request: Registrar whatsapp_logs

Chama RPC `log_whatsapp_message` no Supabase.

```
Método: POST
URL: {{ $env.SUPABASE_URL }}/rest/v1/rpc/log_whatsapp_message
Headers:
  apikey: {{ $env.SUPABASE_ANON_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_ANON_KEY }}
  Content-Type: application/json
Body:
{
  "p_participant_id":    "{{ $('Code: Normalizar').first().json.participant_id }}",
  "p_campaign_id":       "{{ $('Code: Normalizar').first().json.campaign_id }}",
  "p_phone":             "{{ $('Code: Normalizar').first().json.phone }}",
  "p_message":           "{{ $('Code: Normalizar').first().json.message }}",
  "p_status":            "sent",
  "p_type":              "participant.created",
  "p_evolution_msg_id":  "{{ $json.key.id }}"
}
```

---

### Node 11 — HTTP Request: Marcar done

```
Método: POST
URL: {{ $env.ADMIN_API_BASE_URL }}/api/automation/update
Body:
{
  "queue_id": "{{ $('Split In Batches').first().json.queue_id }}",
  "status": "done"
}
```

---

### Node 12 — Error Branch: Marcar failed

Conectar a saída de erro de todos os nodes relevantes aqui.

```
Método: POST
URL: {{ $env.ADMIN_API_BASE_URL }}/api/automation/update
Body:
{
  "queue_id": "{{ $('Split In Batches').first().json.queue_id }}",
  "status": "failed",
  "error": "{{ $json.error.message ?? $json.message ?? 'Erro desconhecido' }}"
}
```

Também registra whatsapp_logs com `status='failed'` se o erro ocorreu no Node 9:

```
URL: {{ $env.SUPABASE_URL }}/rest/v1/rpc/log_whatsapp_message
Body:
{
  "p_participant_id": "{{ $('Code: Normalizar').first().json.participant_id }}",
  "p_campaign_id":    "{{ $('Code: Normalizar').first().json.campaign_id }}",
  "p_phone":          "{{ $('Code: Normalizar').first().json.phone }}",
  "p_message":        "{{ $('Code: Normalizar').first().json.message }}",
  "p_status":         "failed",
  "p_type":           "participant.created",
  "p_evolution_msg_id": null
}
```

---

## Payload enviado para a Evolution API

```json
{
  "number": "5521997782395",
  "text":   "🎉 Olá, Roberto!\n\nSeu cadastro no sorteio..."
}
```

**Normalização do número:**
- Input: `(21) 99778-2395` ou `21997782395`
- Output: `5521997782395`
- Regra: remover tudo que não for dígito, prefixar com `55` se não tiver

---

## Como testar

1. **Cadastrar participante** na landing — criar evento `pending` na fila
2. **Ver no admin** → seção Fila de Automações → Pendentes: 1
3. **Executar workflow manualmente** no n8n (botão "Test workflow")
4. Verificar no admin → evento muda para `done`
5. Verificar WhatsApp recebido no número cadastrado
6. **Rodar novamente** → idempotência: evento já `done`, não reenvia
7. **Simular erro**: desativar Evolution API → evento deve ir para `failed`
8. **Retry**: usar `POST /api/automation/retry` → evento volta para `pending`

---

## Checklist de homologação

- [ ] Cron configurado para 1 minuto
- [ ] Variáveis de ambiente salvas no n8n
- [ ] Cadastro na landing gera evento `pending`
- [ ] Evento muda para `processing` no início
- [ ] WhatsApp recebido com número formatado corretamente
- [ ] `whatsapp_logs` tem registro `sent`
- [ ] Evento muda para `done`
- [ ] Segunda execução não reenvía (idempotência)
- [ ] Erro da Evolution → evento `failed` com `error_message`
- [ ] Retry → evento volta para `pending` e reprocessa
- [ ] Número com máscara `(21) 99778-2395` → normalizado corretamente
- [ ] Número sem máscara `21997782395` → normalizado corretamente
- [ ] Nenhuma credencial hardcoded no workflow
- [ ] Console do n8n sem erros
