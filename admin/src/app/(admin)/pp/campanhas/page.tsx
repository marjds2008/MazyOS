"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExternalLink, Copy, Check, Users, Calendar } from "lucide-react";

const LANDING_BASE = "https://parceriapremiada.app.br";

interface Campaign {
  id: string;
  slug: string;
  title: string;
  status: string;
  draw_date: string | null;
  trip_date: string | null;
  participant_count: number;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: "Em breve",
  active:   "Ativa",
  ended:    "Encerrada",
};
const STATUS_COLOR: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  active:   "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  ended:    "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

export default function PPCampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [copied, setCopied]       = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("campaigns")
        .select("id, slug, title, status, draw_date, trip_date, participant_count, created_at")
        .order("created_at", { ascending: false });
      setCampanhas(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  }

  async function copyLink(slug: string) {
    const url = `${LANDING_BASE}/?campaign=${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campanhas</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sorteios ativos e histórico</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {["Título", "Slug", "Status", "Data Sorteio", "Participantes", "Ações"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {!campanhas.length && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">Nenhuma campanha encontrada.</td>
                  </tr>
                )}
                {campanhas.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{c.title}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{c.slug}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[c.status] ?? ""}`}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {fmtDate(c.draw_date)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-medium">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {c.participant_count}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={`${LANDING_BASE}/?campaign=${c.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver landing"
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => copyLink(c.slug)}
                          title="Copiar link da campanha"
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {copied === c.slug
                            ? <Check className="w-4 h-4 text-green-500" />
                            : <Copy className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
