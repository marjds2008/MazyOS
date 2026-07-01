import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export const metadata: Metadata = {
  title: "Amo Viajar — Viaje com quem cuida de você",
  description:
    "Excursões e viagens em grupo para quem busca mais do que um destino: busca companhia, segurança e memórias inesquecíveis. Conheça a Família Amo Viajar.",
  keywords: "excursões, viagens em grupo, turismo 50+, viagens para idosos, excursões com segurança, Amo Viajar, Lisa",
  openGraph: {
    title: "Amo Viajar — Viajar é bom. Viajar acompanhado é melhor.",
    description:
      "Cada viagem começa com um destino. Termina com amizade. Faça parte da Família Amo Viajar.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1526440209138815&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {children}
        <WhatsAppFloat />
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','1526440209138815');
          fbq('track','PageView');
        `}</Script>
      </body>
    </html>
  );
}
