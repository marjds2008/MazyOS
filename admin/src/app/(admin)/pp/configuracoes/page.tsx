"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const CONFIG = {
  dominio_campanha:  "https://parceriapremiada.app.br",
  instagram_oficial: "@parceriapremiadarj",
  whatsapp_oficial:  "+5521970563795",
  supabase_url:      "https://supabase.mundodosbots.app.br",
  n8n_url:           "https://n8n.mundodosbots.app.br",
  evolution_url:     "https://api.mundodosbots.app.br",
};

type StatusVal = "ok" | "error" | "loading";

function StatusDot({ status }: { status: StatusVal }) {
  if (status === "loading") return <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />;
  if (status === "ok")      return <CheckCircle className="w-4 h-4 text-green-500" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
}

export default function PPConfiguracoesPage() {
  const [supabaseStatus, setSupabaseStatus] = useState<StatusVal>("loading");
  const [n8nStatus, setN8nStatus]           = useState<StatusVal>("loading");
  const [evolutionStatus, setEvolutionStatus] = useState<StatusVal>("loading");

  useEffect(() => {
    // Verificar Supabase: tentar buscar campanhas
    createClient()
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .then(({ error }) => setSupabaseStatus(error ? "error" : "ok"));

    // Verificar n8n: fetch do health endpoint (pode falhar por CORS)
    fetch("https://n8n.mundodosbots.app.br/healthz")
      .then(r => setN8nStatus(r.ok ? "ok" : "error"))
      .catch(() => setN8nStatus("error"));

    // Verificar Evolution API: fetch do manager (pode falhar por CORS)
    fetch("https://api.mundodosbots.app.br/")
      .then(r => setEvolutionStatus(r.status < 500 ? "ok" : "error"))
      .catch(() => setEvolutionStatus("error"));
  }, []);

  const sections: { title: string; items: { label: string; value: string }[] }[] = [
    {
      title: "Domínios e Canais",
      items: [
        { label: "Landing (site estático)", value: CONFIG.dominio_campanha },
        { label: "Instagram oficial",        value: CONFIG.instagram_oficial },
        { label: "WhatsApp oficial",         value: CONFIG.whatsapp_oficial },
      ],
    },
    {
      title: "Infraestrutura",
      items: [
        { label: "Supabase URL",   value: CONFIG.supabase_url },
        { label: "n8n URL",        value: CONFIG.n8n_url },
        { label: "Evolution API",  value: CONFIG.evolution_url },
      ],
    },
  ];

  const serviceStatus: { label: string; status: StatusVal; note: string }[] = [
    { label: "Supabase",     status: supabaseStatus, note: "Banco de dados + RPCs" },
    { label: "n8n",          status: n8nStatus,      note: "Automação de WhatsApp" },
    { label: "Evolution API", status: evolutionStatus, note: "Envio de mensagens" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Constantes e status dos serviços da Parceria Premiada</p>
      </div>

      {/* Status dos serviços */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Status dos Serviços</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {serviceStatus.map(({ label, status, note }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
              <StatusDot status={status} />
              <div>
                <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{label}</p>
                <p className="text-xs text-gray-400">{note}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">* Status verificado a cada carregamento da página. Erros de rede podem indicar bloqueio por CORS.</p>
      </div>

      {/* Constantes */}
      {sections.map(({ title, items }) => (
        <div key={title} className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {items.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card p-4 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>TODO SECURITY:</strong> Esta tela exibe dados de configuração sensíveis.
          Proteger o BackOffice com autenticação e RBAC antes de qualquer deploy público.
        </p>
      </div>
    </div>
  );
}
