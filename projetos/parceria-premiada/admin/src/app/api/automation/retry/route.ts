import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { id } = await request.json() as { id: string };

  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.rpc("retry_pp_automation_item", { p_id: id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
