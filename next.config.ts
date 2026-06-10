import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",      // gera pasta out/ para hospedagem estática
  trailingSlash: true,   // compatibilidade com Hostinger/cPanel
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,   // obrigatório em modo estático (sem servidor Next.js)
  },
};

export default nextConfig;
