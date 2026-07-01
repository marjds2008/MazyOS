// TODO SECURITY: Endpoint sem autenticação — acesso temporário para homologação.
// Antes do deploy público, adicionar: Authorization: Bearer <AUTOMATION_API_KEY>
//
// HOOK N8N: Configurar polling neste endpoint a cada 1 minuto.
//           GET /api/automation/pending?limit=10
//
// Paginação: usar next_cursor retornado para buscar a próxima página.
// Cursor completo (por created_at) requer upgrade do RPC get_pending_events no DB.

import { createClient } from "@/lib/supabase/server";
import { NextResponse }  from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit  = Math.min(parseInt(searchParams.get("limit")  ?? "100"), 100);

  const supabase = await createClient();

  // Buscar eventos pendentes via RPC SECURITY DEFINER
  const { data: events, error } = await supabase.rpc("get_pending_events", {
    p_limit: limit,
  });

  if (error) {
    console.error("[automation/pending]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Buscar slugs de campanha para enriquecimento do payload
  // (campaigns tem policy anon SELECT, não precisa de service_role)
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, slug");

  const campaignMap = new Map<string, string>(
    (campaigns ?? []).map((c: { id: string; slug: string }) => [c.id, c.slug])
  );

  // Enriquecer payload:
  // - Renomear name → participant_name (alinhamento com event-contract.md)
  // - Adicionar campaign_slug a partir do campaign_id
  const enriched = (events ?? []).map((event: Record<string, unknown>) => {
    const raw     = event.payload as Record<string, unknown>;
    const payload = { ...raw };

    if (payload.name !== undefined && payload.participant_name === undefined) {
      payload.participant_name = payload.name;
      delete payload.name;
    }

    if (payload.campaign_id && !payload.campaign_slug) {
      payload.campaign_slug = campaignMap.get(payload.campaign_id as string) ?? null;
    }

    return { ...event, payload };
  });

  // next_cursor: queue_id do último evento retornado
  // O cliente passa ?cursor=<queue_id> na próxima chamada para paginar
  // (requer suporte a cursor no RPC — a implementar em sprint futura)
  const next_cursor =
    enriched.length === limit
      ? (enriched[enriched.length - 1] as Record<string, unknown>)?.queue_id ?? null
      : null;

  return NextResponse.json({
    events:      enriched,
    count:       enriched.length,
    next_cursor,
    fetched_at:  new Date().toISOString(),
  });
}
