import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CampanhaForm from "@/components/CampanhaForm";
import Link from "next/link";
import { ChevronLeft, Send, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import type { MensagemWhatsapp } from "@/types/database";

const STATUS_ENVIO_COLOR: Record<string, string> = {
  enviado:            "bg-green-100 text-green-700",
  erro:               "bg-red-100 text-red-600",
  pendente:           "bg-gray-100 text-gray-500",
  ignorado_opt_out:   "bg-amber-100 text-amber-700",
};
const STATUS_ENVIO_LABEL: Record<string, string> = {
  enviado:          "Enviado",
  erro:             "Erro",
  pendente:         "Pendente",
  ignorado_opt_out: "Opt-out",
};

export default async function CampanhaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: campanha }, { data: mensagens }] = await Promise.all([
    supabase.from("campanhas_whatsapp")
      .select("*, viagens(id, titulo, destino, data_saida, valor, link_publico)")
      .eq("id", id)
      .single(),
    supabase.from("mensagens_whatsapp")
      .select("*, clientes(id, nome)")
      .eq("campanha_id", id)
      .order("criado_em", { ascending: true })
      .limit(200),
  ]);

  if (!campanha) notFound();

  const stats = {
    total:    mensagens?.length ?? 0,
    enviados: mensagens?.filter(m => m.status_envio === "enviado").length ?? 0,
    erros:    mensagens?.filter(m => m.status_envio === "erro").length ?? 0,
    optout:   mensagens?.filter(m => m.status_envio === "ignorado_opt_out").length ?? 0,
  };

  function fmtTs(ts?: string) {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/campanhas" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Link>
        <div className="flex items-start gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campanha.titulo}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {campanha.status === "enviada" && campanha.enviado_em
                ? `Enviada em ${fmtTs(campanha.enviado_em)}`
                : "Campanha em edição"}
            </p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <CampanhaForm campanha={campanha} />

      {/* Histórico de envios (só aparece se houver mensagens) */}
      {mensagens && mensagens.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Histórico de envios</h2>

          {/* Stats de envio */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total",    value: stats.total,    icon: <Users className="w-4 h-4" />,        color: "text-gray-700" },
              { label: "Enviados", value: stats.enviados, icon: <CheckCircle className="w-4 h-4" />,  color: "text-green-700" },
              { label: "Erros",    value: stats.erros,    icon: <XCircle className="w-4 h-4" />,      color: "text-red-600" },
              { label: "Opt-out",  value: stats.optout,   icon: <Clock className="w-4 h-4" />,        color: "text-amber-700" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card p-4">
                <div className={`flex items-center gap-2 ${color} mb-1`}>{icon}<span className="text-xs font-medium">{label}</span></div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
              </div>
            ))}
          </div>

          {/* Tabela de mensagens */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Contato", "WhatsApp", "Status", "Enviado em", "Erro"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(mensagens as (MensagemWhatsapp & { clientes?: { nome: string } | null })[]).map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {m.clientes?.nome ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{m.whatsapp}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_ENVIO_COLOR[m.status_envio]}`}>
                          {STATUS_ENVIO_LABEL[m.status_envio]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtTs(m.enviado_em)}</td>
                      <td className="px-4 py-3 text-red-500 text-xs max-w-[200px] truncate">{m.erro ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
