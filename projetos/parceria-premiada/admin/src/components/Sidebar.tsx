"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAdminUser, type AdminRole } from "@/contexts/AdminUserContext";
import {
  BarChart2, Target, UserCheck, Store, Zap, MessageCircle, Cog,
  LogOut, Menu, X, Sun, Moon, ChevronsRight, Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";

type NavItem = { href: string; label: string; icon: React.ElementType; roles: AdminRole[]; };

const NAV: NavItem[] = [
  { href: "/dashboard",     label: "Dashboard",     icon: BarChart2,     roles: ["admin", "operador"] },
  { href: "/campanhas",     label: "Campanhas",     icon: Target,        roles: ["admin", "parceiro"] },
  { href: "/participantes", label: "Participantes", icon: UserCheck,     roles: ["admin", "operador"] },
  { href: "/parceiros",     label: "Parceiros",     icon: Store,         roles: ["admin", "parceiro"] },
  { href: "/automacoes",    label: "Automações",    icon: Zap,           roles: ["admin", "operador"] },
  { href: "/whatsapp-logs", label: "WhatsApp Logs", icon: MessageCircle, roles: ["admin", "operador"] },
  { href: "/configuracoes", label: "Configurações", icon: Cog,           roles: ["admin"] },
];

const ROLE_LABEL: Record<AdminRole, string> = { admin: "Administrador", operador: "Operador", parceiro: "Parceiro" };
const ROLE_COLORS: Record<AdminRole, string> = {
  admin:    "bg-violet-500/20 text-violet-300",
  operador: "bg-blue-500/20 text-blue-300",
  parceiro: "bg-amber-500/20 text-amber-300",
};

interface NavLinkProps { href: string; label: string; icon: React.ElementType; active: boolean; collapsed: boolean; onClick?: () => void; }

function NavLink({ href, label, icon: Icon, active, collapsed, onClick }: NavLinkProps) {
  return (
    <Link href={href} onClick={onClick} title={collapsed ? label : undefined}
      className={`relative flex h-10 w-full items-center rounded-lg transition-all duration-200 group ${
        active
          ? "bg-brand-primary/15 text-brand-primary border-l-2 border-brand-primary"
          : "text-gray-400 hover:bg-white/10 hover:text-white border-l-2 border-transparent"
      }`}
    >
      <div className="grid h-full w-11 place-content-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      {!collapsed && <span className="text-sm font-medium truncate pr-3">{label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
          {label}
        </div>
      )}
    </Link>
  );
}

function SidebarDesktop() {
  const pathname = usePathname();
  const router   = useRouter();
  const { adminUser } = useAdminUser();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark]           = useState(false);

  useEffect(() => {
    const saved  = localStorage.getItem("theme");
    const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function logout() {
    const supabase = createClient();
    await supabase.rpc("log_admin_action", { p_action: "logout", p_resource: "auth" });
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const role = adminUser?.role ?? "operador";
  const items = NAV.filter(i => i.roles.includes(role));

  return (
    <aside className={`hidden md:flex flex-col shrink-0 h-full overflow-y-auto bg-gray-900 border-r border-white/10 transition-all duration-300 ease-in-out ${collapsed ? "w-[60px]" : "w-56"}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 border-b border-white/10 transition-all duration-300 ${collapsed ? "px-[10px] py-5 justify-center" : "px-4 py-5"}`}>
        <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center shrink-0">
          <Trophy className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-white font-semibold text-sm leading-tight whitespace-nowrap">Parceria Premiada</div>
            <div className="text-gray-400 text-xs">Admin</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {items.map(item => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} collapsed={collapsed} />
        ))}
      </nav>

      {/* Usuário */}
      {adminUser && !collapsed && (
        <div className="px-3 py-2 border-t border-white/10">
          <div className="flex items-center gap-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0">
              <span className="text-brand-primary text-xs font-semibold">{adminUser.nome.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">{adminUser.nome}</p>
              <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${ROLE_COLORS[adminUser.role]}`}>
                {ROLE_LABEL[adminUser.role]}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-2 py-2 border-t border-white/10 space-y-0.5">
        <button onClick={toggleTheme} title={collapsed ? (dark ? "Tema claro" : "Tema escuro") : undefined}
          className="relative flex h-10 w-full items-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors group">
          <div className="grid h-full w-11 place-content-center shrink-0">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </div>
          {!collapsed && <span className="text-sm font-medium">{dark ? "Tema claro" : "Tema escuro"}</span>}
        </button>
        <button onClick={logout} title={collapsed ? "Sair" : undefined}
          className="relative flex h-10 w-full items-center rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group">
          <div className="grid h-full w-11 place-content-center shrink-0">
            <LogOut className="w-4 h-4" />
          </div>
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>

      <button onClick={() => setCollapsed(c => !c)} className="flex items-center border-t border-white/10 hover:bg-white/5 transition-colors">
        <div className="grid h-11 w-11 place-content-center shrink-0">
          <ChevronsRight className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`} />
        </div>
        {!collapsed && <span className="text-xs text-gray-500 font-medium">Recolher</span>}
      </button>
    </aside>
  );
}

function SidebarMobile() {
  const pathname = usePathname();
  const router   = useRouter();
  const { adminUser } = useAdminUser();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved  = localStorage.getItem("theme");
    const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function logout() {
    const supabase = createClient();
    await supabase.rpc("log_admin_action", { p_action: "logout", p_resource: "auth" });
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const role = adminUser?.role ?? "operador";
  const items = NAV.filter(i => i.roles.includes(role));

  return (
    <>
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-gray-900 flex items-center justify-between px-4 h-14 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-brand-primary" />
          <span className="text-white font-semibold text-sm">Parceria Premiada</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-white">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => setOpen(o => !o)} className="p-2 text-gray-300 hover:text-white">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="w-56 bg-gray-900 flex flex-col pt-14">
            <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
              {items.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-2 ${
                    isActive(item.href)
                      ? "bg-brand-primary/15 text-brand-primary border-brand-primary"
                      : "text-gray-300 hover:bg-white/10 hover:text-white border-transparent"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </nav>
            {adminUser && (
              <div className="px-4 py-2 border-t border-white/10">
                <p className="text-white text-xs font-medium">{adminUser.nome}</p>
                <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-0.5 ${ROLE_COLORS[adminUser.role]}`}>
                  {ROLE_LABEL[adminUser.role]}
                </span>
              </div>
            )}
            <div className="px-2 py-4 border-t border-white/10">
              <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-colors">
                <LogOut className="w-4 h-4 shrink-0" /> Sair
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

export default function Sidebar() {
  return (
    <>
      <SidebarDesktop />
      <SidebarMobile />
    </>
  );
}
