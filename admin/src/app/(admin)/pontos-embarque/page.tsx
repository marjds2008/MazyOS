import { Bus } from "lucide-react";
import PontosEmbarqueManager from "@/components/PontosEmbarqueManager";

export const metadata = { title: "Pontos de embarque | Amo Viajar Admin" };

export default function PontosEmbarquePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
          <Bus className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Pontos de embarque</h1>
          <p className="text-sm text-gray-500">Cadastre os pontos e selecione nas viagens</p>
        </div>
      </div>

      <PontosEmbarqueManager />
    </div>
  );
}
