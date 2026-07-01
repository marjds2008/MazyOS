/**
 * Meta Pixel — Amo Viajar
 * Pixel ID: 1526440209138815
 *
 * O PageView é disparado automaticamente pelo script base em src/app/layout.tsx.
 * As funções abaixo estão prontas para uso — importar e chamar no momento certo.
 *
 * Próximos eventos a ativar:
 *  - trackLead()       → envio do formulário /lista-vip
 *  - trackContact()    → clique no botão WhatsApp
 *  - trackViewContent() → página de cada viagem
 *  - trackPurchase()   → checkout concluído (futuro)
 *
 * CAPI / Advanced Matching: preparar na próxima fase junto com a API server-side.
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq: (...args: any[]) => void;
    _fbq: unknown;
  }
}

function track(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params);
  }
}

// ─── Eventos prontos para ativar ──────────────────────────────────────────────

/**
 * LEAD — disparar após envio com sucesso do formulário /lista-vip
 *
 * Exemplo de uso em ListaVipForm.tsx:
 *   import { trackLead } from "@/lib/meta-pixel";
 *   // ... dentro do handleSubmit, após insert sem erro:
 *   trackLead();
 */
export function trackLead() {
  track("Lead");
}

/**
 * CONTACT — disparar quando o usuário clicar no botão do WhatsApp
 *
 * Exemplo de uso em WhatsAppFloat.tsx ou qualquer botão de WhatsApp:
 *   import { trackContact } from "@/lib/meta-pixel";
 *   onClick={() => { trackContact(); window.open(url, "_blank"); }}
 */
export function trackContact() {
  track("Contact");
}

/**
 * VIEW CONTENT — disparar ao visualizar uma página específica de viagem
 *
 * Parâmetros recomendados pela Meta:
 *   content_name   → nome da viagem (ex: "Campos do Jordão")
 *   content_category → "Excursão"
 *   content_ids    → [slug ou ID da viagem]
 *   content_type   → "product"
 *
 * Exemplo de uso em /viagens/[slug]/page.tsx:
 *   import { trackViewContent } from "@/lib/meta-pixel";
 *   useEffect(() => { trackViewContent({ content_name: viagem.nome, content_category: "Excursão" }); }, []);
 */
export function trackViewContent(params?: {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}) {
  track("ViewContent", params);
}

/**
 * PURCHASE — disparar após pagamento confirmado (fase futura)
 *
 * Parâmetros obrigatórios pela Meta:
 *   value    → valor da transação (ex: 890.00)
 *   currency → "BRL"
 *
 * Exemplo de uso em /pagamento/sucesso/page.tsx:
 *   import { trackPurchase } from "@/lib/meta-pixel";
 *   trackPurchase({ value: 890, currency: "BRL" });
 */
export function trackPurchase(params: { value: number; currency: string }) {
  track("Purchase", params);
}

// ─── Advanced Matching (preparado para fase futura) ───────────────────────────
/**
 * Advanced Matching — enviar dados hasheados do usuário para melhorar atribuição.
 * Chamar fbq('init', PIXEL_ID, { em: hash_email, ph: hash_phone }) APÓS o login/cadastro.
 * Implementar junto com CAPI para máxima qualidade de sinal.
 *
 * Não implementar ainda — aguardar fase CAPI.
 */
