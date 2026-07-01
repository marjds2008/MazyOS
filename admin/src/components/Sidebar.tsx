"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, MapPin, Users, Star, ImageIcon, BookOpen, LogOut,
  Menu, X, UserRound, Megaphone, TrendingUp, ChevronsRight, Sun, Moon, Bus,
  Trophy, BarChart2, Target, UserCheck, Store, Zap, MessageCircle, Cog,
} from "lucide-react";
import { useEffect, useState } from "react";

// ── Navegação ────────────────────────────────────────────────

const NAV_PRINCIPAL = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/viagens",     label: "Viagens",     icon: MapPin },
  { href: "/clientes",    label: "Clientes",    icon: UserRound },
  { href: "/funil",       label: "Funil",       icon: TrendingUp },
  { href: "/campanhas",   label: "Campanhas",   icon: Megaphone },
  { href: "/leads",       label: "Leads",       icon: Users },
];

const NAV_CONTEUDO = [
  { href: "/lista-vip",       label: "Lista VIP",   icon: Star },
  { href: "/depoimentos",     label: "Depoimentos", icon: BookOpen },
  { href: "/galeria",         label: "Galeria",     icon: ImageIcon },
];

const NAV_CONFIG = [
  { href: "/pontos-embarque", label: "Embarque",    icon: Bus },
];

const NAV_PP = [
  { href: "/pp/dashboard",     label: "Dashboard PP",   icon: BarChart2 },
  { href: "/pp/campanhas",     label: "Campanhas",      icon: Target },
  { href: "/pp/participantes", label: "Participantes",  icon: UserCheck },
  { href: "/pp/parceiros",     label: "Parceiros",      icon: Store },
  { href: "/pp/automacoes",    label: "Automações",     icon: Zap },
  { href: "/pp/whatsapp-logs", label: "WhatsApp Logs",  icon: MessageCircle },
  { href: "/pp/configuracoes", label: "Configurações",  icon: Cog },
];

// ── Item de nav ──────────────────────────────────────────────

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}

function NavItem({ href, label, icon: Icon, active, collapsed, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`relative flex h-10 w-full items-center rounded-lg transition-all duration-200 group ${
        active
          ? "bg-brand-primary/15 text-brand-primary border-l-2 border-brand-primary"
          : "text-gray-400 hover:bg-white/10 hover:text-white border-l-2 border-transparent"
      }`}
    >
      <div className="grid h-full w-11 place-content-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      {!collapsed && (
        <span className="text-sm font-medium truncate pr-3">{label}</span>
      )}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
          {label}
        </div>
      )}
    </Link>
  );
}

// ── Sidebar desktop ──────────────────────────────────────────

function SidebarDesktop() {
  const pathname = usePathname();
  const router   = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark]           = useState(false);

  useEffect(() => {
    const saved   = localStorage.getItem("theme");
    const isDark  = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 h-full overflow-y-auto bg-gray-900 border-r border-white/10 transition-all duration-300 ease-in-out ${
        collapsed ? "w-[60px]" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 border-b border-white/10 transition-all duration-300 ${
        collapsed ? "px-[10px] py-5 justify-center" : "px-4 py-5"
      }`}>
        <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold" style={{ fontFamily: "Georgia, serif" }}>AV</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-white font-semibold text-sm leading-tight whitespace-nowrap">Amo Viajar</div>
            <div className="text-gray-400 text-xs">Admin</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_PRINCIPAL.map(item => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} collapsed={collapsed} />
        ))}

        <div className={`my-3 border-t border-white/10 ${collapsed ? "mx-2" : "mx-1"}`} />

        {!collapsed && (
          <p className="px-3 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Conteúdo</p>
        )}

        {NAV_CONTEUDO.map(item => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} collapsed={collapsed} />
        ))}

        <div className={`my-3 border-t border-white/10 ${collapsed ? "mx-2" : "mx-1"}`} />

        {!collapsed && (
          <p className="px-3 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Config</p>
        )}

        {NAV_CONFIG.map(item => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} collapsed={collapsed} />
        ))}

        <div className={`my-3 border-t border-white/10 ${collapsed ? "mx-2" : "mx-1"}`} />

        {!collapsed && (
          <div className="px-3 pb-1 flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-amber-400" />
            <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Parceria Premiada</p>
          </div>
        )}
        {collapsed && <div className="flex justify-center py-1"><Trophy className="w-3 h-3 text-amber-400" /></div>}

        {NAV_PP.map(item => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer: Logout + Tema */}
      <div className="px-2 py-2 border-t border-white/10 space-y-0.5">
        {/* Tema claro / escuro */}
        <button
          onClick={toggleTheme}
          title={collapsed ? (dark ? "Tema claro" : "Tema escuro") : undefined}
          className="relative flex h-10 w-full items-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors group"
        >
          <div className="grid h-full w-11 place-content-center shrink-0">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </div>
          {!collapsed && (
            <span className="text-sm font-medium">{dark ? "Tema claro" : "Tema escuro"}</span>
          )}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              {dark ? "Tema claro" : "Tema escuro"}
            </div>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title={collapsed ? "Sair" : undefined}
          className="relative flex h-10 w-full items-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors group"
        >
          <div className="grid h-full w-11 place-content-center shrink-0">
            <LogOut className="w-4 h-4" />
          </div>
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              Sair
            </div>
          )}
        </button>
      </div>

      {/* Toggle colapsar */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center border-t border-white/10 hover:bg-white/5 transition-colors"
      >
        <div className="grid h-11 w-11 place-content-center shrink-0">
          <ChevronsRight
            className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`}
          />
        </div>
        {!collapsed && (
          <span className="text-xs text-gray-500 font-medium">Recolher</span>
        )}
      </button>
    </aside>
  );
}

// ── Mobile (topbar + drawer) ─────────────────────────────────

function SidebarMobile() {
  const pathname = usePathname();
  const router   = useRouter();
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Topbar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-gray-900 flex items-center justify-between px-4 h-14 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold" style={{ fontFamily: "Georgia, serif" }}>AV</span>
          </div>
          <span className="text-white font-semibold text-sm">Amo Viajar Admin</span>
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

      {/* Drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="w-56 bg-gray-900 flex flex-col pt-14">
            <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
              {[...NAV_PRINCIPAL, ...NAV_CONTEUDO, ...NAV_CONFIG, ...NAV_PP].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
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
            <div className="px-2 py-4 border-t border-white/10 space-y-1">
              <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 w-full transition-colors">
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

// ── Export ───────────────────────────────────────────────────

export default function Sidebar() {
  return (
    <>
      <SidebarDesktop />
      <SidebarMobile />
    </>
  );
}
