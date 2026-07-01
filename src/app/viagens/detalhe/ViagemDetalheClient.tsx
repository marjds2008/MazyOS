"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, Bus, FileText, Phone } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import FormReservaViagem from "@/components/FormReservaViagem";

const WHATSAPP_NUMBER = "5521985131616";

function fmtData(d?: string) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

const STATUS_LABEL: Record<string, string> = {
  aberta:        "Vagas disponíveis",
  ultimas_vagas: "Últimas vagas!",
  esgotada:      "Esgotada",
  encerrada:     "Encerrada",
};
const STATUS_COR: Record<string, string> = {
  aberta:        "bg-green-100 text-green-700",
  ultimas_vagas: "bg-amber-100 text-amber-700 animate-pulse",
  esgotada:      "bg-red-100 text-red-700",
  encerrada:     "bg-gray-100 text-gray-500",
};

export default function ViagemDetalheClient() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-5 py-20 text-center">
        <p className="text-brand-muted text-sm">Carregando detalhes...</p>
      </div>
    }>
      <DetalheContent />
    </Suspense>
  );
}

function DetalheContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [v, setV] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      router.replace("/viagens");
      return;
    }

    async function carregar() {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from("viagens")
          .select("*")
          .eq("id", id as string)
          .single();

        if (error || !data) {
          console.error("[ViagemDetalheClient] erro:", error?.message);
          router.replace("/viagens");
        } else {
          setV(data);
        }
      } catch (err) {
        console.error("[ViagemDetalheClient] erro:", err);
        router.replace("/viagens");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [id, router]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-20 text-center">
        <p className="text-brand-muted text-sm">Carregando detalhes da viagem...</p>
      </div>
    );
  }

  if (!v) return null;

  const esgotada = v.status === "esgotada" || v.status === "encerrada";
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá, Lisa! Tenho interesse na viagem para ${v.titulo}. Pode me ajudar?`)}`;

  const pctOcupacao = v.vagas_totais && v.vagas_totais > 0
    ? Math.round(((v.vagas_totais - (v.vagas_disponiveis ?? v.vagas_totais)) / v.vagas_totais) * 100)
    : 0;

  return (
    <>
      {/* ── Breadcrumb ── */}
      <div className="max-w-5xl mx-auto px-5 py-4 text-sm text-brand-muted">
        <Link href="/viagens" className="hover:text-brand-primary transition-colors">← Todas as viagens</Link>
      </div>

      <div className="max-w-5xl mx-auto px-5 pb-20 grid lg:grid-cols-3 gap-8">

        {/* ── Coluna principal ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Imagem principal */}
          <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden bg-gray-200 shadow-lg">
            {v.imagem_principal ? (
              <Image
                src={v.imagem_principal}
                alt={`Excursão ${v.titulo} — Amo Viajar`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 66vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary/20 to-brand-primary/5">
                <MapPin className="w-16 h-16 text-brand-primary/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-5 left-6 text-white">
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-1">{v.titulo}</h1>
              <div className="flex items-center gap-2 text-white/80">
                <MapPin className="w-4 h-4" /> {v.destino}{v.estado ? `, ${v.estado}` : ""}
              </div>
            </div>
            <div className="absolute top-5 right-5">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_COR[v.status] ?? "bg-gray-100 text-gray-500"}`}>
                {STATUS_LABEL[v.status] ?? v.status}
              </span>
            </div>
          </div>

          {/* Info rápida */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {v.data_saida && (
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <Calendar className="w-5 h-5 text-brand-primary mx-auto mb-1" />
                <div className="text-xs text-brand-muted">Saída</div>
                <div className="font-semibold text-brand-text text-sm mt-0.5">
                  {new Date(v.data_saida + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </div>
              </div>
            )}
            {v.data_retorno && (
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <Calendar className="w-5 h-5 text-brand-muted mx-auto mb-1" />
                <div className="text-xs text-brand-muted">Retorno</div>
                <div className="font-semibold text-brand-text text-sm mt-0.5">
                  {new Date(v.data_retorno + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </div>
              </div>
            )}
            {v.vagas_disponiveis !== undefined && v.vagas_totais && (
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <Users className="w-5 h-5 text-brand-primary mx-auto mb-1" />
                <div className="text-xs text-brand-muted">Vagas</div>
                <div className="font-semibold text-brand-text text-sm mt-0.5">{v.vagas_disponiveis} disponíveis</div>
              </div>
            )}
            {v.horario_saida && (
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <Clock className="w-5 h-5 text-brand-primary mx-auto mb-1" />
                <div className="text-xs text-brand-muted">Horário</div>
                <div className="font-semibold text-brand-text text-sm mt-0.5">{v.horario_saida}</div>
              </div>
            )}
          </div>

          {/* Barra de ocupação */}
          {v.vagas_totais && v.vagas_totais > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-brand-text">{pctOcupacao}% das vagas preenchidas</span>
                <span className="text-brand-muted">{v.vagas_disponiveis ?? 0} vagas restantes</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pctOcupacao >= 80 ? "bg-red-500" : pctOcupacao >= 50 ? "bg-amber-500" : "bg-brand-primary"}`}
                  style={{ width: `${widthVal(pctOcupacao)}%` }}
                />
              </div>
            </div>
          )}

          {/* Descrição */}
          {v.descricao_completa && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-brand-text mb-3">Sobre a viagem</h2>
              <p className="text-brand-muted leading-relaxed whitespace-pre-line">{v.descricao_completa}</p>
            </div>
          )}

          {/* Incluso / Não incluso */}
          {((v.incluso?.length ?? 0) > 0 || (v.nao_incluso?.length ?? 0) > 0) && (
            <div className="grid sm:grid-cols-2 gap-4">
              {v.incluso?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-brand-text mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> O que está incluso
                  </h2>
                  <ul className="space-y-2">
                    {v.incluso.map((item: string) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-brand-muted">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {v.nao_incluso?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-brand-text mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" /> Não incluso
                  </h2>
                  <ul className="space-y-2">
                    {v.nao_incluso.map((item: string) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-brand-muted">
                        <span className="text-red-400 mt-0.5 shrink-0">×</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Roteiro */}
          {v.roteiro && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-brand-text mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-primary" /> Roteiro
              </h2>
              <p className="text-brand-muted text-sm leading-relaxed whitespace-pre-line">{v.roteiro}</p>
            </div>
          )}

          {/* Pontos de embarque */}
          {v.pontos_embarque?.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-brand-text mb-3 flex items-center gap-2">
                <Bus className="w-4 h-4 text-brand-primary" /> Pontos de embarque
              </h2>
              <ul className="space-y-2">
                {v.pontos_embarque.map((ponto: string) => (
                  <li key={ponto} className="flex items-center gap-3 text-sm text-brand-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                    {ponto}
                  </li>
                ))}
              </ul>
              {v.local_embarque && (
                <p className="text-xs text-brand-muted mt-3 pt-3 border-t border-gray-100">
                  Local principal: <span className="font-medium">{v.local_embarque}</span>
                </p>
              )}
            </div>
          )}

          {/* Galeria */}
          {v.galeria?.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-brand-text mb-4">Fotos da viagem</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {v.galeria.map((url: string, i: number) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                    <Image
                      src={url}
                      alt={`Foto ${i + 1} da viagem ${v.titulo}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 45vw, 20vw"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          {v.observacoes && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <h2 className="font-semibold text-brand-text mb-2">Observações importantes</h2>
              <p className="text-brand-muted text-sm leading-relaxed whitespace-pre-line">{v.observacoes}</p>
            </div>
          )}
        </div>

        {/* ── Sidebar: preço + formulário ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">

            {/* Card preço */}
            <div className="bg-white rounded-3xl shadow-xl p-7">
              <div className="mb-5">
                {v.valor ? (
                  <>
                    <div className="text-brand-muted text-xs mb-1">A partir de</div>
                    <div className="text-3xl font-bold text-brand-primary">{fmtBRL(v.valor)}</div>
                    {v.valor_sinal && (
                      <div className="text-sm text-brand-muted mt-1">Sinal: {fmtBRL(v.valor_sinal)}</div>
                    )}
                    {v.parcelamento && (
                      <div className="text-xs text-green-600 font-medium mt-1">{v.parcelamento}</div>
                    )}
                  </>
                ) : (
                  <div className="text-brand-muted text-sm">Consultar preço</div>
                )}
              </div>

              {v.data_saida && (
                <div className="text-sm text-brand-muted mb-5 pb-5 border-b border-gray-100">
                  <span className="font-medium text-brand-text">Saída: </span>
                  {fmtData(v.data_saida)}
                </div>
              )}

              {/* Formulário ou esgotada */}
              {esgotada ? (
                <div className="text-center py-4">
                  <p className="text-brand-muted text-sm mb-4">Esta viagem está esgotada, mas a Lisa pode ter uma novidade!</p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-4 rounded-xl transition-colors text-sm"
                  >
                    <Phone className="w-4 h-4" /> Falar com a Lisa
                  </a>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-brand-text mb-4">Reservar minha vaga</h3>
                  <FormReservaViagem
                    viagem_id={v.id}
                    titulo={v.titulo}
                    destino={v.destino}
                  />
                </>
              )}
            </div>

            {/* WhatsApp direto */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Falar com a Lisa
          </a>
        </div>
      </div>
    </div>
  </>
  );
}

function widthVal(val: number) {
  return Math.min(100, val);
}
