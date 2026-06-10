import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Send, Users } from "lucide-react";
import type { CampanhaWhatsapp } from "@/types/database";

const STATUS_LABEL: Record<string, string> = {
  rascunho:  "Rascunho",
  pronta:    "Pronta para enviar",
  enviada:   "Enviada",
  cancelada: "Cancelada",
};
const STATUS_COLOR: Record<string, string> = {
  rascunho:  "bg-gray-100 text-gray-500",
  pronta:    "bg-blue-100 text-blue-700",
  enviada:   "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-600",
};

const SEGMENTO_LABEL: Record<string, string> = {
  lista_vip:             "Lista VIP",
  todos_clientes:        "Todos os clientes",
  leads_novos:           "Leads novos",
  leads_nao_convertidos: "Leads não convertidos",
  viagem_especifica:     "Interessados na viagem",
  categoria_praia:       "Interessados: Praia",
  categoria_serra:       "Interessados: Serra",
  categoria_cultura:     "Interessados: Cultura",
  categoria_fe:          "Interessados: Fé",
  categoria_interior:    "Interessados: Interior RJ",
};

export default async function CampanhasPage() {
  const supabase = await createClient();
  const { data: campanhas } = await supabase
    .from("campanhas_whatsapp")
    .select("*, viagens(titulo, destino)")
    .order("criado_em", { ascending: false });

  const stats = {
    total:    campanhas?.length ?? 0,
    enviadas: campanhas?.filter(c => c.status === "enviada").length ?? 0,
    prontas:  campanhas?.filter(c => c.status === "pronta").length ?? 0,
    enviados: campanhas?.reduce((s, c) => s + (c.total_enviados ?? 0), 0) ?? 0,
  };

  function fmtTs(ts: string) {
    return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campanhas WhatsApp</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie e dispare mensagens para seus clientes</p>
        </div>
        <Link href="/campanhas/nova" className="btn-primary">
          <Plus className="w-4 h-4" /> Nova campanha
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",        value: stats.total,    icon: "📋" },
          { label: "Prontas",      value: stats.prontas,  icon: "✅" },
          { label: "Enviadas",     value: stats.enviadas, icon: "📤" },
          { label: "Msgs enviadas",value: stats.enviados, icon: "💬" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="card overflow-hidden">
        {!campanhas?.length ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-4">📢</div>
            <p className="text-gray-500 text-sm mb-4">Nenhuma campanha criada ainda.</p>
            <Link href="/campanhas/nova" className="btn-primary inline-flex">
              <Plus className="w-4 h-4" /> Criar primeira campanha
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(campanhas as (CampanhaWhatsapp & { viagens?: { titulo: string; destino: string } | null })[]).map(c => (
              <Link key={c.id} href={`/campanhas/${c.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{c.titulo}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-3 flex-wrap">
                    <span>{SEGMENTO_LABEL[c.segmento] ?? c.segmento}</span>
                    {c.viagens && <span>· {c.viagens.titulo}</span>}
                    <span>· {fmtTs(c.criado_em)}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right hidden sm:block">
                  {c.status === "enviada" ? (
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Send className="w-3.5 h-3.5" /> {c.total_enviados ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {c.total_contatos ?? 0}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {c.total_contatos ? `${c.total_contatos} contatos` : "—"}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
