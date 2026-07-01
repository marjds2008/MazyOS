"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ViagemForm from "@/components/ViagemForm";
import ParticipantesViagem from "@/components/ParticipantesViagem";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function EditarViagemPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id") ?? "";

  const [viagem, setViagem] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { router.replace("/viagens"); return; }
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await (supabase as any).from("viagens").select("*").eq("id", id).single();
      if (!data) { router.replace("/viagens"); return; }
      setViagem(data);
      setLoading(false);
    }
    load();
  }, [id, router]);

  if (loading || !viagem) {
    return <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/viagens" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{viagem.titulo as string}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {viagem.destino as string}{viagem.estado ? `, ${viagem.estado as string}` : ""}
        </p>
      </div>
      <ViagemForm viagem={viagem as any} />
      <ParticipantesViagem
        viagemId={id}
        viagemDataSaida={(viagem.data_saida as string | undefined) ?? undefined}
      />
    </div>
  );
}
