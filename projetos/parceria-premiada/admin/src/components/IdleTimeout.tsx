"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const IDLE_MS  = 30 * 60 * 1000;
const WARN_SEC = 5 * 60;

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function IdleTimeout() {
  const router = useRouter();
  const [warning, setWarning]     = useState(false);
  const [remaining, setRemaining] = useState(WARN_SEC);

  useEffect(() => {
    let idle: ReturnType<typeof setTimeout>;
    function reset() {
      if (warning) return;
      clearTimeout(idle);
      idle = setTimeout(() => setWarning(true), IDLE_MS);
    }
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(idle); events.forEach(e => window.removeEventListener(e, reset)); };
  }, [warning]);

  useEffect(() => {
    if (!warning) { setRemaining(WARN_SEC); return; }
    const t = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(t);
          createClient().auth.signOut().then(() => router.push("/login?expired=true"));
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [warning, router]);

  if (!warning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sessão expirando</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Por inatividade, você será desconectado em</p>
        <div className="text-5xl font-mono font-bold text-amber-500 mb-8 tabular-nums">{fmt(remaining)}</div>
        <div className="flex gap-3">
          <button
            onClick={async () => { await createClient().auth.signOut(); router.push("/login"); }}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Sair agora
          </button>
          <button
            onClick={() => { setWarning(false); setRemaining(WARN_SEC); }}
            className="flex-1 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
