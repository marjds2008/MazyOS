# Parceria Premiada

> Projeto criado em junho/2026. Pasta dedicada — instruções aqui sobrescrevem as da raiz quando relevantes.

## Sobre

Lançar o primeiro sorteio (viagem para Minas, 17 de julho) para construir base de consumidores e atrair os primeiros parceiros pagantes.

## Tipo

Projeto interno — iniciativa própria com potencial de virar SaaS/plataforma de marketing local.

## Entregas previstas

- **Site** — limpeza do WordPress atual + página do sorteio com formulário de participação
- **Automação WhatsApp** — n8n + Evolution API com fluxo separado para consumidor e parceiro
- **Criativos Meta Ads** — roteiro de vídeo para a Lu + card estático

## Onde salvar o que

- Briefings e contexto: nessa pasta raiz (`projetos/parceria-premiada/`)
- Site (anotações, wireframes, textos): `site/`
- Automação (fluxos n8n, scripts, configs): `automacao/`
- Criativos (roteiros, briefings de arte, referências): `criativos/`

## Contexto que herda da raiz

Esse projeto herda automaticamente o tom de voz e contexto do negócio definidos em `_memoria/` da raiz. Não duplicar essas informações aqui.

## Específico desse projeto

- Prazo do sorteio: **17 de julho de 2026** — prioridade é ter o site e a automação no ar antes disso
- Dois públicos distintos: **consumidores** (participam do sorteio) e **parceiros** (pagam para patrocinar/participar)
- Fluxo WhatsApp precisa tratar os dois públicos de forma separada desde o início
- WordPress atual precisa ser limpo antes de adicionar a página do sorteio

## Domínios

- **Landing (site estático):** `https://parceriapremiada.app.br`
- **API de automação:** `https://admin.amoviajar.app.br/api/automation/` — roda no Next.js do Amo Viajar
- O site PP não tem servidor próprio; toda lógica de backend fica no Supabase (RPCs) e no admin do Amo Viajar
