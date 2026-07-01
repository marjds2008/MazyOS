# Spec Técnica — Parceria Premiada

> Decisões de estrutura, design e fluxo. Não alterar sem consultar o arquiteto.

## URLs

| O quê | URL |
|---|---|
| Landing / Site | `https://parceriapremiada.app.br` |
| Sorteio | `https://parceriapremiada.app.br/sorteio` |
| API de automação (n8n ↔ fila) | `https://admin.amoviajar.app.br/api/automation/` |
| WhatsApp | `+5521970563795` |
| Grupo VIP | `https://chat.whatsapp.com/CIwHq8WI8z144sGATZklJ3` |

> A API de automação roda no painel Next.js do Amo Viajar (`admin.amoviajar.app.br`),
> não em `parceriapremiada.app.br`. O site PP é HTML estático e não tem servidor próprio.

## Stack

- HTML/CSS/JS puro — zero frameworks
- Fontes: Syne 800 (títulos) + Inter 400/500/600 (corpo) via Google Fonts
- Hospedagem: mesmo servidor do WordPress atual
- n8n: `mundodosbots.app.br`
- Evolution API: `https://api.mundodosbots.app.br` — instância `Parceria Premiada`
- MySQL: disponível para salvar cadastros

## Tokens visuais

```css
--roxo: #4D0AA4
--roxo-escuro: #36077A
--dourado: #F5A623
--verde: #1DB954
border-radius: 12-20px cards | 50px botões
```

## Entrega 1 — Página do Sorteio (URGENTE)

Arquivo: `parceria-premiada-sorteio.html` (já existe)

- Publicar em `/sorteio`
- Fazer backup do WordPress antes
- Countdown para **15 de julho de 2026**
- Formulário envia via WhatsApp para `+5521970563795`

## Entrega 2 — Homepage

Seções em ordem:
1. Header fixo — logo + nav + CTA
2. Hero — headline + botão sorteio + botão parceiros
3. Sorteio em destaque — card linkando para `/sorteio`
4. Como funciona — Consumidor (3 passos) | Parceiro (3 passos)
5. Parceiros — logos: Amo Viajar, Dose Dupla, Sabores do Fellini
6. Seja um parceiro — proposta de valor + botão WhatsApp
7. Footer — contato, grupo VIP, redes sociais

## Entrega 3 — Fluxo WhatsApp (n8n + Evolution API)

Gatilho: qualquer mensagem no `+5521970563795`

```
Mensagem recebida
↓
Boas-vindas:
"👋 Olá! Bem-vindo à Parceria Premiada!
Aqui conectamos consumidores a prêmios incríveis
e empresas a novos clientes.

Como posso te ajudar?
1️⃣ Quero participar de sorteios
2️⃣ Quero divulgar minha empresa
3️⃣ Tenho uma dúvida"
↓
1 → link do sorteio + link do grupo VIP
2 → apresentação de parceria + agenda conversa
3 → atendimento humano
```

## Ordem de prioridade

1. `/sorteio` no ar (hoje)
2. Homepage completa
3. Fluxo WhatsApp

## Parceiros fundadores

- Amo Viajar
- Dose Dupla
- Sabores do Fellini
