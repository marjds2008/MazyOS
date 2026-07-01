import Link from "next/link";
import { Clock } from "lucide-react";

export default function PagamentoPendente() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Pagamento em análise</h1>
        <p className="text-gray-600 mb-2">
          Seu pagamento está sendo processado.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Quando for confirmado, a Lisa vai entrar em contato pelo WhatsApp com os detalhes da sua reserva.
        </p>
        <Link href="/" className="inline-block bg-brand-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
