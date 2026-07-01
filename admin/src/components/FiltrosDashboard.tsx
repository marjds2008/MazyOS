"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

const PERIODOS = [
  { value: "tudo", label: "Tudo" },
  { value: "mes",  label: "Este mês" },
  { value: "30d",  label: "30 dias" },
  { value: "3m",   label: "3 meses" },
  { value: "ano",  label: "Este ano" },
];

const STATUS_LEAD = [
  { value: "todos",      label: "Todos" },
  { value: "novo",       label: "Novos" },
  { value: "contatado",  label: "Contatados" },
  { value: "negociando", label: "Negociando" },
  { value: "reservado",  label: "Reservados" },
  { value: "pago",       label: "Pagos" },
  { value: "viajou",     label: "Viajaram" },
];

export default function FiltrosDashboard() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();

  const periodo    = searchParams.get("periodo")    ?? "tudo";
  const statusLead = searchParams.get("status_lead") ?? "todos";

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-14 shrink-0">Período</span>
        <div className="flex gap-2 flex-wrap">
          {PERIODOS.map(p => (
            <button key={p.value} onClick={() => setParam("periodo", p.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                periodo === p.value
                  ? "bg-brand-primary text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-14 shrink-0">Leads</span>
        <div className="flex gap-2 flex-wrap">
          {STATUS_LEAD.map(s => (
            <button key={s.value} onClick={() => setParam("status_lead", s.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                statusLead === s.value
                  ? "bg-brand-primary text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
