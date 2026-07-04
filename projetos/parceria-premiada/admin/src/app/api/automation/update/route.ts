import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id, status, erro } = body as { id: string; status: string; erro?: string };

  if (!id || !status) {
    return NextResponse.json({ error: "id e status são obrigatórios" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_pp_automation_status", {
    p_id:     id,
    p_status: status,
    p_erro:   erro ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
