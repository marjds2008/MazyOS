"use client";

import { useState } from "react";
import { Cog, Users, Key, Bell } from "lucide-react";
import { useAdminUser } from "@/contexts/AdminUserContext";

export default function ConfiguracoesPage() {
  const { adminUser } = useAdminUser();
  const [activeTab, setActiveTab] = useState<"perfil" | "usuarios" | "webhook" | "notificacoes">("perfil");

  const TABS = [
    { id: "perfil",       label: "Meu Perfil",    icon: Cog },
    { id: "usuarios",     label: "Usuários",       icon: Users },
    { id: "webhook",      label: "Webhooks / API", icon: Key },
    { id: "notificacoes", label: "Notificações",   icon: Bell },
  ] as const;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Ajustes do sistema e da conta</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-lg w-fit flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "perfil" && (
        <div className="card p-6 space-y-4 max-w-lg">
          <h2 className="font-semibold text-gray-900 dark:text-white">Perfil do administrador</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Nome</label>
              <input className="input" defaultValue={adminUser?.nome ?? ""} disabled />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input" defaultValue={adminUser?.email ?? ""} disabled />
            </div>
            <div>
              <label className="label">Função</label>
              <input className="input" defaultValue={adminUser?.role ?? ""} disabled />
            </div>
          </div>
          <p className="text-xs text-gray-400">Para alterar seus dados, contate o administrador do sistema.</p>
        </div>
      )}

      {activeTab === "usuarios" && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Usuários admin</h2>
          <p className="text-sm text-gray-400">Gestão de usuários — em breve.</p>
        </div>
      )}

      {activeTab === "webhook" && (
        <div className="card p-6 space-y-4 max-w-lg">
          <h2 className="font-semibold text-gray-900 dark:text-white">Webhooks e API</h2>
          <div>
            <label className="label">URL do webhook n8n</label>
            <input className="input font-mono text-xs" defaultValue={process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ?? "Não configurado"} disabled />
          </div>
          <p className="text-xs text-gray-400">Configurado via variável de ambiente <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">NEXT_PUBLIC_N8N_WEBHOOK_URL</code>.</p>
        </div>
      )}

      {activeTab === "notificacoes" && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Notificações</h2>
          <p className="text-sm text-gray-400">Configurações de notificações — em breve.</p>
        </div>
      )}
    </div>
  );
}
