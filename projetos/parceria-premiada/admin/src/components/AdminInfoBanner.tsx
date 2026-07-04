"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Shield } from "lucide-react";
import { useAdminUser, type AdminRole } from "@/contexts/AdminUserContext";

const ROLE_LABEL: Record<AdminRole, string> = {
  admin:    "Administrador",
  operador: "Operador",
  parceiro: "Parceiro",
};
const ROLE_COLOR: Record<AdminRole, string> = {
  admin:    "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  operador: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  parceiro: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

interface Props { ip: string | null; }

export function AdminInfoBanner({ ip }: Props) {
  const { adminUser, loading } = useAdminUser();
  const [collapsed, setCollapsed]  = useState(false);
  const [sessionStart]             = useState(() => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));

  useEffect(() => {
    const saved = localStorage.getItem("pp-admin-banner-collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("pp-admin-banner-collapsed", next ? "1" : "0");
  }

  if (loading || !adminUser) return null;

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 text-xs">
      <button onClick={toggle} className="w-full flex items-center justify-between px-5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-colors group">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Shield className="w-3 h-3 text-amber-500" />
          <span className="font-medium">Parceria Premiada — Admin</span>
          <span className="mx-1">·</span>
          <span>{adminUser.nome}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${ROLE_COLOR[adminUser.role]}`}>
            {ROLE_LABEL[adminUser.role]}
          </span>
        </div>
        {collapsed
          ? <ChevronDown className="w-3 h-3 text-gray-400" />
          : <ChevronUp   className="w-3 h-3 text-gray-400" />
        }
      </button>

      {!collapsed && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-2 text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800/60">
          <span><strong className="text-gray-600 dark:text-gray-400">E-mail:</strong> {adminUser.email}</span>
          <span><strong className="text-gray-600 dark:text-gray-400">Sessão:</strong> desde {sessionStart}</span>
          {ip && <span><strong className="text-gray-600 dark:text-gray-400">IP:</strong> {ip}</span>}
        </div>
      )}
    </div>
  );
}
