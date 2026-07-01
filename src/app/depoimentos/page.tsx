import type { Metadata } from "next";
import Header from "@/components/Header";
import Depoimentos from "@/components/Depoimentos";
import CTAFinal from "@/components/CTAFinal";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Depoimentos de Passageiros | Amo Viajar",
  description: "Veja o que os passageiros dizem sobre as viagens com a Amo Viajar. Mensagens reais de quem já viajou com a Lisa.",
};

export default function DepoimentosPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <div className="bg-brand-light py-14 text-center">
          <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-3">Prova social</p>
          <h1 className="font-serif text-4xl md:text-5xl text-brand-text font-bold mb-4">
            Quem já viajou, conta
          </h1>
          <p className="text-brand-muted max-w-xl mx-auto text-base">
            Mensagens reais recebidas de passageiros que viveram experiências com a Amo Viajar.
          </p>
        </div>
        <Depoimentos />
        <CTAFinal />
      </main>
      <Footer />
    </>
  );
}
