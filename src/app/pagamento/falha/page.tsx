import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PagamentoFalha() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Não foi dessa vez</h1>
        <p className="text-gray-600 mb-2">O pagamento não foi concluído.</p>
        <p className="text-gray-500 text-sm mb-8">
          Tente novamente ou fale com a Lisa pelo WhatsApp para outras formas de pagamento.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/#proximas-viagens" className="inline-block bg-brand-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors">
            Tentar novamente
          </Link>
          <a href="https://wa.me/5521999999999" target="_blank" rel="noopener noreferrer"
            className="inline-block bg-white border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">
            Falar com a Lisa
          </a>
        </div>
      </div>
    </div>
  );
}
