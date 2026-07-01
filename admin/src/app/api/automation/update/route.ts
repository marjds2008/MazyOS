// TODO SECURITY: Endpoint sem autenticação — para homologação.
// Antes do deploy público, adicionar verificação de API key no header.
//
// HOOK N8N: Este endpoint é chamado pelo workflow n8n após processar cada evento.
//           Configurar como HTTP Request (POST) ao final de cada branch do workflow.
//
// Uso: POST /api/automation/update
// Body: { queue_id, status, error?, processed_at? }
// Status válidos: pending | processing | done | failed | cancelled

import { createClient } from "@/lib/supabase/server";
import { NextResponse }  from "next/server";

const VALID_STATUSES = ["pending", "processing", "done", "failed", "cancelled"] as const;
type QueueStatus = (typeof VALID_STATUSES)[number];

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { queue_id, status, error: errorMsg, processed_at } = body as {
    queue_id:     string | undefined;
    status:       string | undefined;
    error?:       string;
    processed_at?: string;
  };

  if (!queue_id) {
    return NextResponse.json({ error: "queue_id é obrigatório" }, { status: 400 });
  }
  if (!status) {
    return NextResponse.json({ error: "status é obrigatório" }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(status as QueueStatus)) {
    return NextResponse.json(
      { error: `Status inválido. Valores aceitos: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("update_queue_status", {
    p_queue_id:     queue_id,
    p_status:       status,
    p_error:        errorMsg        ?? null,
    p_processed_at: processed_at   ?? new Date().toISOString(),
  });

  if (error) {
    console.error("[automation/update]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data?.error) {
    const httpStatus = data.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: data.error }, { status: httpStatus });
  }

  return NextResponse.json(data);
}
