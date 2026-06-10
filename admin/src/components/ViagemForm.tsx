"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Viagem } from "@/types/database";
import { Trash2, Upload } from "lucide-react";

type FormData = Omit<Viagem, "id" | "criado_em" | "atualizado_em">;

const DEFAULT: FormData = {
  titulo: "", destino: "", estado: "", categoria: "praia",
  descricao_curta: "", descricao_completa: "",
  data_saida: "", data_retorno: "", horario_saida: "", local_embarque: "",
  pontos_embarque: [], valor: undefined, valor_sinal: undefined,
  parcelamento: "", vagas_totais: 0, vagas_disponiveis: 0,
  incluso: [], nao_incluso: [], roteiro: "", observacoes: "",
  imagem_principal: "", galeria: [], status: "rascunho",
};

export default function ViagemForm({ viagem }: { viagem?: Viagem }) {
  const router   = useRouter();
  const isEdit   = !!viagem?.id;
  const [form, setForm]     = useState<FormData>(viagem ? { ...viagem } : DEFAULT);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [erro, setErro]     = useState("");
  const [uploading, setUploading] = useState(false);

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
    const payload = {
      ...form,
      valor:             form.valor || null,
      valor_sinal:       form.valor_sinal || null,
      vagas_totais:      Number(form.vagas_totais) || 0,
      vagas_disponiveis: Number(form.vagas_disponiveis) || 0,
      data_saida:        form.data_saida || null,
      data_retorno:      form.data_retorno || null,
    };
    const { error } = isEdit
      ? await supabase.from("viagens").update(payload).eq("id", viagem!.id)
      : await supabase.from("viagens").insert(payload);
    if (error) { setErro(error.message); setSaving(false); return; }
    router.push("/viagens");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Excluir esta viagem? Esta ação não pode ser desfeita.")) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("viagens").delete().eq("id", viagem!.id);
    router.push("/viagens");
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Informações básicas */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Informações básicas</h2>
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
        <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Datas e embarque</h2>
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
          <div className="sm:col-span-2">
            <label className="label">Pontos de embarque (um por linha)</label>
            <textarea className="input resize-none" rows={3}
              value={(form.pontos_embarque ?? []).join("\n")}
              onChange={e => set("pontos_embarque", arrayField(e.target.value))}
              placeholder={"Metrô Botafogo — 07:00\nMetrô Glória — 07:15"} />
          </div>
        </div>
      </div>

      {/* Valores e vagas */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Valores e vagas</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Valor (R$)</label>
            <input type="number" step="0.01" className="input" value={form.valor ?? ""} onChange={e => set("valor", e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="0,00" />
          </div>
          <div>
            <label className="label">Valor do sinal (R$)</label>
            <input type="number" step="0.01" className="input" value={form.valor_sinal ?? ""} onChange={e => set("valor_sinal", e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="0,00" />
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
      </div>

      {/* O que está incluso */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">O que está incluso</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Incluso (um por linha)</label>
            <textarea className="input resize-none" rows={5}
              value={(form.incluso ?? []).join("\n")}
              onChange={e => set("incluso", arrayField(e.target.value))}
              placeholder={"Transporte em ônibus\nGuia turístico\nSeguro viagem"} />
          </div>
          <div>
            <label className="label">Não incluso (um por linha)</label>
            <textarea className="input resize-none" rows={5}
              value={(form.nao_incluso ?? []).join("\n")}
              onChange={e => set("nao_incluso", arrayField(e.target.value))}
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
        <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Imagem principal</h2>
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
      {erro && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{erro}</p>}

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
