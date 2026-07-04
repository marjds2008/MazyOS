# Estratégia

> O que importa agora. Prioridades, metas, prazos.
> O Claude usa isso pra decidir o que sugerir primeiro e o que adiar.
> Atualize sempre que as prioridades mudarem.

## Fase

Desenvolvimento do Amo Viajar — construindo o produto SaaS principal.

## Prioridade principal

Finalizar e entregar. O gargalo é o perfeccionismo: fica atualizando em vez de publicar. A meta é sair do ciclo de refinamento infinito e chegar em versões entregáveis.

## O que pode esperar

Melhorias estéticas e ajustes menores que não impactam a funcionalidade core.

## Gargalo identificado

Gastar tempo decidindo o que e como implementar sem ter definição prévia clara. Cada semana recomeça com a mesma dúvida sobre o que construir. Candidato a virar skill via `/mapear-rotinas`: **definição de escopo antes de implementar**.

## Conquistas recentes (junho–julho/2026)

- Landing page `/lista-vip` no ar em amoviajar.app.br/lista-vip/
- Meta Pixel instalado globalmente (ID 1526440209138815) — PageView + Lead ativos e validados
- Formulário de captura de leads funcionando (Supabase `lista_vip`)
- **PP Admin isolado** (Next.js 16) deployado com HTTPS em admin.parceriapremiada.app.br — Docker Swarm + Traefik, separado do AV admin
- **Domínio parceriapremiada.app.br** no ar com SSL Let's Encrypt
- **Migração 010 aplicada** — 6 tabelas PP + 9 RPCs no Supabase self-hosted
- **Draw Engine v2.0 implementado** — Feistel não-balanceada (8 rodadas, HMAC-SHA256), zero colisões garantidas matematicamente, sub-1ms por número, migração 011 criada aguardando aplicação

## Próximo foco

Finalizar o Parceria Premiada para o sorteio de 17 de julho:
1. Aplicar migração 011 (Draw Engine) no Supabase da VPS
2. Integrar Draw Engine no fluxo de registro de participante
3. Criar fluxos WhatsApp no n8n (consumidor e parceiro)
4. Subir criativos Meta Ads para divulgação da campanha

## Contexto com prazo

**17 de julho de 2026** — data do sorteio Parceria Premiada (viagem para Minas). Prioridade máxima até lá.
