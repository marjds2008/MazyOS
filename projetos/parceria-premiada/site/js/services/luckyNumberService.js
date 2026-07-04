/**
 * luckyNumberService — Consultas a lucky_numbers no Supabase
 *
 * Nota: inserção é feita exclusivamente via RPC create_participant_with_number.
 * Este service é somente leitura.
 */

const luckyNumberService = {
  /**
   * Formata número inteiro no padrão PP-XXXXXX.
   * Funciona também com strings já no formato PP-XXXXXX (fallback localStorage).
   *
   * @param {number|string} num
   * @returns {string} ex: 'PP-000042'
   */
  /**
   * Formata número no padrão PP-XXXXX (5 dígitos — Draw Engine v2).
   * Fallback: se for string já formatada, retorna como está.
   * Aceita tanto display_number (5 dígitos) quanto lucky_number sequencial.
   */
  format(num) {
    if (typeof num === 'string' && num.startsWith('PP-')) return num;
    // display_number_fmt já vem com 5 dígitos; lucky_number sequencial usa 5 também
    return 'PP-' + String(num).padStart(5, '0');
  },

  /** Formata a partir do display_number_fmt quando disponível, com fallback para lucky_number */
  formatConfirmation(data) {
    if (data && data.display_number_fmt) return 'PP-' + data.display_number_fmt;
    if (data && data.display_number != null) return 'PP-' + String(data.display_number).padStart(5, '0');
    if (data && data.lucky_number != null)   return luckyNumberService.format(data.lucky_number);
    return 'PP-00000';
  },

  /**
   * Busca todos os números ativos de uma campanha.
   * TODO (admin): usado futuramente para listar participantes no painel
   *
   * @param {string} campaignId - UUID da campanha
   */
  async listByCampaign(campaignId) {
    if (!ppSupabase) return [];

    const { data, error } = await ppSupabase
      .from('lucky_numbers')
      .select('number, status, created_at, participant_id')
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .order('number', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Busca o número vencedor de uma campanha (após o sorteio).
   *
   * @param {string} campaignId
   * @returns {{ number: number, participant_id: string } | null}
   */
  async getWinner(campaignId) {
    if (!ppSupabase) return null;

    const { data, error } = await ppSupabase
      .from('lucky_numbers')
      .select('number, participant_id')
      .eq('campaign_id', campaignId)
      .eq('status', 'winner')
      .maybeSingle();

    if (error) return null;
    return data;
  }
};
