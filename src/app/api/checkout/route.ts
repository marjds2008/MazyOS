import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";

function getMp() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");
  return new MercadoPagoConfig({ accessToken: token });
}

// ── Helpers ──────────────────────────────────────────────────

interface LoteViagem { numero: number; vagas: number; valor: number }

function getLotePreco(viagem: {
  valor?: number;
  vagas_totais?: number;
  vagas_disponiveis?: number;
  lotes_ativo?: boolean;
  lotes?: LoteViagem[];
}): number {
  if (!viagem.lotes_ativo || !viagem.lotes?.length) {
    return viagem.valor ?? 0;
  }
  const totais      = viagem.vagas_totais ?? 0;
  const disponiveis = viagem.vagas_disponiveis ?? totais;
  const preenchidas = Math.max(0, totais - disponiveis);
  let acumulado = 0;
  for (const lote of viagem.lotes) {
    if (preenchidas < acumulado + lote.vagas) return lote.valor;
    acumulado += lote.vagas;
  }
  return viagem.lotes[viagem.lotes.length - 1]?.valor ?? viagem.valor ?? 0;
}

// ── Handler ──────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { viagem_id, nome, whatsapp, quantidade_pessoas, tipo_pagamento } = body as {
      viagem_id: string;
      nome: string;
      whatsapp: string;
      quantidade_pessoas: number;
      tipo_pagamento: "entrada" | "completo";
    };

    // Validações
    if (!viagem_id || !nome?.trim() || !whatsapp?.trim() || !quantidade_pessoas) {
      return NextResponse.json({ erro: "Dados incompletos" }, { status: 400 });
    }
    if (quantidade_pessoas < 1 || quantidade_pessoas > 20) {
      return NextResponse.json({ erro: "Quantidade inválida" }, { status: 400 });
    }

    // Busca viagem
    const supabase = getSupabase();
    const { data: viagem, error: errViagem } = await supabase
      .from("viagens")
      .select("id, titulo, destino, valor, valor_sinal, vagas_disponiveis, vagas_totais, lotes_ativo, lotes")
      .eq("id", viagem_id)
      .in("status", ["aberta", "ultimas_vagas"])
      .single();

    if (errViagem || !viagem) {
      return NextResponse.json({ erro: "Viagem não encontrada ou indisponível" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = viagem as any;

    // Verifica vagas
    if ((v.vagas_disponiveis ?? 0) < quantidade_pessoas) {
      return NextResponse.json({
        erro: `Apenas ${v.vagas_disponiveis} vaga(s) disponível(is)`,
      }, { status: 409 });
    }

    // Calcula preço por pessoa
    let precoPorPessoa: number;
    if (tipo_pagamento === "entrada") {
      if (!v.valor_sinal) {
        return NextResponse.json({ erro: "Sinal não disponível para esta viagem" }, { status: 400 });
      }
      precoPorPessoa = v.valor_sinal;
    } else {
      precoPorPessoa = getLotePreco(v);
    }

    if (precoPorPessoa <= 0) {
      return NextResponse.json({ erro: "Valor não configurado para esta viagem" }, { status: 400 });
    }

    const valorTotal  = precoPorPessoa * quantidade_pessoas;
    const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const isLocalhost = siteUrl.includes("localhost");

    // Cria preferência no Mercado Pago
    const preference = new Preference(getMp());
    const pref = await preference.create({
      body: {
        items: [{
          id:          viagem_id,
          title:       `${v.titulo}`,
          description: `${tipo_pagamento === "entrada" ? "Sinal" : "Valor completo"} · ${quantidade_pessoas} pessoa(s) · ${v.destino}`,
          quantity:    1,
          currency_id: "BRL",
          unit_price:  valorTotal,
        }],
        payer: {
          name:  nome,
          phone: {
            area_code: whatsapp.replace(/\D/g, "").substring(0, 2),
            number:    whatsapp.replace(/\D/g, "").substring(2),
          },
        },
        ...(isLocalhost ? {} : {
          back_urls: {
            success: `${siteUrl}/pagamento/sucesso`,
            failure: `${siteUrl}/pagamento/falha`,
            pending: `${siteUrl}/pagamento/pendente`,
          },
          auto_return:      "approved" as const,
        }),
        notification_url:   isLocalhost ? undefined : `${siteUrl}/api/mp-webhook`,
        external_reference: viagem_id,
        metadata: {
          viagem_id,
          nome,
          whatsapp,
          quantidade_pessoas,
          tipo_pagamento,
        },
        statement_descriptor: "AMO VIAJAR",
      },
    });

    // Salva reserva (usando admin para garantir a escrita)
    const admin = getSupabaseAdmin();
    const { error: errReserva } = await admin.from("reservas").insert({
      viagem_id,
      mp_preference_id: pref.id,
      nome:             nome.trim(),
      whatsapp:         whatsapp.trim(),
      quantidade_pessoas,
      valor_total:      valorTotal,
      tipo_pagamento,
      status:           "pendente",
    });
    if (errReserva) console.error("[checkout] erro ao salvar reserva:", errReserva);

    return NextResponse.json({ init_point: pref.init_point });

  } catch (err: unknown) {
    const detail = (() => { try { return JSON.stringify(err, Object.getOwnPropertyNames(err as object)); } catch { return String(err); } })();
    console.error("[checkout] erro:", detail);
    return NextResponse.json({ erro: "Erro interno ao criar preferência de pagamento" }, { status: 500 });
  }
}
