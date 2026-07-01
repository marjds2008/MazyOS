/**
 * Parceria Premiada — Admin Service
 * Sprint 4: Painel Administrativo (somente leitura)
 *
 * TODO SECURITY: As RPCs chamadas aqui são SECURITY DEFINER e retornam
 * dados sensíveis. Proteger com autenticação antes do deploy público.
 */

const adminService = {

  // ── getCampaignStats ────────────────────────────────────────────────────────
  // Retorna totais da campanha para os cards do dashboard
  async getCampaignStats(campaignSlug) {
    if (!ppSupabase) throw new Error('Supabase não configurado');
    const { data, error } = await ppSupabase.rpc('admin_get_campaign_stats', {
      p_campaign_slug: campaignSlug
    });
    if (error) throw error;
    if (data && data.error) throw new Error(data.error);
    return data;
  },

  // ── listParticipants ────────────────────────────────────────────────────────
  // Retorna todos os participantes de uma campanha sem filtro
  async listParticipants(campaignSlug) {
    return this.searchParticipants(campaignSlug, '');
  },

  // ── searchParticipants ──────────────────────────────────────────────────────
  // Retorna participantes filtrados por nome, WhatsApp ou Instagram
  async searchParticipants(campaignSlug, query) {
    if (!ppSupabase) throw new Error('Supabase não configurado');
    const { data, error } = await ppSupabase.rpc('admin_get_participants', {
      p_campaign_slug: campaignSlug,
      p_search: query || ''
    });
    if (error) throw error;
    return data || [];
  },

  // ── exportParticipantsCsv ───────────────────────────────────────────────────
  // Gera e faz download do CSV com todos os participantes da campanha
  async exportParticipantsCsv(campaignSlug) {
    const participants = await this.listParticipants(campaignSlug);
    if (!participants.length) {
      alert('Nenhum participante para exportar.');
      return;
    }

    const headers = ['Número', 'Nome', 'WhatsApp', 'Instagram', 'Cidade', 'Estado', 'Status', 'Cadastrado em'];
    const rows = participants.map(p => [
      p.lucky_number ? luckyNumberService.format(p.lucky_number) : '',
      p.participant_name || '',
      p.whatsapp ? this._formatWhatsApp(p.whatsapp) : '',
      p.instagram ? '@' + p.instagram : '',
      p.city || '',
      p.state || '',
      this._formatStatus(p.participant_status),
      p.created_at ? new Date(p.created_at).toLocaleString('pt-BR') : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    // BOM UTF-8 garante que Excel abra corretamente no Windows
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `participantes_${campaignSlug}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // ── Sprint 5: Motor de Regras e Progresso ──────────────────────────────────

  // Retorna progresso completo de um participante (tarefas, %, número da sorte)
  async getParticipantProgress(participantId) {
    if (!ppSupabase) throw new Error('Supabase não configurado');
    const { data, error } = await ppSupabase.rpc('get_participant_progress', {
      p_participant_id: participantId
    });
    if (error) throw error;
    if (data && data.error) throw new Error(data.error);
    return data;
  },

  // Retorna todas as tarefas de uma campanha com contagem de conclusões
  async listCampaignTasks(campaignSlug) {
    if (!ppSupabase) throw new Error('Supabase não configurado');
    const { data, error } = await ppSupabase.rpc('admin_list_campaign_tasks', {
      p_campaign_slug: campaignSlug
    });
    if (error) throw error;
    return data || [];
  },

  // Retorna lista de ações de um participante (extrai do progresso, sem RPC extra)
  async listParticipantActions(participantId) {
    const progress = await this.getParticipantProgress(participantId);
    if (!progress || progress.error) return [];
    return Array.isArray(progress.tasks) ? progress.tasks : [];
  },

  // ── helpers (privados por convenção) ────────────────────────────────────────

  _formatStatus(status) {
    const map = {
      pending:   'Pendente',
      validated: 'Validado',
      winner:    'Vencedor',
      cancelled: 'Cancelado'
    };
    return map[status] || status || '';
  },

  _formatWhatsApp(digits) {
    const d = (digits || '').replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return digits;
  },

  _wppLink(digits) {
    const d = (digits || '').replace(/\D/g, '');
    return `https://api.whatsapp.com/send/?phone=55${d}`;
  },

  _instaLink(handle) {
    if (!handle) return '#';
    const h = handle.replace(/^@/, '');
    return `https://www.instagram.com/${h}`;
  }

};
