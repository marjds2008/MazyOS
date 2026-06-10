# Relatório de Evolução — Amo Viajar

> Contexto completo do projeto: o que foi feito, o que está em andamento e o que vem pela frente.
> Leitura recomendada antes de qualquer tarefa de desenvolvimento ou conteúdo do Amo Viajar.

---

## Objetivo do Projeto

Transformar a Amo Viajar de uma operação baseada em WhatsApp e planilhas em uma plataforma própria de gestão, relacionamento e vendas, capaz de:

- Organizar viagens
- Capturar leads
- Gerenciar clientes
- Automatizar comunicação
- Fortalecer a comunidade Amo Viajar
- Escalar as vendas mantendo o atendimento humanizado da Lisa

---

## Etapa 1 — Site Institucional ✅ CONCLUÍDA

Construído com foco em autoridade, confiança, conversão e comunidade.

**Implementado:**
- Hero, história da Lisa, apresentação da Amo Viajar, destinos, comunidade, depoimentos, Clube VIP, contato
- Credenciais: 3+ anos, 1.200+ passageiros, Cadastur, Guia de Turismo, Ministério do Turismo
- Posicionamento: "A Amo Viajar não vende apenas excursões. A Amo Viajar conecta pessoas."
- Galeria de depoimentos com upload de prints reais, lightbox

---

## Etapa 2 — Painel Administrativo ✅ CONCLUÍDA

Retaguarda própria com:

- **Dashboard:** viagens abertas, leads novos, total de leads, Família VIP, próximas viagens, últimos leads
- **Gestão de Viagens:** CRUD completo (criar, editar, excluir, upload de imagem, controle de status)
- **Gestão de Leads:** lista, filtro por status, alteração de status, acesso rápido ao WhatsApp
- **Lista VIP:** cadastro pelo site, busca por nome/cidade/WhatsApp, estatísticas
- **Depoimentos:** upload, destaque, ordem de exibição, exclusão
- **Galeria:** upload múltiplo, organização, destaques

---

## Etapa 3 — Infraestrutura ⚙️ EM ANDAMENTO

**Supabase configurado:**

Tabelas: `viagens`, `leads`, `lista_vip`, `depoimentos`, `galeria`

Storage buckets: `viagens`, `depoimentos`, `galeria`

Autenticação: usuário administrador

---

## Etapa 4 — CRM Amo Viajar 📋 PRÓXIMA FASE

Cadastro único de cliente com:
- Nome, WhatsApp, cidade, data de nascimento
- Categoria favorita de destino
- Histórico de viagens
- Observações

**Categorias de interesse:**
- Serra: Penedo, Visconde de Mauá, Nova Friburgo, São Lourenço, Campos do Jordão
- Praia: Ilha Grande, Cabo Frio, Búzios, Paraty
- Fé: Aparecida
- Cultura: Conservatória, Petrópolis, Vassouras
- Interior RJ: Miguel Pereira, Guapimirim, Região Serrana

---

## Etapa 5 — Histórico de Passageiros

Perfil completo por cliente: viagens realizadas, total de viagens, última viagem, categoria favorita.

---

## Etapa 6 — Funil Comercial

Status do funil: Novo Lead → Contato Realizado → Interessado → Reservado → Pago → Viajou

Dashboard comercial com indicadores por status.

---

## Etapa 7 — Campanhas Segmentadas

Envio de ofertas por segmento: Lista VIP, clientes antigos, interessados por categoria de destino.

---

## Etapa 8 — Integração n8n + Evolution (WhatsApp)

Fluxo: Site → Supabase → CRM → n8n → Evolution → WhatsApp

Automações previstas:
- Aviso de abertura de viagem (segmentado por interesse)
- Alerta de últimas vagas
- Comunicações exclusivas Lista VIP
- Agradecimento pós-viagem + solicitação de depoimento

---

## Etapa 9 — Comunidade Amo Viajar

- Clube Amo Viajar
- Níveis de fidelidade
- Histórico de participação
- Aniversariantes
- Benefícios exclusivos
- Indicação premiada

---

## Visão Final

A Amo Viajar se tornará uma plataforma de relacionamento com foco em comunidade, fidelização, experiência, automação inteligente e crescimento previsível — preservando a proximidade humana da Lisa como diferencial central.
