import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { getSupabaseAdmin } from "@/lib/supabase";

function getMp() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");
  return new MercadoPagoConfig({ accessToken: token });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // MP envia type="payment" para pagamentos confirmados
    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ ok: true });
    }

    const paymentId = String(body.data.id);

    // Busca detalhes do pagamento na API do MP
    const payment    = new Payment(getMp());
    const paymentData = await payment.get({ id: paymentId });

    // Só processa pagamentos aprovados
    if (paymentData.status !== "approved") {
      return NextResponse.json({ ok: true });
    }

    const meta = (paymentData.metadata ?? {}) as {
      viagem_id?: string;
      nome?: string;
      whatsapp?: string;
      quantidade_pessoas?: number;
      tipo_pagamento?: string;
    };

    const { viagem_id, nome, whatsapp, quantidade_pessoas = 1, tipo_pagamento } = meta;

    if (!viagem_id) {
      console.error("[mp-webhook] metadata sem viagem_id", paymentData.id);
      return NextResponse.json({ ok: true });
    }

    const admin = getSupabaseAdmin();

    // Idempotência: ignora se já processamos este pagamento
    const { data: reservaExistente } = await admin
      .from("reservas")
      .select("id, status")
      .eq("mp_payment_id", paymentId)
      .maybeSingle();

    if (reservaExistente?.status === "aprovado") {
      return NextResponse.json({ ok: true });
    }

    // Atualiza reserva: associa payment_id e muda status
    await admin
      .from("reservas")
      .update({
        status:          "aprovado",
        mp_payment_id:   paymentId,
        atualizado_em:   new Date().toISOString(),
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("mp_preference_id", (paymentData as any).preference_id ?? "");

    // Busca viagem para atualizar vagas
    const { data: viagem } = await admin
      .from("viagens")
      .select("vagas_disponiveis, vagas_totais")
      .eq("id", viagem_id)
      .single();

    if (viagem) {
      const novasVagas = Math.max(0, (viagem.vagas_disponiveis ?? 0) - quantidade_pessoas);
      const totalVagas = viagem.vagas_totais ?? 0;

      // Atualiza status da viagem conforme vagas restantes
      let novoStatus = "aberta";
      if (novasVagas === 0) novoStatus = "esgotada";
      else if (totalVagas > 0 && novasVagas / totalVagas <= 0.15) novoStatus = "ultimas_vagas";

      await admin
        .from("viagens")
        .update({ vagas_disponiveis: novasVagas, status: novoStatus })
        .eq("id", viagem_id);
    }

    // Cria ou atualiza lead como reservado/pago
    if (whatsapp && nome) {
      const leadStatus = tipo_pagamento === "completo" ? "pago" : "reservado";

      const { data: leadExistente } = await admin
        .from("leads")
        .select("id")
        .eq("whatsapp", whatsapp.replace(/\D/g, ""))
        .eq("viagem_id", viagem_id)
        .maybeSingle();

      if (leadExistente) {
        await admin.from("leads").update({ status: leadStatus }).eq("id", leadExistente.id);
      } else {
        await admin.from("leads").insert({
          nome,
          whatsapp:          whatsapp.replace(/\D/g, ""),
          viagem_id,
          quantidade_pessoas,
          origem:            "checkout_mp",
          status:            leadStatus,
          mensagem:          `Pagamento via MP · ${tipo_pagamento} · ${quantidade_pessoas} pessoa(s)`,
        });
      }
    }

    console.log(`[mp-webhook] pagamento ${paymentId} aprovado · viagem ${viagem_id} · ${quantidade_pessoas} pessoa(s)`);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[mp-webhook] erro:", err);
    // Retorna 200 mesmo em erro para o MP não reenviar indefinidamente
    return NextResponse.json({ ok: true });
  }
}
