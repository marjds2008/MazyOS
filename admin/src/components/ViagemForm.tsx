"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Viagem, PontoEmbarque } from "@/types/database";
import { Trash2, Upload, Layers, ToggleLeft, ToggleRight, X, Plus } from "lucide-react";

type FormData = Omit<Viagem, "id" | "criado_em" | "atualizado_em">;

const DEFAULT: FormData = {
  titulo: "", destino: "", estado: "", categoria: "praia",
  descricao_curta: "", descricao_completa: "",
  data_saida: "", data_retorno: "", horario_saida: "", local_embarque: "",
  pontos_embarque: [], valor: undefined, valor_sinal: undefined,
  parcelamento: "", vagas_totais: 0, vagas_disponiveis: 0,
  lotes_ativo: false, lotes: [],
  incluso: [], nao_incluso: [], roteiro: "", observacoes: "",
  imagem_principal: "", galeria: [], status: "rascunho",
};

interface LotesFrm {
  ativo: boolean;
  lote1: { vagas: number; valor: number };
  lote2: { vagas: number; pct: number };
  lote3: { vagas: number; pct: number };
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

function backPct(base: number, val: number): number {
  if (!base || !val) return 0;
  return Math.round((val / base - 1) * 100);
}

export default function ViagemForm({ viagem }: { viagem?: Viagem }) {
  const router   = useRouter();
  const isEdit   = !!viagem?.id;
  const [form, setForm]     = useState<FormData>(viagem ? { ...viagem } : DEFAULT);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [erro, setErro]     = useState("");
  const [uploading, setUploading] = useState(false);

  // ── Estado pontos de embarque ────────────────────────────
  const [pontosReg, setPontosReg] = useState<PontoEmbarque[]>([]);
  const [loadingPontos, setLoadingPontos] = useState(false);
  const [customPonto, setCustomPonto] = useState({ nome: "", horario: "" });

  useEffect(() => {
    const sb = createClient();
    setLoadingPontos(true);
    sb.from("pontos_embarque")
      .select("*")
      .eq("ativo", true)
      .order("ordem", { ascending: true })
      .then(({ data }) => { setPontosReg(data ?? []); setLoadingPontos(false); });
  }, []);

  function getPontoStr(nome: string): string | undefined {
    return (form.pontos_embarque ?? []).find(p => p.split(" — ")[0].trim() === nome);
  }
  function isPontoSel(nome: string) { return getPontoStr(nome) !== undefined; }
  function getHorarioPonto(nome: string) { return getPontoStr(nome)?.split(" — ")[1]?.trim() ?? ""; }

  function togglePontoReg(p: PontoEmbarque, checked: boolean) {
    if (checked) {
      const str = p.horario_padrao ? `${p.nome} — ${p.horario_padrao}` : p.nome;
      set("pontos_embarque", [...(form.pontos_embarque ?? []), str]);
    } else {
      set("pontos_embarque", (form.pontos_embarque ?? []).filter(s => s.split(" — ")[0].trim() !== p.nome));
    }
  }

  function updateHorarioPonto(nome: string, horario: string) {
    set("pontos_embarque", (form.pontos_embarque ?? []).map(s => {
      if (s.split(" — ")[0].trim() === nome) return horario ? `${nome} — ${horario}` : nome;
      return s;
    }));
  }

  function addCustomPonto() {
    if (!customPonto.nome.trim()) return;
    const str = customPonto.horario ? `${customPonto.nome.trim()} — ${customPonto.horario}` : customPonto.nome.trim();
    set("pontos_embarque", [...(form.pontos_embarque ?? []), str]);
    setCustomPonto({ nome: "", horario: "" });
  }

  function removePonto(str: string) {
    set("pontos_embarque", (form.pontos_embarque ?? []).filter(s => s !== str));
  }

  // pontos custom = selecionados que não estão nos registrados
  const pontosCustom = (form.pontos_embarque ?? []).filter(str =>
    !pontosReg.some(r => r.nome === str.split(" — ")[0].trim())
  );

  // ── Estado lotes ──────────────────────────────────────────
  const [lotesFrm, setLotesFrm] = useState<LotesFrm>(() => {
    const lts = viagem?.lotes ?? [];
    const l1 = lts[0]; const l2 = lts[1]; const l3 = lts[2];
    return {
      ativo:  viagem?.lotes_ativo ?? false,
      lote1:  { vagas: l1?.vagas ?? 0, valor: l1?.valor ?? viagem?.valor ?? 0 },
      lote2:  { vagas: l2?.vagas ?? 0, pct: l1 && l2 ? backPct(l1.valor, l2.valor) : 15 },
      lote3:  { vagas: l3?.vagas ?? 0, pct: l1 && l3 ? backPct(l1.valor, l3.valor) : 30 },
    };
  });

  function setL(key: keyof LotesFrm, sub: string, val: unknown) {
    setLotesFrm(f => ({ ...f, [key]: { ...(f[key] as object), [sub]: val } }));
  }

  // valores calculados dos lotes
  const v2 = Math.round(lotesFrm.lote1.valor * (1 + lotesFrm.lote2.pct / 100));
  const v3 = Math.round(lotesFrm.lote1.valor * (1 + lotesFrm.lote3.pct / 100));
  const totalVagasLotes = lotesFrm.lote1.vagas + lotesFrm.lote2.vagas + lotesFrm.lote3.vagas;

  // ─────────────────────────────────────────────────────────

  function set(field: keyof FormData, value: unknown) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function arrayField(value: string): string[] {
    return value.split("\n").map(s => s.trim()).filter(Boolean);
  }

  async function uploadImagem(file: File): Promise<string | null> {
    setUploading(true);
    const supabase = createClient();
    const ext  = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("viagens").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) { setErro("Erro ao fazer upload da imagem."); return null; }
    const { data } = supabase.storage.from("viagens").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleImagemUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImagem(file);
    if (url) set("imagem_principal", url);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErro("");
    const supabase = createClient();

    // Monta lotes para salvar
    const lotesParaSalvar = lotesFrm.ativo ? [
      { numero: 1, vagas: lotesFrm.lote1.vagas, valor: lotesFrm.lote1.valor },
      ...(lotesFrm.lote2.vagas > 0 ? [{ numero: 2, vagas: lotesFrm.lote2.vagas, valor: v2 }] : []),
      ...(lotesFrm.lote3.vagas > 0 ? [{ numero: 3, vagas: lotesFrm.lote3.vagas, valor: v3 }] : []),
    ] : [];

    const vagasTotaisCalc = lotesFrm.ativo ? totalVagasLotes : Number(form.vagas_totais) || 0;

    const payload = {
      ...form,
      incluso:     (form.incluso ?? []).map(s => s.trim()).filter(Boolean),
      nao_incluso: (form.nao_incluso ?? []).map(s => s.trim()).filter(Boolean),
      lotes_ativo: lotesFrm.ativo,
      lotes:       lotesParaSalvar,
      valor:       lotesFrm.ativo ? lotesFrm.lote1.valor : (form.valor || null),
      valor_sinal:      form.valor_sinal || null,
      vagas_totais:     vagasTotaisCalc,
      vagas_disponiveis: lotesFrm.ativo
        ? (isEdit ? (Number(form.vagas_disponiveis) || vagasTotaisCalc) : vagasTotaisCalc)
        : (Number(form.vagas_disponiveis) || 0),
      data_saida:   form.data_saida  || null,
      data_retorno: form.data_retorno || null,
    };

    const { error } = isEdit
      ? await supabase.from("viagens").update(payload).eq("id", viagem!.id)
      : await supabase.from("viagens").insert(payload);
    if (error) { setErro(error.message); setSaving(false); return; }
    router.push("/viagens");
    
  }

  async function handleDelete() {
    if (!confirm("Excluir esta viagem? Esta ação não pode ser desfeita.")) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("viagens").delete().eq("id", viagem!.id);
    router.push("/viagens");
    
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Informações básicas */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">Informações básicas</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Título da viagem *</label>
            <input className="input" value={form.titulo} onChange={e => set("titulo", e.target.value)} required placeholder="Ex: Fim de semana em Búzios" />
          </div>
          <div>
            <label className="label">Destino *</label>
            <input className="input" value={form.destino} onChange={e => set("destino", e.target.value)} required placeholder="Ex: Búzios" />
          </div>
          <div>
            <label className="label">Estado</label>
            <input className="input" value={form.estado ?? ""} onChange={e => set("estado", e.target.value)} placeholder="Ex: RJ" />
          </div>
          <div>
            <label className="label">Categoria *</label>
            <select className="input" value={form.categoria} onChange={e => set("categoria", e.target.value)}>
              <option value="praia">🏖️ Praia</option>
              <option value="serra">🏔️ Serra</option>
              <option value="cultura">🏛️ Cultura e História</option>
              <option value="fe">✨ Fé e Espiritualidade</option>
            </select>
          </div>
          <div>
            <label className="label">Status *</label>
            <select className="input" value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="rascunho">Rascunho</option>
              <option value="aberta">Aberta</option>
              <option value="ultimas_vagas">Últimas vagas</option>
              <option value="esgotada">Esgotada</option>
              <option value="encerrada">Encerrada</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descrição curta</label>
            <textarea className="input resize-none" rows={2} value={form.descricao_curta ?? ""} onChange={e => set("descricao_curta", e.target.value)} placeholder="Aparece no card do site" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descrição completa</label>
            <textarea className="input resize-none" rows={4} value={form.descricao_completa ?? ""} onChange={e => set("descricao_completa", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Datas e embarque */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">Datas e embarque</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Data de saída</label>
            <input type="date" className="input" value={form.data_saida ?? ""} onChange={e => set("data_saida", e.target.value)} />
          </div>
          <div>
            <label className="label">Data de retorno</label>
            <input type="date" className="input" value={form.data_retorno ?? ""} onChange={e => set("data_retorno", e.target.value)} />
          </div>
          <div>
            <label className="label">Horário de saída</label>
            <input className="input" value={form.horario_saida ?? ""} onChange={e => set("horario_saida", e.target.value)} placeholder="Ex: 07:00" />
          </div>
          <div>
            <label className="label">Local de embarque</label>
            <input className="input" value={form.local_embarque ?? ""} onChange={e => set("local_embarque", e.target.value)} placeholder="Ex: Metrô Botafogo" />
          </div>
          <div className="sm:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="label !mb-0">Pontos de embarque</label>
              <a href="/pontos-embarque" target="_blank"
                className="text-xs text-brand-primary hover:underline">
                Gerenciar pontos →
              </a>
            </div>

            {/* Lista de pontos registrados */}
            {loadingPontos ? (
              <div className="text-sm text-gray-400 py-2">Carregando...</div>
            ) : pontosReg.length === 0 ? (
              <div className="text-sm text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-3">
                Nenhum ponto cadastrado.{" "}
                <a href="/pontos-embarque" target="_blank" className="text-brand-primary hover:underline">
                  Cadastrar agora
                </a>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {pontosReg.map(reg => {
                  const sel     = isPontoSel(reg.nome);
                  const horario = getHorarioPonto(reg.nome);
                  return (
                    <div
                      key={reg.id}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                        sel ? "bg-brand-primary/5" : "bg-white dark:bg-gray-900"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={e => togglePontoReg(reg, e.target.checked)}
                        className="w-4 h-4 rounded accent-brand-primary shrink-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => togglePontoReg(reg, !sel)}>
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{reg.nome}</div>
                        {reg.endereco && <div className="text-xs text-gray-400 truncate">{reg.endereco}</div>}
                      </div>
                      {sel ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-gray-400">às</span>
                          <input
                            type="time"
                            value={horario}
                            onChange={e => updateHorarioPonto(reg.nome, e.target.value)}
                            className="input !w-28 !py-1 text-xs"
                          />
                        </div>
                      ) : (
                        reg.horario_padrao && (
                          <span className="text-xs text-gray-400 shrink-0">{reg.horario_padrao}</span>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pontos personalizados selecionados */}
            {pontosCustom.length > 0 && (
              <div className="space-y-1.5">
                {pontosCustom.map(str => (
                  <div key={str} className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-sm border border-blue-100 dark:border-blue-500/20">
                    <span className="flex-1 text-gray-700 dark:text-gray-300">{str}</span>
                    <button type="button" onClick={() => removePonto(str)}
                      className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Adicionar ponto personalizado */}
            <div className="flex gap-2 items-center">
              <input
                className="input text-sm flex-1"
                placeholder="Ponto personalizado..."
                value={customPonto.nome}
                onChange={e => setCustomPonto(c => ({ ...c, nome: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomPonto())}
              />
              <input
                type="time"
                className="input !w-28 text-sm shrink-0"
                value={customPonto.horario}
                onChange={e => setCustomPonto(c => ({ ...c, horario: e.target.value }))}
              />
              <button type="button" onClick={addCustomPonto} className="btn-secondary shrink-0 !py-2">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Valores e vagas */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">Valores e vagas</h2>

        {/* Toggle lotes */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-brand-primary" />
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Venda em lotes</div>
              <div className="text-xs text-gray-500">Preço aumenta conforme o lote avança</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLotesFrm(f => ({ ...f, ativo: !f.ativo }))}
            className="flex items-center gap-2 text-sm font-medium transition-colors"
          >
            {lotesFrm.ativo
              ? <><ToggleRight className="w-8 h-8 text-brand-primary" /><span className="text-brand-primary">Ativado</span></>
              : <><ToggleLeft className="w-8 h-8 text-gray-400" /><span className="text-gray-400">Desativado</span></>
            }
          </button>
        </div>

        {/* Modo SEM lotes */}
        {!lotesFrm.ativo && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Valor (R$)</label>
              <input type="number" step="0.01" className="input" value={form.valor ?? ""}
                onChange={e => set("valor", e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="0,00" />
            </div>
            <div>
              <label className="label">Valor do sinal (R$)</label>
              <input type="number" step="0.01" className="input" value={form.valor_sinal ?? ""}
                onChange={e => set("valor_sinal", e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="0,00" />
            </div>
            <div>
              <label className="label">Parcelamento</label>
              <input className="input" value={form.parcelamento ?? ""} onChange={e => set("parcelamento", e.target.value)} placeholder="Ex: 3x sem juros" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:grid-cols-2">
              <div>
                <label className="label">Vagas totais</label>
                <input type="number" className="input" value={form.vagas_totais ?? 0} onChange={e => set("vagas_totais", parseInt(e.target.value))} />
              </div>
              <div>
                <label className="label">Vagas disponíveis</label>
                <input type="number" className="input" value={form.vagas_disponiveis ?? 0} onChange={e => set("vagas_disponiveis", parseInt(e.target.value))} />
              </div>
            </div>
          </div>
        )}

        {/* Modo COM lotes */}
        {lotesFrm.ativo && (
          <div className="space-y-4">
            {/* Tabela de lotes */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lote</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vagas</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Preço</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Calculado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {/* Lote 1 */}
                  <tr className="bg-white dark:bg-gray-900">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 bg-brand-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        Lote 1 <span className="opacity-75">· base</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min="0" className="input w-24" placeholder="0"
                        value={lotesFrm.lote1.vagas || ""}
                        onChange={e => setL("lote1", "vagas", parseInt(e.target.value) || 0)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">R$</span>
                        <input type="number" min="0" step="0.01" className="input w-28" placeholder="0,00"
                          value={lotesFrm.lote1.valor || ""}
                          onChange={e => setL("lote1", "valor", parseFloat(e.target.value) || 0)} />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      {lotesFrm.lote1.valor > 0 ? fmtBRL(lotesFrm.lote1.valor) : "—"}
                    </td>
                  </tr>
                  {/* Lote 2 */}
                  <tr className="bg-amber-50/50 dark:bg-amber-900/10">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        Lote 2
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min="0" className="input w-24" placeholder="0"
                        value={lotesFrm.lote2.vagas || ""}
                        onChange={e => setL("lote2", "vagas", parseInt(e.target.value) || 0)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">+</span>
                        <input type="number" min="0" max="200" className="input w-16" placeholder="15"
                          value={lotesFrm.lote2.pct || ""}
                          onChange={e => setL("lote2", "pct", parseInt(e.target.value) || 0)} />
                        <span className="text-gray-400 text-xs">% s/ L1</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">
                      {lotesFrm.lote1.valor > 0 ? fmtBRL(v2) : "—"}
                    </td>
                  </tr>
                  {/* Lote 3 */}
                  <tr className="bg-red-50/50 dark:bg-red-900/10">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        Lote 3
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min="0" className="input w-24" placeholder="0"
                        value={lotesFrm.lote3.vagas || ""}
                        onChange={e => setL("lote3", "vagas", parseInt(e.target.value) || 0)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">+</span>
                        <input type="number" min="0" max="200" className="input w-16" placeholder="30"
                          value={lotesFrm.lote3.pct || ""}
                          onChange={e => setL("lote3", "pct", parseInt(e.target.value) || 0)} />
                        <span className="text-gray-400 text-xs">% s/ L1</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-red-500 dark:text-red-400">
                      {lotesFrm.lote1.valor > 0 ? fmtBRL(v3) : "—"}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <tr>
                    <td className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Total</td>
                    <td className="px-4 py-2 font-semibold text-gray-900 dark:text-white">{totalVagasLotes} vagas</td>
                    <td colSpan={2} className="px-4 py-2 text-xs text-gray-400">
                      {lotesFrm.lote2.vagas === 0 && lotesFrm.lote3.vagas === 0 && "Adicione vagas nos lotes 2 e 3"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Vagas disponíveis (controle manual de ocupação) */}
            {isEdit && (
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="label">Vagas disponíveis agora</label>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Atualize conforme as reservas chegam</p>
                  <input type="number" min="0" max={totalVagasLotes} className="input"
                    value={form.vagas_disponiveis ?? totalVagasLotes}
                    onChange={e => set("vagas_disponiveis", parseInt(e.target.value))} />
                </div>
                <div className="flex items-end pb-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {totalVagasLotes - (form.vagas_disponiveis ?? totalVagasLotes)}
                    </span> vagas preenchidas de <span className="font-semibold">{totalVagasLotes}</span>
                    {" "}({totalVagasLotes > 0 ? Math.round((totalVagasLotes - (form.vagas_disponiveis ?? totalVagasLotes)) / totalVagasLotes * 100) : 0}% ocupação)
                  </div>
                </div>
              </div>
            )}

            {/* Parcelamento / sinal */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div>
                <label className="label">Valor do sinal (R$)</label>
                <input type="number" step="0.01" className="input" value={form.valor_sinal ?? ""}
                  onChange={e => set("valor_sinal", e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="0,00" />
              </div>
              <div>
                <label className="label">Parcelamento</label>
                <input className="input" value={form.parcelamento ?? ""} onChange={e => set("parcelamento", e.target.value)} placeholder="Ex: 3x sem juros" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* O que está incluso */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">O que está incluso</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Incluso (um por linha)</label>
            <textarea className="input resize-none" rows={5}
              value={(form.incluso ?? []).join("\n")}
              onChange={e => set("incluso", e.target.value.split("\n"))}
              onBlur={e => set("incluso", arrayField(e.target.value))}
              placeholder={"Transporte em ônibus\nGuia turístico\nSeguro viagem"} />
          </div>
          <div>
            <label className="label">Não incluso (um por linha)</label>
            <textarea className="input resize-none" rows={5}
              value={(form.nao_incluso ?? []).join("\n")}
              onChange={e => set("nao_incluso", e.target.value.split("\n"))}
              onBlur={e => set("nao_incluso", arrayField(e.target.value))}
              placeholder={"Alimentação\nPasseios opcionais"} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Roteiro</label>
            <textarea className="input resize-none" rows={4} value={form.roteiro ?? ""} onChange={e => set("roteiro", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Observações</label>
            <textarea className="input resize-none" rows={3} value={form.observacoes ?? ""} onChange={e => set("observacoes", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Imagem */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">Imagem principal</h2>
        {form.imagem_principal && (
          <img src={form.imagem_principal} alt="Preview" className="w-full max-w-sm rounded-xl object-cover aspect-video" />
        )}
        <div className="flex gap-3 flex-wrap">
          <label className="btn-secondary cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploading ? "Enviando…" : "Upload de imagem"}
            <input type="file" accept="image/*" className="sr-only" onChange={handleImagemUpload} disabled={uploading} />
          </label>
          <div className="flex-1 min-w-0">
            <input className="input" value={form.imagem_principal ?? ""} onChange={e => set("imagem_principal", e.target.value)} placeholder="Ou cole a URL da imagem" />
          </div>
        </div>
      </div>

      {/* Ações */}
      {erro && <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3">{erro}</p>}

      <div className="flex items-center justify-between gap-3">
        {isEdit && (
          <button type="button" onClick={handleDelete} className="btn-danger" disabled={deleting}>
            <Trash2 className="w-4 h-4" />
            {deleting ? "Excluindo…" : "Excluir viagem"}
          </button>
        )}
        <div className="flex gap-3 ml-auto">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar viagem"}
          </button>
        </div>
      </div>
    </form>
  );
}
