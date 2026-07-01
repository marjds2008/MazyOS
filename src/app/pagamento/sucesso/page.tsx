import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function PagamentoSucesso() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Pagamento confirmado!</h1>
        <p className="text-gray-600 mb-2">
          Obrigado pela sua reserva. Sua vaga está garantida!
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Em breve a Lisa vai entrar em contato pelo WhatsApp com todas as informações da viagem.
        </p>
        <Link href="/" className="inline-block bg-brand-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
