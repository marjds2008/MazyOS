"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Plus } from "lucide-react";

const statusLabel: Record<string, string> = {
  rascunho: "Rascunho", aberta: "Aberta", ultimas_vagas: "Últimas vagas",
  esgotada: "Esgotada", encerrada: "Encerrada",
};
const statusColor: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-500", aberta: "bg-green-100 text-green-700",
  ultimas_vagas: "bg-amber-100 text-amber-700", esgotada: "bg-red-100 text-red-700",
  encerrada: "bg-gray-100 text-gray-600",
};

type Viagem = {
  id: string;
  titulo: string;
  destino: string;
  categoria: string;
  data_saida: string | null;
  vagas_disponiveis: number | null;
  vagas_totais: number | null;
  valor: number | null;
  status: string;
};

export default function ViagensPage() {
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await (supabase as any)
        .from("viagens")
        .select("id, titulo, destino, categoria, data_saida, vagas_disponiveis, vagas_totais, valor, status")
        .order("criado_em", { ascending: false });
      setViagens(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Viagens</h1>
          <p className="text-gray-500 text-sm mt-1">{viagens.length} viagens cadastradas</p>
        </div>
        <Link href="/viagens/nova" className="btn-primary">
          <Plus className="w-4 h-4" /> Nova viagem
        </Link>
      </div>

      <div className="card overflow-hidden">
        {!viagens.length ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">Nenhuma viagem cadastrada.</p>
            <Link href="/viagens/nova" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" /> Criar primeira viagem
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Viagem", "Data", "Vagas", "Valor", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {viagens.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{v.titulo}</div>
                      <div className="text-gray-400 text-xs">{v.destino}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {v.data_saida ? new Date(v.data_saida + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {v.vagas_disponiveis ?? 0}/{v.vagas_totais ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {v.valor ? `R$ ${Number(v.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[v.status]}`}>
                        {statusLabel[v.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/viagens/editar?id=${v.id}`} className="text-brand-primary text-xs font-medium hover:underline">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
