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
  format(num) {
    if (typeof num === 'string' && num.startsWith('PP-')) return num;
    return 'PP-' + String(num).padStart(6, '0');
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
