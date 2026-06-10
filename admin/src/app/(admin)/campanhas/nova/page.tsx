import CampanhaForm from "@/components/CampanhaForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NovaCampanhaPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/campanhas" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nova campanha WhatsApp</h1>
        <p className="text-gray-500 text-sm mt-1">Configure a mensagem, o segmento e envie via n8n</p>
      </div>
      <CampanhaForm />
    </div>
  );
}
