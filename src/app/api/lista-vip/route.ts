import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { nome, whatsapp, cidade } = await req.json();

    if (!nome?.trim() || !whatsapp?.trim()) {
      return NextResponse.json(
        { error: "Nome e WhatsApp são obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("lista_vip").insert({
      nome: nome.trim(),
      whatsapp: whatsapp.replace(/\D/g, ""),
      cidade: cidade?.trim() || null,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lista-vip]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
