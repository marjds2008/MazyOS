"use client";

import { useEffect, useState } from "react";
import { Users, Target, Store, MessageCircle, Zap, CheckCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  total_participants: number;
  total_campanhas: number;
  total_parceiros: number;
  whatsapp_sent: number;
  whatsapp_pending: number;
  whatsapp_failed: number;
  total_pontos: number;
}

const CARDS = [
  { key: "total_participants", label: "Participantes",  icon: Users,         href: "/participantes", color: "bg-blue-100 text-blue-700" },
  { key: "total_campanhas",    label: "Campanhas",      icon: Target,        href: "/campanhas",     color: "bg-amber-100 text-amber-700" },
  { key: "total_parceiros",    label: "Parceiros",      icon: Store,         href: "/parceiros",     color: "bg-purple-100 text-purple-700" },
  { key: "whatsapp_sent",      label: "WhatsApp Sent",  icon: MessageCircle, href: "/whatsapp-logs", color: "bg-green-100 text-green-700" },
  { key: "whatsapp_pending",   label: "Pendentes",      icon: Zap,           href: "/automacoes",    color: "bg-sky-100 text-sky-700" },
  { key: "whatsapp_failed",    label: "Falhas",         icon: CheckCircle,   href: "/whatsapp-logs", color: "bg-red-100 text-red-700" },
  { key: "total_pontos",       label: "Total Pontos",   icon: TrendingUp,    href: "/participantes", color: "bg-amber-100 text-amber-700" },
] as const;

export default function DashboardPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("get_pp_dashboard_stats");
        if (error) setError(error.message);
        else setStats(data as Stats);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Visão geral da Parceria Premiada</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
          Erro ao carregar dados: {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {CARDS.map(({ key, label, icon: Icon, href, color }) => (
          <Link key={key} href={href}
            className="card p-4 hover:shadow-md dark:hover:border-gray-700 transition-all group"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {loading ? "—" : (stats?.[key as keyof Stats] ?? 0).toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
