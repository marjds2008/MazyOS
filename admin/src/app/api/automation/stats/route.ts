// GET /api/automation/stats?campaign=<slug>
//
// Retorna contagem de eventos por status na automation_queue.
// Sem parâmetro de campanha, retorna totais globais.
//
// HOOK N8N: Usar este endpoint para health-check do pipeline de automação.
// Alerta se pending > threshold ou failed > 0.

import { createClient } from "@/lib/supabase/server";
import { NextResponse }  from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaign = searchParams.get("campaign"); // slug opcional

  const supabase = await createClient();

  const params = campaign ? { p_campaign_slug: campaign } : {};

  const { data, error } = await supabase.rpc("admin_get_queue_stats", params);

  if (error) {
    console.error("[automation/stats]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data?.error) {
    return NextResponse.json({ error: data.error }, { status: 404 });
  }

  return NextResponse.json({
    ...data,
    campaign:    campaign ?? "all",
    fetched_at:  new Date().toISOString(),
  });
}
