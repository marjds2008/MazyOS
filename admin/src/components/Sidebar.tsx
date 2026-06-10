"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, MapPin, Users, Star, Image, BookOpen, LogOut, Menu, X,
  UserRound, Megaphone, TrendingUp,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { href: "/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
  { href: "/viagens",     label: "Viagens",       icon: MapPin },
  { href: "/clientes",    label: "Clientes",      icon: UserRound },
  { href: "/funil",       label: "Funil",         icon: TrendingUp },
  { href: "/campanhas",   label: "Campanhas",     icon: Megaphone },
  { href: "/leads",       label: "Leads",         icon: Users },
  { href: "/lista-vip",   label: "Lista VIP",     icon: Star },
  { href: "/depoimentos", label: "Depoimentos",   icon: BookOpen },
  { href: "/galeria",     label: "Galeria",       icon: Image },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const NavLinks = () => (
    <>
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-brand-primary text-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-gray-900 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold" style={{ fontFamily: "Georgia, serif" }}>AV</span>
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">Amo Viajar</div>
            <div className="text-gray-400 text-xs">Admin</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLinks />
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 w-full transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Topbar mobile ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-gray-900 flex items-center justify-between px-4 h-14 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold" style={{ fontFamily: "Georgia, serif" }}>AV</span>
          </div>
          <span className="text-white font-semibold text-sm">Amo Viajar Admin</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-gray-300 hover:text-white">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Drawer mobile ── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="w-56 bg-gray-900 flex flex-col pt-14">
            <nav className="flex-1 px-3 py-4 space-y-1">
              <NavLinks />
            </nav>
            <div className="px-3 py-4 border-t border-white/10">
              <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white w-full">
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
