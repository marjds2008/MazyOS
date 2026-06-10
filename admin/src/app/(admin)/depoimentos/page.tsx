"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, Trash2, Star } from "lucide-react";
import type { Depoimento } from "@/types/database";
import Image from "next/image";

export default function DepoimentosPage() {
  const [items, setItems] = useState<Depoimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("depoimentos").select("*").order("ordem", { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggle(id: string, field: "ativo" | "destaque", val: boolean) {
    const supabase = createClient();
    await supabase.from("depoimentos").update({ [field]: val }).eq("id", id);
    setItems(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));
  }

  async function remove(id: string, url: string) {
    if (!confirm("Excluir este depoimento?")) return;
    const supabase = createClient();
    const path = url.split("/depoimentos/")[1];
    if (path) await supabase.storage.from("depoimentos").remove([path]);
    await supabase.from("depoimentos").delete().eq("id", id);
    setItems(prev => prev.filter(d => d.id !== id));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const supabase = createClient();
    for (const file of files) {
      const ext  = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("depoimentos").upload(path, file);
      if (upErr) continue;
      const { data: pub } = supabase.storage.from("depoimentos").getPublicUrl(path);
      await supabase.from("depoimentos").insert({
        imagem_url: pub.publicUrl,
        ativo: true,
        destaque: false,
        ordem: items.length,
      });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    load();
  }

  async function updateOrdem(id: string, ordem: number) {
    const supabase = createClient();
    await supabase.from("depoimentos").update({ ordem }).eq("id", id);
    setItems(prev => prev.map(d => d.id === id ? { ...d, ordem } : d).sort((a, b) => a.ordem - b.ordem));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Depoimentos</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} prints cadastrados</p>
        </div>
        <label className={`btn-primary cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
          <Upload className="w-4 h-4" />
          {uploading ? "Enviando…" : "Adicionar prints"}
          <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
      ) : !items.length ? (
        <div className="card py-16 text-center text-gray-400 text-sm">
          Nenhum depoimento. Clique em &quot;Adicionar prints&quot; para começar.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(d => (
            <div key={d.id} className={`card overflow-hidden ${!d.ativo ? "opacity-50" : ""}`}>
              <div className="relative aspect-[9/16] bg-gray-100">
                <Image
                  src={d.imagem_url}
                  alt="Depoimento"
                  fill
                  className="object-cover"
                  unoptimized
                />
                {d.destaque && (
                  <div className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-2.5 h-2.5" /> Destaque
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                    <input type="checkbox" checked={d.ativo} onChange={e => toggle(d.id, "ativo", e.target.checked)} className="rounded accent-brand-primary" />
                    Visível no site
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none ml-auto">
                    <input type="checkbox" checked={d.destaque} onChange={e => toggle(d.id, "destaque", e.target.checked)} className="rounded accent-amber-400" />
                    Destaque
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Ordem</label>
                  <input
                    type="number"
                    className="input py-1 w-20 text-xs"
                    value={d.ordem}
                    onChange={e => updateOrdem(d.id, parseInt(e.target.value) || 0)}
                  />
                  <button onClick={() => remove(d.id, d.imagem_url)} className="ml-auto text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
