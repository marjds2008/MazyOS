import type { Metadata } from "next";
import Header from "@/components/Header";
import ClubeSection from "@/components/ClubeSection";
import CTAFinal from "@/components/CTAFinal";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Família Amo Viajar — Entre para o Clube",
  description: "Faça parte da Família Amo Viajar. Vagas com prioridade, novidades em primeira mão, grupo VIP no WhatsApp e muito mais. 100% gratuito.",
};

export default function ClubePage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <div className="bg-brand-warm py-14 text-center px-5">
          <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-3">Comunidade</p>
          <h1 className="font-serif text-4xl md:text-5xl text-brand-text font-bold mb-4">
            Família Amo Viajar
          </h1>
          <p className="text-brand-muted max-w-xl mx-auto text-base">
            Entre para uma comunidade de pessoas apaixonadas por viajar. Acesso antecipado a vagas, descontos exclusivos e muito carinho da Lisa.
          </p>
        </div>
        <ClubeSection />
        <CTAFinal />
      </main>
      <Footer />
    </>
  );
}
