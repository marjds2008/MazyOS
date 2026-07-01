/**
 * participantService — Operações de participantes no Supabase
 *
 * Toda escrita acontece via RPC (SECURITY DEFINER) para garantir:
 * - Atomicidade (participante + número em uma transaction)
 * - Validação server-side (duplicidade, campanha ativa)
 * - Número sequencial sem race condition
 */

const participantService = {
  /**
   * Cria participante e gera número da sorte em uma operação atômica.
   *
   * @param {Object} dados
   * @param {string} dados.campaignSlug  - slug da campanha
   * @param {string} dados.name          - nome completo
   * @param {string} dados.whatsapp      - com DDD e máscara
   * @param {string} dados.instagram     - com ou sem @ (normalizado no backend)
   * @param {string} dados.city
   * @param {string} dados.state         - UF
   * @param {string} [dados.email]       - opcional
   * @param {boolean} dados.acceptedLgpd
   *
   * @returns {{ success: true, participant_id: string, number: number, campaign_id: string }}
   * @throws {Error} com .code para erros específicos:
   *   DUPLICATE_WHATSAPP, DUPLICATE_INSTAGRAM, CAMPAIGN_NOT_FOUND, LGPD_NOT_ACCEPTED
   */
  async createWithNumber({ campaignSlug, name, whatsapp, instagram, city, state, email, acceptedLgpd }) {
    if (!ppSupabase) throw new Error('Supabase não configurado');

    const { data, error } = await ppSupabase.rpc('create_participant_with_number', {
      p_campaign_slug: campaignSlug,
      p_name:          name,
      p_whatsapp:      whatsapp,
      p_instagram:     instagram,
      p_city:          city  || '',
      p_state:         state || '',
      p_email:         email || '',
      p_accepted_lgpd: acceptedLgpd
    });

    if (error) throw error;

    // A RPC retorna um JSON — se contiver 'error', lança como exceção com código
    if (data && data.error) {
      const err = new Error(data.error);
      err.code = data.code || 'UNKNOWN_ERROR';
      throw err;
    }

    return data;
  },

  /**
   * Busca dados seguros de um participante para a página de confirmação.
   * Retorna apenas: nome, cidade, estado, número da sorte, campanha, data.
   * NÃO retorna WhatsApp, Instagram ou e-mail.
   *
   * @param {string} participantId - UUID do participante
   */
  async getConfirmation(participantId) {
    if (!ppSupabase) return null;

    const { data, error } = await ppSupabase.rpc('get_participant_confirmation', {
      p_participant_id: participantId
    });

    if (error) {
      console.warn('[PP] getConfirmation error:', error.message);
      return null;
    }

    if (data && data.error) return null;

    return data;
  }
};
