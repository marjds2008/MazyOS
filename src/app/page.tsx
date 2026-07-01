import Link from "next/link";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SobreLisa from "@/components/SobreLisa";
import CredenciaisLisa from "@/components/CredenciaisLisa";
import Depoimentos from "@/components/Depoimentos";
import ViagensDoBanco from "@/components/ViagensDoBanco";
import ClubeSection from "@/components/ClubeSection";
import CTAFinal from "@/components/CTAFinal";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* 1 — Hero */}
        <HeroSection />

        {/* 2 — Próximas viagens (prioridade) */}
        <ViagensDoBanco />

        {/* 3 — Quem é a Lisa */}
        <SobreLisa />
        <div className="bg-brand-warm pb-6 text-center">
          <Link
            href="/sobre"
            className="text-brand-primary font-semibold text-sm hover:underline"
          >
            Conheça a história completa da Lisa →
          </Link>
        </div>

        {/* 4 — Credenciais */}
        <CredenciaisLisa />
        <div className="bg-white pb-8 text-center">
          <Link
            href="/sobre"
            className="text-brand-primary font-semibold text-sm hover:underline"
          >
            Ver credenciais e história completa →
          </Link>
        </div>

        {/* 5 — Depoimentos (compacto) */}
        <Depoimentos compact />

        {/* 6 — Família Amo Viajar */}
        <ClubeSection />

        {/* 7 — CTA Final */}
        <CTAFinal />
      </main>
      <Footer />
    </>
  );
}
