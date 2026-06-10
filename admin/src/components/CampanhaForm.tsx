"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CampanhaWhatsapp, Viagem } from "@/types/database";
import { Eye, EyeOff, Send, Save, Users, CheckCircle, XCircle } from "lucide-react";

// ── Segmentos ───────────────────────────────────────────────

const SEGMENTOS = [
  { value: "lista_vip",             label: "Lista VIP",                        desc: "Pessoas cadastradas na lista VIP" },
  { value: "todos_clientes",        label: "Todos os clientes",                 desc: "Todos os clientes cadastrados" },
  { value: "leads_novos",           label: "Leads novos",                       desc: "Interessados ainda não contatados" },
  { value: "leads_nao_convertidos", label: "Leads não convertidos",             desc: "Interessados sem fechamento" },
  { value: "viagem_especifica",     label: "Interessados nesta viagem",         desc: "Requer selecionar uma viagem acima", requiresViagem: true },
  { value: "categoria_praia",       label: "Interessados: Praia",               desc: "Clientes com interesse em praias" },
  { value: "categoria_serra",       label: "Interessados: Serra",               desc: "Clientes com interesse em serra" },
  { value: "categoria_cultura",     label: "Interessados: Cultura e História",  desc: "" },
  { value: "categoria_fe",          label: "Interessados: Fé e Espiritualidade",desc: "" },
  { value: "categoria_interior",    label: "Interessados: Interior RJ",         desc: "" },
];

// ── Mensagem padrão ─────────────────────────────────────────

const MENSAGEM_DEFAULT = `Olá, {{nome}}! Aqui é a Lisa da Amo Viajar ❤️

Abrimos uma nova viagem para {{destino}} no dia {{data_saida}}.

Preparamos tudo com carinho para você viajar com segurança, companhia e alegria.

Valor: {{valor}}

Veja os detalhes aqui:
{{link_viagem}}

Se quiser reservar sua vaga, é só me responder por aqui! 😊

Para não receber mais novidades, responda SAIR.`;

// ── Variáveis disponíveis ───────────────────────────────────

const VARIAVEIS = [
  { tag: "{{nome}}",       desc: "Nome do contato" },
  { tag: "{{destino}}",    desc: "Cidade de destino" },
  { tag: "{{data_saida}}", desc: "Data de saída" },
  { tag: "{{valor}}",      desc: "Valor da viagem" },
  { tag: "{{link_viagem}}",desc: "Link da viagem" },
];

// ── Tipos ───────────────────────────────────────────────────

type FormData = {
  titulo:    string;
  viagem_id: string;
  segmento:  string;
  mensagem:  string;
};

interface Props {
  campanha?: CampanhaWhatsapp;
}

// ── Componente ──────────────────────────────────────────────

export default function CampanhaForm({ campanha }: Props) {
  const router    = useRouter();
  const isEdit    = !!campanha?.id;
  const isLocked  = campanha?.status === "enviada" || campanha?.status === "cancelada";
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [form, setForm] = useState<FormData>({
    titulo:    campanha?.titulo    ?? "",
    viagem_id: campanha?.viagem_id ?? "",
    segmento:  campanha?.segmento  ?? "lista_vip",
    mensagem:  campanha?.mensagem  ?? MENSAGEM_DEFAULT,
  });
  const [viagens, setViagens]       = useState<Viagem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [contagem, setContagem]     = useState<number | null>(null);
  const [contando, setContando]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [sending, setSending]       = useState(false);
  const [erro, setErro]             = useState("");
  const [sucesso, setSucesso]       = useState("");

  // Carregar viagens
  useEffect(() => {
    createClient()
      .from("viagens")
      .select("id, titulo, destino, data_saida, valor, link_publico, status")
      .in("status", ["aberta", "ultimas_vagas", "rascunho"])
      .order("data_saida", { ascending: true })
      .then(({ data }) => setViagens((data ?? []) as Viagem[]));
  }, []);

  // Reset contagem quando segmento/viagem mudam
  useEffect(() => { setContagem(null); }, [form.segmento, form.viagem_id]);

  function set(field: keyof FormData, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErro("");
  }

  // Inserir variável na posição do cursor
  function inserirVariavel(tag: string) {
    const el = textareaRef.current;
    if (!el) { set("mensagem", form.mensagem + tag); return; }
    const start = el.selectionStart ?? form.mensagem.length;
    const end   = el.selectionEnd   ?? start;
    const nova  = form.mensagem.slice(0, start) + tag + form.mensagem.slice(end);
    set("mensagem", nova);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  }

  // Preview com dados de exemplo
  const viagemSelecionada = viagens.find(v => v.id === form.viagem_id);
  function preview() {
    const d = viagemSelecionada;
    return form.mensagem
      .replace(/\{\{nome\}\}/g,       "Maria Silva")
      .replace(/\{\{destino\}\}/g,    d?.destino ?? "Búzios")
      .replace(/\{\{data_saida\}\}/g, d?.data_saida
        ? new Date(d.data_saida + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
        : "15 de agosto")
      .replace(/\{\{valor\}\}/g,      d?.valor
        ? `R$ ${Number(d.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : "R$ 380,00")
      .replace(/\{\{link_viagem\}\}/g, d?.link_publico ?? "https://amoviajar.com.br/viagens");
  }

  // Contar contatos elegíveis
  const contarContatos = useCallback(async () => {
    setContando(true);
    const supabase = createClient();
    let count = 0;

    switch (form.segmento) {
      case "lista_vip": {
        const r = await supabase.from("clientes").select("*", { count: "exact", head: true })
          .eq("opt_out", false).eq("aceitou_receber_mensagens", true).eq("origem", "lista_vip");
        count = r.count ?? 0;
        break;
      }
      case "todos_clientes": {
        const r = await supabase.from("clientes").select("*", { count: "exact", head: true })
          .eq("opt_out", false).eq("aceitou_receber_mensagens", true);
        count = r.count ?? 0;
        break;
      }
      case "leads_novos": {
        const r = await supabase.from("interesses").select("*", { count: "exact", head: true }).eq("status", "novo");
        count = r.count ?? 0;
        break;
      }
      case "leads_nao_convertidos": {
        const r = await supabase.from("interesses").select("*", { count: "exact", head: true })
          .in("status", ["novo", "contatado", "negociando"]);
        count = r.count ?? 0;
        break;
      }
      case "viagem_especifica": {
        if (!form.viagem_id) { setContagem(0); setContando(false); return; }
        const r = await supabase.from("interesses").select("*", { count: "exact", head: true }).eq("viagem_id", form.viagem_id);
        count = r.count ?? 0;
        break;
      }
      default:
        if (form.segmento.startsWith("categoria_")) {
          const cat = form.segmento.replace("categoria_", "");
          const r = await supabase.from("interesses").select("*", { count: "exact", head: true }).eq("categoria", cat);
          count = r.count ?? 0;
        }
    }
    setContagem(count);
    setContando(false);
  }, [form.segmento, form.viagem_id]);

  // Salvar rascunho ou marcar como pronta
  async function salvar(statusAlvo: "rascunho" | "pronta") {
    if (!form.titulo || !form.mensagem) {
      setErro("Preencha o título e a mensagem.");
      return;
    }
    const seg = SEGMENTOS.find(s => s.value === form.segmento);
    if (seg?.requiresViagem && !form.viagem_id) {
      setErro("Selecione uma viagem para o segmento escolhido.");
      return;
    }
    setSaving(true);
    setErro("");
    const supabase = createClient();
    const payload = {
      titulo:          form.titulo,
      viagem_id:       form.viagem_id || null,
      segmento:        form.segmento,
      mensagem:        form.mensagem,
      status:          statusAlvo,
      total_contatos:  contagem ?? 0,
    };
    const { error } = isEdit
      ? await supabase.from("campanhas_whatsapp").update(payload).eq("id", campanha!.id)
      : await supabase.from("campanhas_whatsapp").insert(payload);
    if (error) { setErro(error.message); setSaving(false); return; }
    setSaving(false);
    setSucesso(statusAlvo === "pronta" ? "Campanha marcada como pronta!" : "Rascunho salvo.");
    setTimeout(() => { router.push("/campanhas"); router.refresh(); }, 1200);
  }

  // Enviar campanha via n8n
  async function enviar() {
    if (!isEdit) { setErro("Salve a campanha antes de enviar."); return; }
    if (campanha?.status !== "pronta") {
      setErro("Marque a campanha como pronta antes de enviar.");
      return;
    }
    if (!confirm(`Enviar campanha "${form.titulo}" para ${contagem ?? "?"} contatos?\n\nEsta ação não pode ser desfeita.`)) return;
    setSending(true);
    setErro("");
    const res = await fetch("/api/campanhas/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campanha_id: campanha!.id }),
    });
    if (!res.ok) {
      const data = await res.json();
      setErro(data.error ?? "Erro ao disparar campanha.");
      setSending(false);
      return;
    }
    setSending(false);
    setSucesso("Campanha enviada para o n8n! O disparo está em andamento.");
    setTimeout(() => { router.push("/campanhas"); router.refresh(); }, 2000);
  }

  const segmentoAtual = SEGMENTOS.find(s => s.value === form.segmento);

  return (
    <div className="space-y-6">
      {/* Informações da campanha */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Informações da campanha</h2>

        <div>
          <label className="label">Título interno *</label>
          <input className="input" value={form.titulo} onChange={e => set("titulo", e.target.value)}
            disabled={isLocked} placeholder="Ex.: Abertura de vagas — Búzios Jan/26" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Viagem relacionada (opcional)</label>
            <select className="input" value={form.viagem_id} onChange={e => set("viagem_id", e.target.value)} disabled={isLocked}>
              <option value="">— Sem viagem específica —</option>
              {viagens.map(v => (
                <option key={v.id} value={v.id}>
                  {v.titulo}{v.data_saida ? ` · ${new Date(v.data_saida + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Segmento de envio *</label>
            <select className="input" value={form.segmento} onChange={e => set("segmento", e.target.value)} disabled={isLocked}>
              {SEGMENTOS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {segmentoAtual?.desc && (
              <p className="text-xs text-gray-400 mt-1">{segmentoAtual.desc}</p>
            )}
          </div>
        </div>

        {/* Estimativa de contatos */}
        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" onClick={contarContatos} disabled={contando || isLocked}
            className="btn-secondary text-xs py-1.5 px-3">
            <Users className="w-3.5 h-3.5" />
            {contando ? "Contando…" : "Estimar público"}
          </button>
          {contagem !== null && (
            <span className="text-sm font-semibold text-gray-700">
              {contagem === 0
                ? "⚠️ Nenhum contato elegível neste segmento"
                : `✅ ${contagem.toLocaleString("pt-BR")} contato${contagem !== 1 ? "s" : ""} elegível${contagem !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>
      </div>

      {/* Editor de mensagem */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Mensagem</h2>
          <button type="button" onClick={() => setShowPreview(p => !p)}
            className="btn-secondary text-xs py-1.5 px-3">
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "Fechar preview" : "Ver preview"}
          </button>
        </div>

        {/* Botões de variáveis */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Inserir variável na posição do cursor:</p>
          <div className="flex flex-wrap gap-2">
            {VARIAVEIS.map(v => (
              <button key={v.tag} type="button" onClick={() => inserirVariavel(v.tag)} disabled={isLocked}
                title={v.desc}
                className="text-xs font-mono bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded hover:bg-amber-100 transition-colors disabled:opacity-40">
                {v.tag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Editor */}
          <div>
            <label className="label">Texto da mensagem *</label>
            <textarea
              ref={textareaRef}
              className="input resize-none font-mono text-sm"
              rows={16}
              value={form.mensagem}
              onChange={e => set("mensagem", e.target.value)}
              disabled={isLocked}
              placeholder="Escreva a mensagem aqui…"
            />
            <p className="text-xs text-gray-400 mt-1">{form.mensagem.length} caracteres</p>
          </div>

          {/* Preview */}
          {showPreview && (
            <div>
              <label className="label text-gray-500">Preview — com dados de exemplo</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-sans min-h-[300px]">
                {preview()}
              </div>
              <p className="text-xs text-gray-400 mt-1">Nome: "Maria Silva" · Destino: "{viagemSelecionada?.destino ?? "Búzios"}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Avisos */}
      <div className="card p-4 bg-amber-50 border-amber-200 space-y-1.5">
        <p className="text-xs font-semibold text-amber-800">⚠️ Boas práticas de WhatsApp</p>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li>Envie apenas para quem aceitou receber mensagens (opt_out = false)</li>
          <li>A mensagem inclui a opção SAIR — respeite quem pedir para sair</li>
          <li>O n8n adiciona delay entre envios para evitar bloqueio</li>
          <li>Volume máximo por execução: 50 mensagens (configurável no n8n)</li>
        </ul>
      </div>

      {/* Mensagens de feedback */}
      {erro    && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2"><XCircle className="w-4 h-4 shrink-0" />{erro}</p>}
      {sucesso && <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 shrink-0" />{sucesso}</p>}

      {/* Ações */}
      {!isLocked && (
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => salvar("rascunho")} disabled={saving}
              className="btn-secondary">
              <Save className="w-4 h-4" />
              {saving ? "Salvando…" : "Salvar rascunho"}
            </button>
            <button type="button" onClick={() => salvar("pronta")} disabled={saving}
              className="btn-primary bg-blue-600 hover:bg-blue-700">
              <CheckCircle className="w-4 h-4" />
              Marcar como pronta
            </button>
            {isEdit && campanha?.status === "pronta" && (
              <button type="button" onClick={enviar} disabled={sending}
                className="btn-primary">
                <Send className="w-4 h-4" />
                {sending ? "Enviando…" : "Disparar campanha"}
              </button>
            )}
          </div>
        </div>
      )}

      {isLocked && (
        <div className="card p-4 text-center text-gray-500 text-sm">
          Esta campanha está <strong>{campanha?.status === "enviada" ? "enviada" : "cancelada"}</strong> e não pode ser editada.
        </div>
      )}
    </div>
  );
}
