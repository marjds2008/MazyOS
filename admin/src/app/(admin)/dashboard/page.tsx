import { createClient } from "@/lib/supabase/server";
import { MapPin, Users, Star, TrendingUp, Clock, MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: viagensAbertas },
    { count: leadsNovos },
    { count: leadsTotal },
    { count: listaVip },
    { data: proximasViagens },
    { data: ultimosLeads },
  ] = await Promise.all([
    supabase.from("viagens").select("*", { count: "exact", head: true })
      .in("status", ["aberta", "ultimas_vagas"]),
    supabase.from("leads").select("*", { count: "exact", head: true })
      .eq("status", "novo"),
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("lista_vip").select("*", { count: "exact", head: true }),
    supabase.from("viagens")
      .select("id, titulo, destino, data_saida, vagas_disponiveis, status")
      .in("status", ["aberta", "ultimas_vagas"])
      .order("data_saida", { ascending: true })
      .limit(5),
    supabase.from("leads")
      .select("id, nome, whatsapp, cidade, status, criado_em, viagens(titulo)")
      .order("criado_em", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: "Viagens abertas",    value: viagensAbertas ?? 0,  icon: MapPin,        color: "bg-blue-50 text-blue-600",   href: "/viagens" },
    { label: "Leads novos",        value: leadsNovos ?? 0,      icon: MessageSquare, color: "bg-orange-50 text-brand-primary", href: "/leads" },
    { label: "Total de leads",     value: leadsTotal ?? 0,      icon: TrendingUp,    color: "bg-green-50 text-green-600", href: "/leads" },
    { label: "Família VIP",        value: listaVip ?? 0,        icon: Star,          color: "bg-purple-50 text-purple-600", href: "/lista-vip" },
  ];

  function fmtData(d?: string) {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  function fmtTs(ts: string) {
    return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da Amo Viajar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="card p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-gray-500 text-sm mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Próximas viagens */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-primary" /> Próximas Viagens
            </h2>
            <Link href="/viagens" className="text-brand-primary text-xs font-medium hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!proximasViagens?.length && (
              <p className="px-5 py-8 text-gray-400 text-sm text-center">Nenhuma viagem aberta.</p>
            )}
            {proximasViagens?.map((v) => (
              <Link key={v.id} href={`/viagens/${v.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{v.titulo}</div>
                  <div className="text-gray-400 text-xs">{v.destino} · {fmtData(v.data_saida)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-medium text-gray-600">{v.vagas_disponiveis} vagas</div>
                  <StatusBadge status={v.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Últimos leads */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-primary" /> Últimos Leads
            </h2>
            <Link href="/leads" className="text-brand-primary text-xs font-medium hover:underline">Ver todos</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!ultimosLeads?.length && (
              <p className="px-5 py-8 text-gray-400 text-sm text-center">Nenhum lead ainda.</p>
            )}
            {ultimosLeads?.map((l) => (
              <Link key={l.id} href="/leads" className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-brand-primary text-xs font-bold">{l.nome.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{l.nome}</div>
                  <div className="text-gray-400 text-xs">{(l.viagens as unknown as {titulo:string}|null)?.titulo ?? "Sem viagem"} · {fmtTs(l.criado_em)}</div>
                </div>
                <LeadStatusBadge status={l.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    aberta:         "bg-green-100 text-green-700",
    ultimas_vagas:  "bg-amber-100 text-amber-700",
    esgotada:       "bg-red-100 text-red-700",
    encerrada:      "bg-gray-100 text-gray-600",
    rascunho:       "bg-gray-100 text-gray-500",
  };
  const label: Record<string, string> = {
    aberta: "Aberta", ultimas_vagas: "Últimas vagas", esgotada: "Esgotada",
    encerrada: "Encerrada", rascunho: "Rascunho",
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[status] ?? ""}`}>{label[status] ?? status}</span>;
}

function LeadStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    novo:        "bg-blue-100 text-blue-700",
    contatado:   "bg-yellow-100 text-yellow-700",
    negociando:  "bg-purple-100 text-purple-700",
    fechado:     "bg-green-100 text-green-700",
    perdido:     "bg-gray-100 text-gray-500",
  };
  const label: Record<string, string> = {
    novo: "Novo", contatado: "Contatado", negociando: "Negociando",
    fechado: "Fechado", perdido: "Perdido",
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[status] ?? ""}`}>{label[status] ?? status}</span>;
}
