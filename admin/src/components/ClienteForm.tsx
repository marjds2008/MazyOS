"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";
import type { Cliente, CategoriaFavorita } from "@/types/database";

const CATEGORIAS: { value: CategoriaFavorita; label: string }[] = [
  { value: "serra",      label: "Serra" },
  { value: "praia",      label: "Praia" },
  { value: "cultura",    label: "Cultura" },
  { value: "fe",         label: "Fé" },
  { value: "interior_rj", label: "Interior RJ" },
];

interface Props {
  cliente?: Cliente;
  onClose: () => void;
  onSaved: () => void;
}

export default function ClienteForm({ cliente, onClose, onSaved }: Props) {
  const isEdit = !!cliente;
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    nome:                      cliente?.nome ?? "",
    whatsapp:                  cliente?.whatsapp ?? "",
    cidade:                    cliente?.cidade ?? "",
    data_nascimento:           cliente?.data_nascimento ?? "",
    categoria_favorita:        cliente?.categoria_favorita ?? "",
    observacoes:               cliente?.observacoes ?? "",
    aceitou_receber_mensagens: cliente?.aceitou_receber_mensagens ?? true,
  });

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function salvar() {
    if (!form.nome.trim() || !form.whatsapp.trim()) {
      setErro("Nome e WhatsApp são obrigatórios.");
      return;
    }
    setSaving(true);
    setErro("");
    const supabase = createClient();
    const payload = {
      nome:                      form.nome.trim(),
      whatsapp:                  form.whatsapp.trim(),
      cidade:                    form.cidade.trim() || null,
      data_nascimento:           form.data_nascimento || null,
      categoria_favorita:        form.categoria_favorita || null,
      observacoes:               form.observacoes.trim() || null,
      aceitou_receber_mensagens: form.aceitou_receber_mensagens,
      origem:                    isEdit ? cliente!.origem : "manual",
    };
    const { error } = isEdit
      ? await supabase.from("clientes").update(payload).eq("id", cliente!.id)
      : await supabase.from("clientes").insert(payload);
    setSaving(false);
    if (error) { setErro(error.message); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isEdit ? "Editar cliente" : "Novo cliente"}</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome *</label>
              <input className="input" value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <label className="label">WhatsApp *</label>
              <input className="input" value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="21999999999" />
            </div>
            <div>
              <label className="label">Cidade</label>
              <input className="input" value={form.cidade} onChange={e => set("cidade", e.target.value)} placeholder="Rio de Janeiro" />
            </div>
            <div>
              <label className="label">Data de nascimento</label>
              <input className="input" type="date" value={form.data_nascimento} onChange={e => set("data_nascimento", e.target.value)} />
            </div>
            <div>
              <label className="label">Categoria favorita</label>
              <select className="input" value={form.categoria_favorita} onChange={e => set("categoria_favorita", e.target.value)}>
                <option value="">Não informado</option>
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Observações</label>
              <textarea className="input resize-none" rows={3} value={form.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Preferências, histórico relevante…" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="aceite" checked={form.aceitou_receber_mensagens}
                onChange={e => set("aceitou_receber_mensagens", e.target.checked)}
                className="w-4 h-4 rounded accent-brand-primary" />
              <label htmlFor="aceite" className="text-sm text-gray-700 cursor-pointer">Aceita receber mensagens</label>
            </div>
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={salvar} disabled={saving} className="btn-primary">
            {saving ? "Salvando…" : isEdit ? "Salvar" : "Cadastrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
