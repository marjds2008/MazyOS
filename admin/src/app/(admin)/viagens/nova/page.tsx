import ViagemForm from "@/components/ViagemForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NovaViagemPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/viagens" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nova viagem</h1>
        <p className="text-gray-500 text-sm mt-1">Preencha os dados para criar uma nova excursão</p>
      </div>
      <ViagemForm />
    </div>
  );
}
