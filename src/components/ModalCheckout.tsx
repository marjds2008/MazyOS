"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Minus, Plus, Users, CreditCard, Wallet, Loader2, Copy, Check, QrCode, Smartphone } from "lucide-react";

const EDGE_CHECKOUT =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/checkout`;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// ── PIX ──────────────────────────────────────────────────────

const PIX_KEY  = "54001832000151";
const PIX_NAME = "AMO VIAJAR";
const PIX_CITY = "RIO DE JANEIRO";

function f(id: string, v: string) {
  return `${id}${v.length.toString().padStart(2, "0")}${v}`;
}
function crc16(s: string) {
  let c = 0xffff;
  for (let i = 0; i < s.length; i++) {
    c ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) c = c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1;
    c &= 0xffff;
  }
  return c.toString(16).toUpperCase().padStart(4, "0");
}
function buildPix(amount: number, ref: string): string {
  const acc = f("00", "BR.GOV.BCB.PIX") + f("01", PIX_KEY);
  const add = f("05", ref.replace(/\W/g, "").slice(0, 25) || "RESERVA");
  let p = "";
  p += f("00", "01");
  p += f("01", "12");
  p += f("26", acc);
  p += f("52", "0000");
  p += f("53", "986");
  p += f("54", amount.toFixed(2));
  p += f("58", "BR");
  p += f("59", PIX_NAME);
  p += f("60", PIX_CITY);
  p += f("62", add);
  p += "6304";
  return p + crc16(p);
}
function fmtCNPJ(v: string) {
  return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

// ── Tipos ────────────────────────────────────────────────────

interface LoteViagem { numero: number; vagas: number; valor: number }

export interface ViagemCheckout {
  id: string;
  titulo: string;
  destino: string;
  data_saida?: string;
  valor?: number;
  valor_sinal?: number;
  vagas_disponiveis?: number;
  vagas_totais?: number;
  lotes_ativo?: boolean;
  lotes?: LoteViagem[];
}

interface Props {
  viagem: ViagemCheckout;
  loteAtual?: { lote: LoteViagem; vagasRestantesLote: number } | null;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}
function fmtData(d?: string) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// ── Componente ───────────────────────────────────────────────

export default function ModalCheckout({ viagem, loteAtual, onClose }: Props) {
  const temSinal  = !!(viagem.valor_sinal);
  const precoLote = loteAtual?.lote.valor ?? viagem.valor ?? 0;
  const maxVagas  = Math.min(viagem.vagas_disponiveis ?? 1, 20);

  const [qtd, setQtd]               = useState(1);
  const [tipo, setTipo]             = useState<"completo" | "entrada">("completo");
  const [metodoPag, setMetodoPag]   = useState<"mp" | "pix">("mp");
  const [nome, setNome]             = useState("");
  const [fone, setFone]             = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro]             = useState("");
  const [copiadoKey, setCopiadoKey] = useState(false);
  const [copiadoPix, setCopiadoPix] = useState(false);

  const precoPorPessoa = tipo === "entrada" ? (viagem.valor_sinal ?? 0) : precoLote;
  const totalGeral     = precoPorPessoa * qtd;
  const pixPayload     = buildPix(totalGeral, `RESERVA${viagem.id.slice(0, 8).toUpperCase()}`);

  function copiar(texto: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(texto).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    });
  }

  function incrementar() { if (qtd < maxVagas) setQtd(q => q + 1); }
  function decrementar() { if (qtd > 1) setQtd(q => q - 1); }

  // ── Pagamento via MP ──
  async function handlePagar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) { setErro("Digite seu nome."); return; }
    const foneNum = fone.replace(/\D/g, "");
    if (foneNum.length < 10) { setErro("WhatsApp inválido."); return; }

    setErro("");
    setCarregando(true);

    try {
      const res = await fetch(EDGE_CHECKOUT, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${ANON_KEY}`,
          "apikey":        ANON_KEY,
        },
        body: JSON.stringify({
          viagem_id:          viagem.id,
          nome:               nome.trim(),
          whatsapp:           foneNum,
          quantidade_pessoas: qtd,
          tipo_pagamento:     tipo,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErro(json.erro ?? "Erro ao gerar link de pagamento.");
        setCarregando(false);
        return;
      }

      window.location.href = json.init_point;
    } catch {
      setErro("Erro de conexão. Tente novamente.");
      setCarregando(false);
    }
  }

  // ── PIX: abrir WhatsApp após pagamento ──
  function handlePixPago() {
    if (!nome.trim()) { setErro("Digite seu nome antes de continuar."); return; }
    const msg = `Olá, Lisa! Realizei o pagamento via PIX de ${fmtBRL(totalGeral)} para a viagem *${viagem.titulo}*.\n\nNome: ${nome.trim()}\nWhatsApp: ${fone}\nQuantidade: ${qtd} pessoa(s)\n\nSegue o comprovante!`;
    window.open(`https://wa.me/5521985131616?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg leading-tight">{viagem.titulo}</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {viagem.destino}{viagem.data_saida ? ` · ${fmtData(viagem.data_saida)}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 -mt-1 -mr-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Lote ativo */}
          {loteAtual && (
            <div className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium ${
              loteAtual.lote.numero === 1 ? "bg-green-50 text-green-800" :
              loteAtual.lote.numero === 2 ? "bg-amber-50 text-amber-800" :
              "bg-red-50 text-red-800"
            }`}>
              <span>
                LOTE {loteAtual.lote.numero} ABERTO
                <span className="font-normal opacity-70 ml-1">· {fmtBRL(loteAtual.lote.valor)}/pessoa</span>
              </span>
              {loteAtual.vagasRestantesLote <= 5 && (
                <span className="text-xs font-bold">🔥 {loteAtual.vagasRestantesLote} restantes!</span>
              )}
            </div>
          )}

          {/* Quantidade */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Quantas pessoas?
            </label>
            <div className="flex items-center gap-4">
              <button type="button" onClick={decrementar}
                className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-primary hover:text-brand-primary transition-colors disabled:opacity-30"
                disabled={qtd <= 1}>
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-2xl font-bold text-gray-900 w-8 text-center">{qtd}</span>
              <button type="button" onClick={incrementar}
                className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-primary hover:text-brand-primary transition-colors disabled:opacity-30"
                disabled={qtd >= maxVagas}>
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 ml-1">{maxVagas} vagas disponíveis</span>
            </div>
          </div>

          {/* Tipo de valor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Valor
            </label>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${
                tipo === "completo" ? "border-brand-primary bg-brand-primary/5" : "border-gray-200 hover:border-gray-300"
              }`}>
                <input type="radio" name="tipo" value="completo" checked={tipo === "completo"}
                  onChange={() => setTipo("completo")} className="mt-0.5 accent-[#C8873A]" />
                <div>
                  <div className="font-semibold text-sm text-gray-900">Valor completo</div>
                  <div className="text-xs text-gray-500">{fmtBRL(precoLote)} por pessoa</div>
                </div>
                <span className="ml-auto font-bold text-brand-primary text-sm whitespace-nowrap">
                  {fmtBRL(precoLote * qtd)}
                </span>
              </label>

              {temSinal && (
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${
                  tipo === "entrada" ? "border-brand-primary bg-brand-primary/5" : "border-gray-200 hover:border-gray-300"
                }`}>
                  <input type="radio" name="tipo" value="entrada" checked={tipo === "entrada"}
                    onChange={() => setTipo("entrada")} className="mt-0.5 accent-[#C8873A]" />
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Apenas o sinal</div>
                    <div className="text-xs text-gray-500">{fmtBRL(viagem.valor_sinal!)} por pessoa · garante sua vaga</div>
                  </div>
                  <span className="ml-auto font-bold text-gray-700 text-sm whitespace-nowrap">
                    {fmtBRL(viagem.valor_sinal! * qtd)}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Wallet className="w-4 h-4" />
              Total a pagar
              {qtd > 1 && <span className="text-gray-400">({qtd} × {fmtBRL(precoPorPessoa)})</span>}
            </div>
            <span className="text-xl font-bold text-gray-900">{fmtBRL(totalGeral)}</span>
          </div>

          {/* Dados de contato */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nome completo *</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Seu nome"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp *</label>
              <input
                type="tel"
                value={fone}
                onChange={e => setFone(e.target.value)}
                placeholder="(21) 99999-9999"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Forma de pagamento */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Como quer pagar?</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMetodoPag("mp")}
                className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                  metodoPag === "mp"
                    ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                Mercado Pago
                <span className="text-xs font-normal text-gray-400">cartão · boleto · PIX</span>
              </button>
              <button
                type="button"
                onClick={() => setMetodoPag("pix")}
                className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                  metodoPag === "pix"
                    ? "border-[#32BCAD] bg-[#32BCAD]/5 text-[#32BCAD]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <QrCode className="w-5 h-5" />
                PIX direto
                <span className="text-xs font-normal text-gray-400">sem taxas · na hora</span>
              </button>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{erro}</p>
          )}

          {/* ── Seção MP ── */}
          {metodoPag === "mp" && (
            <form onSubmit={handlePagar}>
              <button
                type="submit"
                disabled={carregando || totalGeral <= 0}
                className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold py-4 rounded-xl text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-brand-primary/20"
              >
                {carregando ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Aguarde...</>
                ) : (
                  <>Ir para pagamento · {fmtBRL(totalGeral)}</>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">
                Processado com segurança pelo <strong>Mercado Pago</strong>. Aceita PIX, cartão e boleto.
              </p>
            </form>
          )}

          {/* ── Seção PIX ── */}
          {metodoPag === "pix" && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex flex-col items-center bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <p className="text-xs text-gray-500 mb-4 font-medium">Escaneie o QR Code com o app do seu banco</p>
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <QRCodeSVG
                    value={pixPayload}
                    size={180}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-400">Valor</p>
                  <p className="text-2xl font-bold text-gray-900">{fmtBRL(totalGeral)}</p>
                </div>
              </div>

              {/* Pix Copia e Cola */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">PIX Copia e Cola</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-600 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                    {pixPayload.slice(0, 40)}…
                  </div>
                  <button
                    type="button"
                    onClick={() => copiar(pixPayload, setCopiadoPix)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
                      copiadoPix
                        ? "bg-green-500 text-white"
                        : "bg-[#32BCAD] hover:bg-[#2aaa9b] text-white"
                    }`}
                  >
                    {copiadoPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiadoPix ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>

              {/* Chave PIX */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Chave PIX (CNPJ)</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 font-mono">
                    {fmtCNPJ(PIX_KEY)}
                  </div>
                  <button
                    type="button"
                    onClick={() => copiar(PIX_KEY, setCopiadoKey)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
                      copiadoKey
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    {copiadoKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiadoKey ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>

              {/* Aviso + botão WhatsApp */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                Após pagar, envie o comprovante para a Lisa confirmar sua reserva.
              </div>

              <button
                type="button"
                onClick={handlePixPago}
                className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-4 rounded-xl transition-colors"
              >
                <Smartphone className="w-5 h-5" />
                Já paguei — enviar comprovante
              </button>

              <p className="text-center text-xs text-gray-400">
                Sua vaga é confirmada após validação do pagamento pela Lisa.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
