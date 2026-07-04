// Página pública de transparência do Draw Engine
// Rota: admin.parceriapremiada.app.br/transparencia
// Não requer autenticação

import { Shield, Hash, CheckCircle2, Lock, BarChart2, Search } from "lucide-react";
import { TransparencyService, ALGORITHM_VERSION, DRAW_ENGINE_VERSION, DOMAIN } from "@/lib/draw-engine";
import { VerifyWidget } from "./VerifyWidget";

export const metadata = {
  title: "Transparência do Sorteio — Parceria Premiada",
  description: "Como geramos os números da sorte. Algoritmo determinístico, criptograficamente seguro, auditável por qualquer pessoa.",
};

export default function TransparenciaPage() {
  const info = TransparencyService.describe();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-gray-900/80 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Parceria Premiada</div>
            <div className="text-xs text-gray-400">Transparência do sorteio</div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            Auditável e verificável publicamente
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Como geramos os números da sorte
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Nenhuma aleatoriedade manual, nenhum Math.random(). Cada número da sorte é gerado por
            um algoritmo criptográfico determinístico que qualquer pessoa pode verificar.
          </p>
        </div>

        {/* Algorithm specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-900 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{(DOMAIN / 1000).toFixed(0)}k</div>
            <div className="text-xs text-gray-400 mt-1">números possíveis</div>
          </div>
          <div className="bg-gray-900 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">0</div>
            <div className="text-xs text-gray-400 mt-1">colisões possíveis</div>
          </div>
          <div className="bg-gray-900 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">&lt;1ms</div>
            <div className="text-xs text-gray-400 mt-1">por número</div>
          </div>
          <div className="bg-gray-900 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-sm font-bold text-purple-400">v{ALGORITHM_VERSION}</div>
            <div className="text-xs text-gray-400 mt-1">algoritmo</div>
          </div>
        </div>

        {/* How it works */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Como funciona</h2>
          </div>
          <div className="space-y-3">
            {info.howItWorks.map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">
                  {i + 1}
                </span>
                <p className="text-gray-300 text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Algorithm detail */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-bold text-white">Algoritmo técnico</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              <strong className="text-white">Rede Feistel não-balanceada</strong> com 8 rodadas sobre o
              espaço 2<sup>17</sup> = 131.072, reduzida para o domínio [0, 99.999] via
              <em> cycle-walking</em>.
            </p>
            <p>
              A função de rodada usa <strong className="text-white">HMAC-SHA256</strong> com a seed da campanha
              como chave. A rede Feistel é uma <strong className="text-white">bijeção</strong> — cada número
              de sequência mapeia para exatamente um número da sorte, sem repetição, em toda a campanha.
            </p>
            <p>
              Além do número, geramos um <strong className="text-white">hash SHA256(seed:sequência:número)</strong>{" "}
              que fica registrado como prova criptográfica. Qualquer auditor pode verificar que o número
              não foi alterado após a emissão.
            </p>
          </div>
          <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs text-green-400 space-y-1">
            <div className="text-gray-500"># Fórmula simplificada</div>
            <div>seed  = hex(randomBytes(32))  <span className="text-gray-500"># gerado 1x por campanha</span></div>
            <div>key   = SHA256("draw-engine:v1:" + seed)</div>
            <div>x     = feistel_8rounds(key, sequence - 1)</div>
            <div>while x &gt;= 100000: x = feistel(key, x)</div>
            <div>numero = x.zfill(5)  <span className="text-gray-500"># 00000 – 99999</span></div>
            <div>hash   = SHA256(seed + ":" + sequence + ":" + x)</div>
          </div>
        </div>

        {/* No collisions */}
        <div className="bg-green-500/5 border border-green-500/15 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">Por que não existem colisões</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{info.whyNoCollisions}</p>
            </div>
          </div>
        </div>

        {/* Verify widget */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Verificar seu número</h2>
          </div>
          <p className="text-sm text-gray-400">{info.howToVerify}</p>
          <VerifyWidget />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Versão do sistema</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-900 border border-white/10 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Draw Engine</p>
            <p className="text-white font-mono font-semibold">v{DRAW_ENGINE_VERSION}</p>
          </div>
          <div className="bg-gray-900 border border-white/10 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Algoritmo</p>
            <p className="text-white font-mono font-semibold">{info.algorithm}</p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="border-t border-white/10 mt-12">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-gray-500">
            Parceria Premiada · Transparência garantida pelo Draw Engine v{DRAW_ENGINE_VERSION}
          </p>
        </div>
      </div>
    </div>
  );
}
