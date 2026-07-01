import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amo Viajar — Admin",
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Evita flash de tema errado antes do JS carregar */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('theme');
            if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            }
          } catch(e) {}
        `}} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
