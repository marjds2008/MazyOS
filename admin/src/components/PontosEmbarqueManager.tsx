"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PontoEmbarque } from "@/types/database";
import { Trash2, Plus, GripVertical, Check } from "lucide-react";

interface PontoForm {
  nome: string;
  endereco: string;
  horario_padrao: string;
}

const EMPTY: PontoForm = { nome: "", endereco: "", horario_padrao: "" };

export default function PontosEmbarqueManager() {
  const [pontos, setPontos] = useState<PontoEmbarque[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<PontoForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PontoForm>(EMPTY);
  const [erro, setErro] = useState("");

  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("pontos_embarque")
      .select("*")
      .order("ordem", { ascending: true })
      .order("criado_em", { ascending: true });
    setPontos(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    setSaving(true);
    setErro("");
    const { error } = await supabase.from("pontos_embarque").insert({
      nome: form.nome.trim(),
      endereco: form.endereco.trim() || null,
      horario_padrao: form.horario_padrao || null,
      ordem: pontos.length,
    });
    if (error) { setErro(error.message); setSaving(false); return; }
    setForm(EMPTY);
    setSaving(false);
    await load();
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    const { error } = await supabase.from("pontos_embarque").update({
      nome: editForm.nome.trim(),
      endereco: editForm.endereco.trim() || null,
      horario_padrao: editForm.horario_padrao || null,
    }).eq("id", id);
    if (error) { setErro(error.message); setSaving(false); return; }
    setEditId(null);
    setSaving(false);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este ponto de embarque?")) return;
    await supabase.from("pontos_embarque").delete().eq("id", id);
    await load();
  }

  async function handleToggleAtivo(p: PontoEmbarque) {
    await supabase.from("pontos_embarque").update({ ativo: !p.ativo }).eq("id", p.id);
    await load();
  }

  function startEdit(p: PontoEmbarque) {
    setEditId(p.id);
    setEditForm({ nome: p.nome, endereco: p.endereco ?? "", horario_padrao: p.horario_padrao ?? "" });
  }

  if (loading) return <div className="text-sm text-gray-400 py-8 text-center">Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* Formulário de novo ponto */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          Adicionar ponto de embarque
        </h2>
        <form onSubmit={handleAdd} className="grid sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-1">
            <label className="label">Nome *</label>
            <input
              className="input"
              placeholder="Ex: Metrô Botafogo"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              required
            />
          </div>
          <div className="sm:col-span-1">
            <label className="label">Endereço / referência</label>
            <input
              className="input"
              placeholder="Ex: Praça Cardeal Arcoverde"
              value={form.endereco}
              onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Horário padrão</label>
            <div className="flex gap-2">
              <input
                type="time"
                className="input"
                value={form.horario_padrao}
                onChange={e => setForm(f => ({ ...f, horario_padrao: e.target.value }))}
              />
              <button type="submit" className="btn-primary shrink-0" disabled={saving}>
                <Plus className="w-4 h-4" />
                {saving ? "..." : "Adicionar"}
              </button>
            </div>
          </div>
        </form>
        {erro && <p className="text-red-500 text-sm mt-3">{erro}</p>}
      </div>

      {/* Lista */}
      <div className="card overflow-hidden">
        {pontos.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Nenhum ponto cadastrado ainda. Adicione o primeiro acima.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-8"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Endereço</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-28">Horário</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-20">Ativo</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {pontos.map(p => (
                <tr key={p.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 text-gray-300 dark:text-gray-600">
                    <GripVertical className="w-4 h-4" />
                  </td>

                  {editId === p.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input className="input text-xs" value={editForm.nome}
                          onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} />
                      </td>
                      <td className="px-4 py-2 hidden sm:table-cell">
                        <input className="input text-xs" value={editForm.endereco}
                          onChange={e => setEditForm(f => ({ ...f, endereco: e.target.value }))} />
                      </td>
                      <td className="px-4 py-2">
                        <input type="time" className="input text-xs !w-28" value={editForm.horario_padrao}
                          onChange={e => setEditForm(f => ({ ...f, horario_padrao: e.target.value }))} />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white cursor-pointer"
                        onClick={() => startEdit(p)}>{p.nome}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell cursor-pointer"
                        onClick={() => startEdit(p)}>{p.endereco ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500 cursor-pointer"
                        onClick={() => startEdit(p)}>{p.horario_padrao ?? "—"}</td>
                    </>
                  )}

                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(p)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors ${
                        p.ativo
                          ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                      }`}
                      title={p.ativo ? "Desativar" : "Ativar"}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {editId === p.id ? (
                        <>
                          <button type="button" onClick={() => handleSaveEdit(p.id)} className="btn-primary !py-1 !px-2 text-xs" disabled={saving}>
                            Salvar
                          </button>
                          <button type="button" onClick={() => setEditId(null)} className="btn-secondary !py-1 !px-2 text-xs">
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => handleDelete(p.id)} className="btn-danger !py-1 !px-2">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
