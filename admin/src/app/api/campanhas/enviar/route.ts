import { createClient } from "@/lib/supabase/server";
import { NextResponse }  from "next/server";

export async function POST(request: Request) {
  const { campanha_id } = await request.json();
  if (!campanha_id) {
    return NextResponse.json({ error: "campanha_id obrigatório" }, { status: 400 });
  }

  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nUrl) {
    return NextResponse.json({ error: "N8N_WEBHOOK_URL não configurado" }, { status: 500 });
  }

  const supabase = await createClient();

  // Buscar campanha
  const { data: campanha, error: fetchError } = await supabase
    .from("campanhas_whatsapp")
    .select("*, viagens(titulo, destino, data_saida, valor, link_publico)")
    .eq("id", campanha_id)
    .single();

  if (fetchError || !campanha) {
    return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
  }
  if (campanha.status !== "pronta") {
    return NextResponse.json({ error: "Campanha precisa estar com status 'pronta'" }, { status: 400 });
  }

  // Chamar webhook do n8n
  let n8nOk = false;
  try {
    const n8nRes = await fetch(n8nUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campanha_id:          campanha.id,
        viagem_id:            campanha.viagem_id  ?? null,
        segmento:             campanha.segmento,
        mensagem:             campanha.mensagem,
        imagem_url:           campanha.imagem_url ?? null,
        audio_url:            campanha.audio_url  ?? null,
        delay_segundos:       parseInt(process.env.N8N_DELAY_SEGUNDOS ?? "3"),
        limite_por_execucao:  parseInt(process.env.N8N_LIMITE_POR_EXECUCAO ?? "50"),
      }),
    });
    n8nOk = n8nRes.ok;
  } catch {
    return NextResponse.json({ error: "Erro de conexão com n8n. Verifique se o serviço está online." }, { status: 502 });
  }

  if (!n8nOk) {
    return NextResponse.json({ error: "n8n retornou erro. Verifique o webhook e tente novamente." }, { status: 502 });
  }

  // Atualizar status da campanha para "enviada"
  await supabase
    .from("campanhas_whatsapp")
    .update({ status: "enviada", enviado_em: new Date().toISOString() })
    .eq("id", campanha_id);

  return NextResponse.json({ success: true });
}
