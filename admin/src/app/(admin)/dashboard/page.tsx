"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin, Users, Star, TrendingUp, Clock, MessageSquare,
  Banknote, CreditCard, CheckCircle, BookmarkCheck,
} from "lucide-react";
import Link from "next/link";

// ── Helpers ──────────────────────────────────────────────────

function getPeriodoInicio(periodo: string): string | null {
  const now = new Date();
  switch (periodo) {
    case "7d":  return new Date(now.getTime() - 7  * 86400000).toISOString();
    case "30d": return new Date(now.getTime() - 30 * 86400000).toISOString();
    case "mes": return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    case "3m":  return new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    case "ano": return new Date(now.getFullYear(), 0, 1).toISOString();
    default:    return null;
  }
}

const PERIODO_LABEL: Record<string, string> = {
  tudo: "todo o período", mes: "este mês", "30d": "últimos 30 dias",
  "3m": "últimos 3 meses", ano: "este ano",
};

const PERIODOS = ["tudo", "mes", "30d", "3m", "ano"];
const STATUS_LEAD_OPTIONS = ["todos", "novo", "contatado", "negociando", "reservado", "pago", "viajou", "perdido"];

// ── Badges ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    aberta:        "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    ultimas_vagas: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    esgotada:      "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    encerrada:     "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
    rascunho:      "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  };
  const label: Record<string, string> = {
    aberta: "Aberta", ultimas_vagas: "Últimas vagas", esgotada: "Esgotada",
    encerrada: "Encerrada", rascunho: "Rascunho",
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[status] ?? ""}`}>{label[status] ?? status}</span>;
}

function LeadStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    novo:       "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    contatado:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
    negociando: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
    reservado:  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    pago:       "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    viajou:     "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
    perdido:    "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500",
  };
  const label: Record<string, string> = {
    novo: "Novo", contatado: "Contatado", negociando: "Negociando",
    reservado: "Reservado", pago: "Pago", viajou: "Viajou", perdido: "Perdido",
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${map[status] ?? ""}`}>{label[status] ?? status}</span>;
}

// ── Page ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const [periodo, setPeriodo]       = useState("tudo");
  const [statusLead, setStatusLead] = useState("todos");
  const [loading, setLoading]       = useState(true);

  const [viagensAbertas,  setViagensAbertas]  = useState(0);
  const [leadsNovos,      setLeadsNovos]      = useState(0);
  const [totalClientes,   setTotalClientes]   = useState(0);
  const [listaVip,        setListaVip]        = useState(0);
  const [leadsPagos,      setLeadsPagos]      = useState(0);
  const [leadsReservados, setLeadsReservados] = useState(0);
  const [proximasViagens, setProximasViagens] = useState<Record<string, unknown>[]>([]);
  const [ultimosLeads,    setUltimosLeads]    = useState<Record<string, unknown>[]>([]);
  const [receitaTotal,    setReceitaTotal]    = useState(0);
  const [receitaMes,      setReceitaMes]      = useState(0);
  const [ticketMedio,     setTicketMedio]     = useState(0);
  const [topViagens,      setTopViagens]      = useState<{ titulo: string; destino: string; receita: number; passageiros: number }[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const desde = getPeriodoInicio(periodo);

      const [
        { count: vA },
        { count: lN },
        { count: tC },
        { count: lV },
        { count: lP },
        { count: lR },
        { data: pV },
        { data: uL },
        { data: rR },
      ] = await Promise.all([
        (supabase as any).from("viagens").select("*", { count: "exact", head: true })
          .in("status", ["aberta", "ultimas_vagas"]),
        (supabase as any).from("leads").select("*", { count: "exact", head: true })
          .eq("status", "novo"),
        (supabase as any).from("clientes").select("*", { count: "exact", head: true })
          .eq("opt_out", false),
        (supabase as any).from("lista_vip").select("*", { count: "exact", head: true }),

        (() => {
          let q = (supabase as any).from("leads").select("*", { count: "exact", head: true })
            .in("status", ["pago", "viajou"]);
          if (desde) q = q.gte("criado_em", desde);
          return q;
        })(),
        (() => {
          let q = (supabase as any).from("leads").select("*", { count: "exact", head: true })
            .eq("status", "reservado");
          if (desde) q = q.gte("criado_em", desde);
          return q;
        })(),

        (supabase as any).from("viagens")
          .select("id, titulo, destino, data_saida, vagas_disponiveis, status")
          .in("status", ["aberta", "ultimas_vagas"])
          .order("data_saida", { ascending: true })
          .limit(5),

        (() => {
          let q = (supabase as any).from("leads")
            .select("id, nome, whatsapp, cidade, status, criado_em, viagens(titulo)")
            .order("criado_em", { ascending: false });
          if (statusLead !== "todos") q = q.eq("status", statusLead);
          if (desde) q = q.gte("criado_em", desde);
          return q.limit(8);
        })(),

        (() => {
          let q = (supabase as any).from("participacoes")
            .select("valor, criado_em, viagem_id, viagens(titulo, destino)")
            .not("valor", "is", null);
          if (desde) q = q.gte("criado_em", desde);
          return q;
        })(),
      ]);

      setViagensAbertas(vA ?? 0);
      setLeadsNovos(lN ?? 0);
      setTotalClientes(tC ?? 0);
      setListaVip(lV ?? 0);
      setLeadsPagos(lP ?? 0);
      setLeadsReservados(lR ?? 0);
      setProximasViagens(pV ?? []);
      setUltimosLeads(uL ?? []);

      // Financeiro
      const rows = rR ?? [];
      const total = rows.reduce((s: number, p: any) => s + (p.valor ?? 0), 0);
      const ticket = rows.length ? total / rows.length : 0;
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const mes = rows.filter((p: any) => p.criado_em >= inicioMes).reduce((s: number, p: any) => s + (p.valor ?? 0), 0);

      setReceitaTotal(total);
      setTicketMedio(ticket);
      setReceitaMes(mes);

      const porViagem: Record<string, { titulo: string; destino: string; receita: number; passageiros: number }> = {};
      for (const p of rows as any[]) {
        if (!p.viagem_id) continue;
        const v = p.viagens as { titulo: string; destino: string } | null;
        if (!v) continue;
        porViagem[p.viagem_id] ??= { titulo: v.titulo, destino: v.destino, receita: 0, passageiros: 0 };
        porViagem[p.viagem_id].receita     += p.valor ?? 0;
        porViagem[p.viagem_id].passageiros += 1;
      }
      setTopViagens(Object.values(porViagem).sort((a, b) => b.receita - a.receita).slice(0, 5));

      setLoading(false);
    }
    load();
  }, [periodo, statusLead]);

  // ── Formatadores ─────────────────────────────────────────
  function fmtBRL(v: number) {
    if (v === 0) return "—";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  function fmtData(d?: string) {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }
  function fmtTs(ts: string) {
    return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  const statsGerais = [
    { label: "Viagens abertas", value: viagensAbertas, icon: MapPin,        color: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",                href: "/viagens" },
    { label: "Leads novos",     value: leadsNovos,     icon: MessageSquare,  color: "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/15",               href: "/leads" },
    { label: "Clientes ativos", value: totalClientes,  icon: Users,          color: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400",           href: "/clientes" },
    { label: "Família VIP",     value: listaVip,       icon: Star,           color: "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",       href: "/lista-vip" },
  ];

  const statsFinanceiro = [
    { label: "Receita total",  value: fmtBRL(receitaTotal), icon: Banknote,      color: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400",          href: "/clientes" },
    { label: "Este mês",       value: fmtBRL(receitaMes),   icon: TrendingUp,    color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",  href: "/clientes" },
    { label: "Ticket médio",   value: fmtBRL(ticketMedio),  icon: CreditCard,    color: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",              href: "/clientes" },
    { label: "Leads pagos",    value: leadsPagos,           icon: CheckCircle,   color: "bg-lime-50 text-lime-700 dark:bg-lime-500/15 dark:text-lime-400",               href: "/leads" },
    { label: "Reservados",     value: leadsReservados,      icon: BookmarkCheck, color: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",           href: "/leads" },
  ];

  const periodLabel = PERIODO_LABEL[periodo] ?? "todo o período";

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Visão geral da Amo Viajar</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-1.5 flex-wrap">
          {PERIODOS.map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                periodo === p ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}>
              {PERIODO_LABEL[p]}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap ml-auto">
          {STATUS_LEAD_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatusLead(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                statusLead === s ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}>
              {s === "todos" ? "Todos leads" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
      ) : (
        <>
          {/* Stats gerais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsGerais.map(({ label, value, icon: Icon, color, href }) => (
              <Link key={label} href={href}
                className="card p-5 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md dark:hover:shadow-none transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500 dark:text-green-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{label}</div>
              </Link>
            ))}
          </div>

          {/* Stats financeiros */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Financeiro</h2>
              <span className="text-xs text-gray-400 dark:text-gray-600">— {periodLabel}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {statsFinanceiro.map(({ label, value, icon: Icon, color, href }) => (
                <Link key={label} href={href}
                  className="card p-5 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md dark:hover:shadow-none transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-green-500 dark:text-green-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white truncate">{value}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{label}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tabelas */}
          <div className="grid lg:grid-cols-2 gap-5">

            {/* Próximas viagens */}
            <div className="card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-primary" /> Próximas Viagens
                </h2>
                <Link href="/viagens" className="text-brand-primary text-xs font-medium hover:underline">Ver todas</Link>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {!proximasViagens.length && (
                  <p className="px-5 py-8 text-gray-400 text-sm text-center">Nenhuma viagem aberta.</p>
                )}
                {proximasViagens.map((v: any) => (
                  <Link key={v.id} href={`/viagens/editar?id=${v.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{v.titulo}</div>
                      <div className="text-gray-400 dark:text-gray-500 text-xs">{v.destino} · {fmtData(v.data_saida)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{v.vagas_disponiveis} vagas</div>
                      <StatusBadge status={v.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Últimos leads */}
            <div className="card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-primary" />
                  Leads
                  {statusLead !== "todos" && (
                    <span className="text-xs font-normal text-gray-400 capitalize">· {statusLead}</span>
                  )}
                </h2>
                <Link href="/leads" className="text-brand-primary text-xs font-medium hover:underline">Ver todos</Link>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {!ultimosLeads.length && (
                  <p className="px-5 py-8 text-gray-400 text-sm text-center">
                    Nenhum lead {statusLead !== "todos" ? `com status "${statusLead}" ` : ""}
                    {getPeriodoInicio(periodo) ? `em ${periodLabel}` : ""}.
                  </p>
                )}
                {ultimosLeads.map((l: any) => (
                  <Link key={l.id} href="/leads"
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 dark:bg-brand-primary/15 flex items-center justify-center shrink-0">
                      <span className="text-brand-primary text-xs font-bold">{l.nome.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{l.nome}</div>
                      <div className="text-gray-400 dark:text-gray-500 text-xs">
                        {l.viagens?.titulo ?? "Sem viagem"} · {fmtTs(l.criado_em)}
                      </div>
                    </div>
                    <LeadStatusBadge status={l.status} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Top viagens por receita */}
          {topViagens.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-green-500 dark:text-green-400" /> Top Viagens por Receita
                </h2>
                <span className="text-xs text-gray-400">{periodLabel}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      {["#", "Viagem", "Destino", "Passageiros", "Receita"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                    {topViagens.map((v, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-5 py-3 text-xs font-bold text-gray-300 dark:text-gray-600">#{i + 1}</td>
                        <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{v.titulo}</td>
                        <td className="px-5 py-3 text-gray-500">{v.destino}</td>
                        <td className="px-5 py-3 text-gray-700 dark:text-gray-300 font-medium">{v.passageiros}</td>
                        <td className="px-5 py-3">
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {v.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
