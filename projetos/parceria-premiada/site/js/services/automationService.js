/**
 * Parceria Premiada — Automation Queue Service
 * Sprint 6: Fila de automação desacoplada
 *
 * A Landing NÃO deve chamar estas funções diretamente.
 * Os eventos são enfileirados automaticamente via trigger do banco
 * (fn_enqueue_participant_created) ao inserir o lucky_number.
 *
 * Este serviço é usado apenas pelo painel admin para:
 * - Monitorar a fila
 * - Reprocessar eventos com erro
 * - Atualizar status manualmente (durante homologação)
 *
 * HOOK N8N:     n8n consome a fila via GET /api/automation/pending
 * HOOK Evolution: n8n processa event_type='participant.created' e envia WhatsApp
 * HOOK CRM:     n8n processa event_type='participant.validated' e atualiza contato
 * HOOK EMAIL:   n8n processa event_type='participant.created' e envia email de boas-vindas
 */

const automationService = {

  // ── enqueue ─────────────────────────────────────────────────────────────────
  // Eventos são enfileirados automaticamente via trigger ao criar participante.
  // Este método existe para re-enfileiramento manual pelo admin.
  // Na prática, use retry() para reprocessar um evento com falha.
  async enqueue(eventType, entityType, entityId, campaignId, payload) {
    // HOOK N8N: ponto de entrada manual para enfileirar eventos avulsos
    throw new Error(
      'Enfileiramento manual não disponível via anon key. ' +
      'Eventos são criados automaticamente. Use retry() para reprocessar um evento com erro.'
    );
  },

  // ── markProcessing ──────────────────────────────────────────────────────────
  // Marca evento como em processamento (chamado pelo n8n ao iniciar o evento)
  async markProcessing(queueId) {
    return this._updateStatus(queueId, 'processing');
  },

  // ── markDone ────────────────────────────────────────────────────────────────
  // Marca evento como concluído com sucesso
  async markDone(queueId) {
    return this._updateStatus(queueId, 'done');
  },

  // ── markFailed ──────────────────────────────────────────────────────────────
  // Marca evento como falho, incrementa retry_count e salva mensagem de erro
  async markFailed(queueId, errorMessage) {
    return this._updateStatus(queueId, 'failed', errorMessage);
  },

  // ── retry ───────────────────────────────────────────────────────────────────
  // Reprocessa um evento com falha: redefine status para 'pending'
  async retry(queueId) {
    return this._updateStatus(queueId, 'pending');
  },

  // ── listPending ─────────────────────────────────────────────────────────────
  // Retorna eventos pendentes (mesmo payload que o endpoint /api/automation/pending)
  async listPending(limit = 100) {
    if (!ppSupabase) throw new Error('Supabase não configurado');
    const { data, error } = await ppSupabase.rpc('get_pending_events', {
      p_limit: Math.min(limit, 100)
    });
    if (error) throw error;
    return data || [];
  },

  // ── getQueueStats ────────────────────────────────────────────────────────────
  // Retorna contagem por status (para os cards do painel admin)
  async getQueueStats(campaignSlug = null) {
    if (!ppSupabase) throw new Error('Supabase não configurado');
    const params = campaignSlug ? { p_campaign_slug: campaignSlug } : {};
    const { data, error } = await ppSupabase.rpc('admin_get_queue_stats', params);
    if (error) throw error;
    if (data && data.error) throw new Error(data.error);
    return data;
  },

  // ── _updateStatus (privado) ──────────────────────────────────────────────────
  async _updateStatus(queueId, status, errorMsg = null) {
    if (!ppSupabase) throw new Error('Supabase não configurado');
    const { data, error } = await ppSupabase.rpc('update_queue_status', {
      p_queue_id: queueId,
      p_status:   status,
      p_error:    errorMsg || null
    });
    if (error) throw error;
    if (data && data.error) throw new Error(data.error);
    return data;
  }

};
