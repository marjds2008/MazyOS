/**
 * Parceria Premiada — Central Campaign Data
 *
 * TODO (Supabase): Replace PP_CAMPAIGNS with a fetch to:
 *   supabase.from('campaigns').select('*').eq('slug', slug)
 *
 * TODO (Supabase): getCampaign() should become async and
 *   await supabase.from('campaigns').select().eq('slug', slug).single()
 */

const PP_CAMPAIGNS = [
  {
    id: 1,
    slug: 'santa-rita-jacutinga',
    status: 'active', // active | ended | upcoming

    // ── Hero ──────────────────────────────────────────────
    title: 'Ganhe uma viagem para Minas Gerais com tudo incluído',
    subtitle: 'Participe gratuitamente do sorteio de lançamento da Parceria Premiada e concorra a um final de semana inesquecível em Santa Rita de Jacutinga – MG, com a Amo Viajar.',
    badgeText: 'Sorteio gratuito · Encerra em breve',
    heroCtaText: '🎯 Quero participar agora',
    secondaryCtaText: 'Como funciona',
    heroMicrocopy: 'Gratuito • Sorteio em 15/07/2026 • Resultado pelo Instagram e WhatsApp',

    // ── Prêmio ────────────────────────────────────────────
    prizeSectionLabel: 'O prêmio',
    prizeSectionTitle: 'Uma experiência completa\nnas montanhas de Minas',
    prizeTitle: 'Viagem para Santa Rita de Jacutinga – MG',
    prizeDescription: 'Hotel fazenda, cachoeiras, gastronomia típica e passeios inesquecíveis. Tudo organizado pela Amo Viajar para você curtir sem preocupação.',
    destination: 'Santa Rita de Jacutinga',
    location: 'Zona da Mata Mineira · MG',

    // ── Datas ─────────────────────────────────────────────
    tripDateText: '17 a 19 de julho de 2026',
    drawDateText: '15 de julho de 2026',
    drawDateShort: '15/07/2026',
    countdownTargetDate: '2026-07-15T12:00:00-03:00',

    // ── Organizador ───────────────────────────────────────
    organizer: {
      name: 'Amo Viajar',
      description: 'agência especializada em experiências únicas',
      instagram: '@amoviajar',
      logo: 'logo_amo_viajar.png'
    },

    // ── Itens incluídos no prêmio ────────────────────────
    includedItems: [
      { icon: '🏨', text: 'Hospedagem em Hotel Fazenda cercado pela natureza' },
      { icon: '🗺️', text: 'City Tour pelo centro histórico' },
      { icon: '💧', text: 'Visita à Fazenda das Cachoeiras' },
      { icon: '⛪', text: 'Pôr do sol na Igrejinha do Alto' },
      { icon: '🧀', text: 'Passeio por lojas de queijos, doces e artesanatos' },
      { icon: '🎵', text: 'Happy Hour com música ao vivo + caldos e petiscos' },
      { icon: '🚙', text: 'Passeio de Jeep até a Cachoeira Sô Ito' },
      { icon: '🥾', text: 'Caminhada pelas trilhas históricas da região' }
    ],

    // ── Passos de participação ────────────────────────────
    participationSteps: [
      {
        title: 'Cadastre-se gratuitamente',
        text: 'Preencha seu nome, WhatsApp, Instagram e cidade para receber seu número da sorte.'
      },
      {
        title: 'Valide sua participação no Instagram',
        text: 'Siga @parceriapremiadarj, siga os parceiros oficiais, curta a publicação do sorteio e marque 3 amigos reais nos comentários. Não vale perfil famoso, fake ou comercial.'
      },
      {
        title: 'Receba seu número da sorte',
        text: 'Após o cadastro, você será direcionado para o WhatsApp e também verá seus dados na página de confirmação.'
      }
    ],

    // ── Parceiros ─────────────────────────────────────────
    partners: [
      {
        name: 'Amo Viajar',
        instagram: '@amoviajar',
        instagramUrl: 'https://instagram.com/amoviajar',
        category: 'Turismo & Excursões',
        logo: 'logo_amo_viajar.png',
        emoji: null
      },
      {
        name: 'Dose Dupla Bar',
        instagram: '@restaurantedosedupla',
        instagramUrl: 'https://www.instagram.com/restaurantedosedupla/',
        category: 'Bar & Gastronomia',
        logo: 'logo_dose_dupla.jfif',
        emoji: null
      },
      {
        name: 'Sabores do Fellini',
        instagram: '@saboresdofellini',
        instagramUrl: 'https://www.instagram.com/saboresdofellini/',
        category: 'Restaurante',
        logo: 'logo_sf.jpeg',
        emoji: null
      }
    ],

    // ── Transparência ─────────────────────────────────────
    transparencyText: 'O sorteio será realizado com base no resultado da Loteria Federal. Cada participante válido receberá um número da sorte. O número vencedor será definido conforme o critério descrito no regulamento oficial.',
    transparencyCards: [
      { icon: '🔢', text: 'Números da sorte individuais' },
      { icon: '🏛️', text: 'Critério público pela Loteria Federal' },
      { icon: '📣', text: 'Resultado divulgado no Instagram e WhatsApp' },
      { icon: '📋', text: 'Regulamento disponível para consulta' }
    ],

    // ── Contato e links ───────────────────────────────────
    whatsappNumber: '+5521970563795',
    whatsappDisplay: '(21) 97056-3795',
    email: 'contato@parceriapremiada.app.br',
    instagramUrl: 'https://www.instagram.com/parceriapremiadarj',
    instagramHandle: '@parceriapremiadarj',
    officialPostUrl: 'https://www.instagram.com/parceriapremiadarj',
    vipGroupUrl: 'https://chat.whatsapp.com/CIwHq8WI8z144sGATZklJ3',

    // ── Regulamento ───────────────────────────────────────
    regulationSections: [
      {
        num: 1,
        title: 'O Prêmio',
        html: `<p>O ganhador receberá uma viagem completa para <strong>Santa Rita de Jacutinga – MG</strong>, organizada pela Amo Viajar, incluindo:</p>
          <ul>
            <li>Hospedagem em Hotel Fazenda</li>
            <li>City Tour pelo centro histórico</li>
            <li>Visita à Fazenda das Cachoeiras</li>
            <li>Pôr do sol na Igrejinha do Alto</li>
            <li>Passeio por lojas de queijos, doces e artesanatos</li>
            <li>Happy Hour com música ao vivo + caldos e petiscos</li>
            <li>Passeio de Jeep até a Cachoeira Sô Ito</li>
          </ul>
          <div class="destaque">📅 Data da viagem: 17 a 19 de julho de 2026</div>
          <p>O prêmio é intransferível e não pode ser convertido em dinheiro.</p>`
      },
      {
        num: 2,
        title: 'Data do Sorteio',
        html: `<p><strong>15 de julho de 2026.</strong> O resultado será divulgado pelo Instagram <a href="https://www.instagram.com/parceriapremiadarj" target="_blank">@parceriapremiadarj</a> e comunicado ao ganhador pelo WhatsApp.</p>`
      },
      {
        num: 3,
        title: 'Quem Pode Participar',
        html: `<ul>
          <li>Pessoas físicas maiores de 18 anos</li>
          <li>Residentes no Brasil</li>
          <li>Com perfil real no Instagram (não fake, não comercial, não famoso)</li>
          <li>Que realizem todas as ações de validação descritas neste regulamento</li>
        </ul>`
      },
      {
        num: 4,
        title: 'Como Participar',
        html: `<ul>
          <li>Preencher o formulário em <strong>parceriapremiada.app.br</strong> com nome, WhatsApp, Instagram, cidade e estado</li>
          <li>Realizar todas as ações de validação no Instagram</li>
          <li>Aguardar a confirmação do número da sorte</li>
        </ul>
        <p style="margin-top:10px;">A participação é gratuita. Não há qualquer custo para concorrer.</p>`
      },
      {
        num: 5,
        title: 'Validação no Instagram',
        html: `<p>Para ter a participação válida, é obrigatório:</p>
          <ul>
            <li>Seguir o perfil <strong>@parceriapremiadarj</strong></li>
            <li>Seguir os perfis dos parceiros oficiais do sorteio</li>
            <li>Curtir a publicação oficial do sorteio</li>
            <li>Marcar 3 (três) amigos reais nos comentários da publicação</li>
          </ul>
          <div class="destaque">⚠️ Não será aceita marcação de perfis famosos, perfis comerciais, perfis com menos de 10 publicações ou perfis com indícios de serem falsos. Participações inválidas serão desclassificadas.</div>`
      },
      {
        num: 6,
        title: 'Número da Sorte',
        html: `<p>Cada participante válido receberá um número da sorte único no formato <strong>PP-000001</strong>. O número é gerado automaticamente no momento do cadastro e confirmado via WhatsApp.</p>
          <p style="margin-top:8px;">Participantes que não completarem a validação no Instagram terão o número da sorte cancelado.</p>`
      },
      {
        num: 7,
        title: 'Critério do Sorteio — Loteria Federal',
        html: `<p>O número vencedor será determinado com base no <strong>resultado da Loteria Federal</strong> do dia 15 de julho de 2026, conforme critério específico a ser divulgado antes do sorteio.</p>
          <p style="margin-top:8px;">O critério exato será publicado no Instagram da Parceria Premiada com antecedência mínima de 7 dias antes do sorteio.</p>`
      },
      {
        num: 8,
        title: 'Divulgação do Resultado',
        html: `<ul>
          <li>Resultado divulgado no Instagram <strong>@parceriapremiadarj</strong> em 15/07/2026</li>
          <li>Ganhador notificado pelo WhatsApp em até 24 horas</li>
          <li>O ganhador terá 48 horas para confirmar o aceite do prêmio</li>
          <li>Em caso de não resposta, um novo ganhador poderá ser sorteado</li>
        </ul>`
      },
      {
        num: 9,
        title: 'Política de Dados — LGPD',
        html: `<p>Os dados coletados são utilizados exclusivamente para identificação, contato e comunicações da Parceria Premiada. Não são compartilhados com terceiros sem consentimento. Solicitações de exclusão pelo WhatsApp (21) 97056-3795.</p>`,
        id: 'privacidade'
      },
      {
        num: 10,
        title: 'Contato Oficial',
        html: `<p>
          WhatsApp: <a href="https://api.whatsapp.com/send/?phone=%2B5521970563795" target="_blank">(21) 97056-3795</a><br>
          E-mail: contato@parceriapremiada.app.br<br>
          Instagram: <a href="https://www.instagram.com/parceriapremiadarj" target="_blank">@parceriapremiadarj</a>
        </p>`
      }
    ]
  }
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCampaign(slug) {
  return PP_CAMPAIGNS.find(c => c.slug === slug) || null;
}

function getDefaultCampaign() {
  return PP_CAMPAIGNS.find(c => c.status === 'active') || PP_CAMPAIGNS[0];
}

function getCampaignFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || params.get('campaign');
  return slug ? getCampaign(slug) : getDefaultCampaign();
}

function gerarNumero(slug) {
  const key = 'pp_cadastros_' + (slug || 'default');
  const existentes = JSON.parse(localStorage.getItem(key) || '[]');
  return 'PP-' + String(existentes.length + 1).padStart(6, '0');
}
