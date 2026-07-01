"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import ViagemFiltros from "@/components/ViagemFiltros";

export default function ViagensClientPage() {
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
          .order("data_saida", { ascending: true });

        if (error) {
          console.error("[ViagensClientPage] erro:", error.message);
        } else {
          setViagens(data ?? []);
        }
      } catch (err) {
        console.error("[ViagensClientPage] erro:", err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16 text-brand-muted">
        <p className="text-brand-muted text-sm">Carregando viagens...</p>
      </div>
    );
  }

  if (!viagens.length) {
    return (
      <div className="text-center py-16 text-brand-muted">
        <p className="text-5xl mb-4">🚌</p>
        <p className="font-semibold text-brand-text text-lg mb-2">Nenhuma viagem disponível no momento</p>
        <p className="text-sm mb-6">Novas viagens são anunciadas com frequência. Entre para a Família e receba em primeira mão!</p>
        <a
          href="/clube"
          className="inline-block bg-brand-primary text-white font-semibold px-8 py-3.5 rounded-full hover:bg-brand-dark transition-colors"
        >
          Entrar para a Família Amo Viajar
        </a>
      </div>
    );
  }

  return <ViagemFiltros viagens={viagens} />;
}
