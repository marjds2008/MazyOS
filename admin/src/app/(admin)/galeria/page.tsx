"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, Trash2 } from "lucide-react";
import type { GaleriaItem } from "@/types/database";
import Image from "next/image";

export default function GaleriaPage() {
  const [items, setItems] = useState<GaleriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("galeria").select("*").order("ordem", { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggle(id: string, val: boolean) {
    const supabase = createClient();
    await supabase.from("galeria").update({ ativo: val }).eq("id", id);
    setItems(prev => prev.map(g => g.id === id ? { ...g, ativo: val } : g));
  }

  async function remove(id: string, url: string) {
    if (!confirm("Excluir esta foto da galeria?")) return;
    const supabase = createClient();
    const path = url.split("/galeria/")[1];
    if (path) await supabase.storage.from("galeria").remove([path]);
    await supabase.from("galeria").delete().eq("id", id);
    setItems(prev => prev.filter(g => g.id !== id));
  }

  async function updateField(id: string, field: string, value: unknown) {
    const supabase = createClient();
    await supabase.from("galeria").update({ [field]: value }).eq("id", id);
    setItems(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const supabase = createClient();
    for (const file of files) {
      const ext  = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("galeria").upload(path, file);
      if (upErr) continue;
      const { data: pub } = supabase.storage.from("galeria").getPublicUrl(path);
      await supabase.from("galeria").insert({
        imagem_url: pub.publicUrl,
        ativo: true,
        ordem: items.length,
      });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Galeria</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} fotos cadastradas</p>
        </div>
        <label className={`btn-primary cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
          <Upload className="w-4 h-4" />
          {uploading ? "Enviando…" : "Adicionar fotos"}
          <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
      ) : !items.length ? (
        <div className="card py-16 text-center text-gray-400 text-sm">
          Nenhuma foto. Clique em &quot;Adicionar fotos&quot; para começar.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(g => (
            <div key={g.id} className={`card overflow-hidden ${!g.ativo ? "opacity-50" : ""}`}>
              <div className="relative aspect-video bg-gray-100">
                <Image
                  src={g.imagem_url}
                  alt={g.destino ?? "Galeria"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="p-3 space-y-2">
                <input
                  className="input py-1 text-xs"
                  value={g.destino ?? ""}
                  onChange={e => updateField(g.id, "destino", e.target.value)}
                  placeholder="Nome do destino"
                  onBlur={e => updateField(g.id, "destino", e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                    <input type="checkbox" checked={g.ativo} onChange={e => toggle(g.id, e.target.checked)} className="rounded accent-brand-primary" />
                    Visível no site
                  </label>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">Ordem</span>
                    <input
                      type="number"
                      className="input py-1 w-16 text-xs"
                      value={g.ordem}
                      onChange={e => updateField(g.id, "ordem", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <button onClick={() => remove(g.id, g.imagem_url)}
                  className="w-full flex items-center justify-center gap-1.5 text-red-500 hover:text-red-700 text-xs py-1.5 rounded hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3 h-3" /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
