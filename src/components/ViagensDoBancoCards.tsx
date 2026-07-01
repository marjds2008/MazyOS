"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import ModalCheckout, { type ViagemCheckout } from "@/components/ModalCheckout";

// ── Tipos ────────────────────────────────────────────────────

interface LoteViagem { numero: number; vagas: number; valor: number }

interface ViagemCard extends ViagemCheckout {
  categoria: string;
  descricao_curta?: string;
  data_retorno?: string;
  imagem_principal?: string;
  status: string;
}

// ── Helpers ──────────────────────────────────────────────────

function fmtData(d?: string) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

interface LoteInfo {
  lote: LoteViagem;
  vagasRestantesLote: number;
  pctOcupacao: number;
}

function calcLoteAtual(v: ViagemCard): LoteInfo | null {
  if (!v.lotes_ativo || !v.lotes?.length) return null;
  const totais = v.vagas_totais ?? 0;
  const disponiveis = v.vagas_disponiveis ?? totais;
  const preenchidas = Math.max(0, totais - disponiveis);
  const pctOcupacao = totais > 0 ? (preenchidas / totais) * 100 : 0;
  let acumulado = 0;
  for (const lote of v.lotes) {
    if (preenchidas < acumulado + lote.vagas) {
      return { lote, vagasRestantesLote: acumulado + lote.vagas - preenchidas, pctOcupacao };
    }
    acumulado += lote.vagas;
  }
  const ultimo = v.lotes[v.lotes.length - 1];
  return { lote: ultimo, vagasRestantesLote: 0, pctOcupacao: 100 };
}

const LOTE_COR: Record<number, { bg: string; text: string; bar: string }> = {
  1: { bg: "bg-green-500",  text: "text-green-700",  bar: "bg-green-500" },
  2: { bg: "bg-amber-500",  text: "text-amber-700",  bar: "bg-amber-500" },
  3: { bg: "bg-red-500",    text: "text-red-700",    bar: "bg-red-500"   },
};

const CATEGORIA_COR: Record<string, string> = {
  praia:   "bg-blue-100 text-blue-700",
  serra:   "bg-green-100 text-green-700",
  cultura: "bg-amber-100 text-amber-700",
  fe:      "bg-purple-100 text-purple-700",
};
const CATEGORIA_EMOJI: Record<string, string> = {
  praia: "🏖️", serra: "🏔️", cultura: "🏛️", fe: "✨",
};

// ── Card ─────────────────────────────────────────────────────

function ViagemCardItem({ v, onReservar }: { v: ViagemCard; onReservar: (v: ViagemCard) => void }) {
  const info    = calcLoteAtual(v);
  const cor     = info ? (LOTE_COR[info.lote.numero] ?? LOTE_COR[3]) : null;
  const preco   = info ? info.lote.valor : v.valor;
  const urgente = info
    ? info.vagasRestantesLote <= 5 && info.vagasRestantesLote > 0
    : v.status === "ultimas_vagas";
  const esgotada = v.status === "esgotada" || info?.vagasRestantesLote === 0;

  return (
    <div className={`group relative rounded-2xl overflow-hidden border flex flex-col transition-shadow duration-200 hover:shadow-xl bg-white ${
      urgente ? "border-red-300 ring-2 ring-red-200" : "border-gray-100"
    }`}>

      {urgente && !esgotada && (
        <div className="absolute top-3 right-3 z-20 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow animate-pulse">
          🔥 Últimas vagas!
        </div>
      )}
      {esgotada && (
        <div className="absolute top-3 right-3 z-20 bg-gray-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
          Esgotado
        </div>
      )}

      {/* Imagem */}
      <Link href={`/viagens/detalhe/?id=${v.id}`} className="block relative h-52 overflow-hidden bg-gray-200">
        {v.imagem_principal ? (
          <Image src={v.imagem_principal} alt={`Excursão Amo Viajar para ${v.destino}`} fill
            className={`object-cover group-hover:scale-105 transition-transform duration-500 ${esgotada ? "grayscale" : ""}`}
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary/20 to-brand-primary/5">
            <MapPin className="w-12 h-12 text-brand-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-3 left-4 text-white">
          <div className="font-bold text-xl font-serif leading-tight">{v.titulo}</div>
          <div className="text-white/80 text-sm flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {v.destino}
          </div>
        </div>
      </Link>

      {/* Corpo */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${CATEGORIA_COR[v.categoria] ?? "bg-gray-100 text-gray-600"}`}>
            {CATEGORIA_EMOJI[v.categoria]} {v.categoria === "fe" ? "Fé" : v.categoria.charAt(0).toUpperCase() + v.categoria.slice(1)}
          </span>
          {v.data_saida && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {fmtData(v.data_saida)}
            </span>
          )}
        </div>

        {v.descricao_curta && (
          <p className="text-gray-600 text-sm leading-relaxed flex-1 line-clamp-2">{v.descricao_curta}</p>
        )}

        {/* Barra de lotes */}
        {info && cor && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full text-white ${cor.bg}`}>
                LOTE {info.lote.numero}
                {info.vagasRestantesLote > 0 && <span className="opacity-80 font-normal">· aberto</span>}
              </span>
              <span className={`text-xs font-semibold flex items-center gap-1 ${cor.text}`}>
                <Users className="w-3 h-3" />
                {info.vagasRestantesLote > 0
                  ? `${info.vagasRestantesLote} ${info.vagasRestantesLote === 1 ? "vaga" : "vagas"} neste lote`
                  : "Lote esgotado"}
              </span>
            </div>
            <div className="space-y-1">
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${cor.bar}`}
                  style={{ width: `${Math.min(100, info.pctOcupacao)}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>{Math.round(info.pctOcupacao)}% das vagas preenchidas</span>
                <span>{v.vagas_disponiveis ?? 0} no total</span>
              </div>
            </div>
          </div>
        )}

        {/* Sem lotes */}
        {!info && v.vagas_disponiveis !== undefined && v.vagas_totais && v.vagas_totais > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {v.vagas_disponiveis} vagas disponíveis</span>
              <span>{Math.round(((v.vagas_totais - v.vagas_disponiveis) / v.vagas_totais) * 100)}% ocupado</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-primary rounded-full"
                style={{ width: `${Math.round(((v.vagas_totais - v.vagas_disponiveis) / v.vagas_totais) * 100)}%` }} />
            </div>
          </div>
        )}

        {/* Preço + CTA */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div>
            {preco ? (
              <>
                <div className="text-xs text-gray-400">{info ? `Lote ${info.lote.numero}` : "A partir de"}</div>
                <div className="text-xl font-bold text-brand-primary">{fmtBRL(preco)}</div>
                {v.valor_sinal && !esgotada && (
                  <div className="text-xs text-gray-400">Sinal: {fmtBRL(v.valor_sinal)}</div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-400">Consultar preço</div>
            )}
          </div>

          <button
            onClick={() => !esgotada && onReservar(v)}
            disabled={esgotada}
            className={`flex-1 max-w-[175px] py-3 rounded-xl text-sm font-bold transition-all ${
              esgotada
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-brand-primary hover:bg-brand-dark text-white shadow-sm hover:shadow-md"
            }`}
          >
            {esgotada ? "Esgotado" : "Reservar agora"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Grid ─────────────────────────────────────────────────────

export default function ViagensDoBancoCards({ viagens }: { viagens: ViagemCard[] }) {
  const [checkout, setCheckout] = useState<ViagemCard | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {viagens.map(v => (
          <ViagemCardItem key={v.id} v={v} onReservar={setCheckout} />
        ))}
      </div>

      {checkout && (
        <ModalCheckout
          viagem={checkout}
          loteAtual={calcLoteAtual(checkout)}
          onClose={() => setCheckout(null)}
        />
      )}
    </>
  );
}
