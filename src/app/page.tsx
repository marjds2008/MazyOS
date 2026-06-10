import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SobreLisa from "@/components/SobreLisa";
import CredenciaisLisa from "@/components/CredenciaisLisa";
import VideoLisa from "@/components/VideoLisa";
import Diferenciais from "@/components/Diferenciais";
import Depoimentos from "@/components/Depoimentos";
import ProximasViagens from "@/components/ProximasViagens";
import Galeria from "@/components/Galeria";
import NossaHistoria from "@/components/NossaHistoria";
import ClubeSection from "@/components/ClubeSection";
import Historias from "@/components/Historias";
import CTAFinal from "@/components/CTAFinal";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* 1 — Hero: pessoas em viagem */}
        <HeroSection />

        {/* 2 — Quem é a Lisa + CTA WhatsApp */}
        <SobreLisa />

        {/* 3 — Credenciais e experiência da Lisa */}
        <CredenciaisLisa />

        {/* 4 — Vídeo institucional (placeholder) */}
        <VideoLisa />

        {/* 4 — Por que nos escolhem */}
        <Diferenciais />

        {/* 5 — Depoimentos com estrelas */}
        <Depoimentos />

        {/* 6 — Destinos reais com filtro por categoria */}
        <ProximasViagens />

        {/* 7 — Nossas Memórias: galeria 70% pessoas */}
        <Galeria />

        {/* 8 — Números que contam nossa história */}
        <NossaHistoria />

        {/* 9 — Família Amo Viajar: cadastro na comunidade */}
        <ClubeSection />

        {/* 10 — Mural da Comunidade: histórias reais */}
        <Historias />

        {/* 11 — CTA Final */}
        <CTAFinal />
      </main>
      <Footer />
    </>
  );
}
