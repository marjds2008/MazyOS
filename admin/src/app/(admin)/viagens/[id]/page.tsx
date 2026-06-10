import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ViagemForm from "@/components/ViagemForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function EditarViagemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: viagem } = await supabase.from("viagens").select("*").eq("id", id).single();
  if (!viagem) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/viagens" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{viagem.titulo}</h1>
        <p className="text-gray-500 text-sm mt-1">{viagem.destino}{viagem.estado ? `, ${viagem.estado}` : ""}</p>
      </div>
      <ViagemForm viagem={viagem} />
    </div>
  );
}
