/**
 * partnerService — Consultas a partners e campaign_partners no Supabase
 */

const partnerService = {
  /**
   * Busca parceiros de uma campanha específica com dados completos.
   * Futuramente substitui a lista hardcoded em campaigns.js.
   *
   * @param {string} campaignId - UUID da campanha
   * @returns {Array} lista de partners
   */
  async getByCampaign(campaignId) {
    if (!ppSupabase) return [];

    const { data, error } = await ppSupabase
      .from('campaign_partners')
      .select('partner:partner_id(id, name, instagram, logo, category, website, status)')
      .eq('campaign_id', campaignId);

    if (error) throw error;
    return data ? data.map(r => r.partner).filter(Boolean) : [];
  },

  /**
   * Lista todos os parceiros ativos.
   * TODO (admin): usado futuramente no painel para gerenciar parceiros
   */
  async getAll() {
    if (!ppSupabase) return [];

    const { data, error } = await ppSupabase
      .from('partners')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) throw error;
    return data || [];
  }
};
