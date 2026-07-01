// TODO SECURITY: Endpoint sem autenticação — acesso temporário para homologação.
//
// Reprocessa um evento com falha: redefine status para 'pending'.
// Usar quando um evento ficou em 'failed' e o problema foi corrigido.
//
// Uso: POST /api/automation/retry
// Body: { "queue_id": "<uuid>" }

import { createClient } from "@/lib/supabase/server";
import { NextResponse }  from "next/server";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { queue_id } = body as { queue_id?: string };

  if (!queue_id) {
    return NextResponse.json({ error: "queue_id é obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();

  // Redefine para pending — update_queue_status NÃO incrementa retry_count para pending
  const { data, error } = await supabase.rpc("update_queue_status", {
    p_queue_id: queue_id,
    p_status:   "pending",
    p_error:    null,
  });

  if (error) {
    console.error("[automation/retry]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data?.error) {
    const status = data.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: data.error }, { status });
  }

  return NextResponse.json({ ...data, retried_at: new Date().toISOString() });
}
