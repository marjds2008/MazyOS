"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Hash, Clock, CheckCircle, Zap, AlertCircle, MessageCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface Overview {
  total_participants: number;
  numbers_issued: number;
  participants_pending: number;
  participants_validated: number;
  queue_pending: number;
  queue_failed: number;
  whatsapp_sent: number;
  whatsapp_failed: number;
}

const CARDS = [
  { key: "total_participants",     label: "Total participantes",    icon: Users,          color: "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",   href: "/pp/participantes" },
  { key: "numbers_issued",         label: "Números emitidos",       icon: Hash,           color: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",           href: "/pp/participantes" },
  { key: "participants_pending",   label: "Participações pendentes",icon: Clock,          color: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",       href: "/pp/participantes" },
  { key: "participants_validated", label: "Participações validadas",icon: CheckCircle,    color: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400",       href: "/pp/participantes" },
  { key: "queue_pending",          label: "Eventos pendentes",      icon: Zap,            color: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",               href: "/pp/automacoes" },
  { key: "queue_failed",           label: "Eventos com erro",       icon: AlertCircle,    color: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",               href: "/pp/automacoes" },
  { key: "whatsapp_sent",          label: "WhatsApps enviados",     icon: MessageCircle,  color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400", href: "/pp/whatsapp-logs" },
  { key: "whatsapp_failed",        label: "WhatsApps com erro",     icon: XCircle,        color: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",           href: "/pp/whatsapp-logs" },
];

export default function PPDashboardPage() {
  const [data, setData]       = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: result } = await supabase.rpc("admin_dashboard_overview");
      setData(result as Overview ?? null);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Visão geral da Parceria Premiada</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CARDS.map(({ key, label, icon: Icon, color, href }) => (
            <Link key={key} href={href}
              className="card p-5 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {data ? (data as unknown as Record<string, number>)[key] ?? 0 : "—"}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{label}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
