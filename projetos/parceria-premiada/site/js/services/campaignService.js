/**
 * campaignService — Acesso à tabela campaigns no Supabase
 *
 * Métodos disponíveis:
 *   getBySlug(slug)  → busca campanha ativa pelo slug
 *   getAll()         → lista todas as campanhas (futuramente: admin)
 */

const campaignService = {
  /**
   * Busca campanha ativa pelo slug.
   * Usado no carregamento da landing para validar que a campanha existe no banco.
   * Por enquanto, os dados de exibição vêm de campaigns.js (local).
   * Futuramente (Sprint 4+), substituir campaigns.js por esta chamada.
   */
  async getBySlug(slug) {
    if (!ppSupabase) throw new Error('Supabase não configurado');

    const { data, error } = await ppSupabase
      .from('campaigns')
      .select('id, slug, title, status, draw_date, whatsapp_number, instagram_url, participant_count')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Lista todas as campanhas.
   * TODO (admin): usado futuramente pelo painel administrativo
   */
  async getAll() {
    if (!ppSupabase) throw new Error('Supabase não configurado');

    const { data, error } = await ppSupabase
      .from('campaigns')
      .select('id, slug, title, status, draw_date, participant_count')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
