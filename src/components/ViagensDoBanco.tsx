"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import ViagensDoBancoCards from "@/components/ViagensDoBancoCards";

export default function ViagensDoBanco() {
  const [viagens, setViagens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from("viagens")
          .select("*")
          .in("status", ["aberta", "ultimas_vagas", "esgotada"])
          .order("data_saida", { ascending: true })
          .limit(9);

        if (error) {
          console.error("[ViagensDoBanco] erro na query:", error.message);
        } else {
          setViagens(data ?? []);
        }
      } catch (err) {
        console.error("[ViagensDoBanco] erro:", err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  if (loading) {
    return (
      <section id="proximas-viagens" className="py-20 md:py-28 bg-[#FFF8F0]">
        <div className="max-w-6xl mx-auto px-5 text-center">
          <p className="text-brand-muted text-sm">Carregando próximas viagens...</p>
        </div>
      </section>
    );
  }

  if (!viagens.length) return null;

  return (
    <section id="proximas-viagens" className="py-20 md:py-28 bg-[#FFF8F0]">
      <div className="max-w-6xl mx-auto px-5">

        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-3">
            Reserve a sua vaga
          </p>
          <h2 className="section-title mb-4">Próximas Viagens</h2>
          <p className="section-subtitle">
            Vagas limitadas por lote — quanto antes você reservar, melhor o preço.
          </p>
        </div>

        <ViagensDoBancoCards viagens={viagens} />

        <div className="text-center mt-12">
          <Link
            href="/viagens"
            className="inline-flex items-center gap-2 border-2 border-brand-primary text-brand-primary font-semibold px-8 py-3.5 rounded-full hover:bg-brand-primary hover:text-white transition-colors text-sm"
          >
            Ver todas as viagens →
          </Link>
        </div>

      </div>
    </section>
  );
}
