"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Download, AlertCircle, CheckCircle, Loader2, FileText } from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────

type CategoriaFavorita = "serra" | "praia" | "cultura" | "fe" | "interior_rj";

interface LinhaCSV {
  linha:   number;
  nome:    string;
  whatsapp: string;
  cidade?: string;
  data_nascimento?: string;
  categoria_favorita?: CategoriaFavorita;
  erros:   string[];
}

const CATEGORIAS_VALIDAS: CategoriaFavorita[] = ["serra", "praia", "cultura", "fe", "interior_rj"];

// ── Helpers ────────────────────────────────────────────────

function normalizarWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) return digits;
  if (digits.length === 11) return "55" + digits;
  if (digits.length === 10) return "55" + digits;
  return digits;
}

function normalizarData(raw: string): string | undefined {
  if (!raw.trim()) return undefined;
  // DD/MM/YYYY → YYYY-MM-DD
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  // YYYY-MM-DD já está correto
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim();
  return undefined;
}

function parseCSV(text: string): LinhaCSV[] {
  const linhas = text.split(/\r?\n/).filter(l => l.trim());
  if (linhas.length < 2) return [];

  // Detectar delimitador
  const cabecalho = linhas[0];
  const delimitador = cabecalho.includes(";") ? ";" : ",";

  const cols = cabecalho.split(delimitador).map(c =>
    c.trim().toLowerCase().replace(/"/g, "").replace(/ /g, "_")
  );

  const idxNome       = cols.indexOf("nome");
  const idxWhatsapp   = cols.findIndex(c => c.includes("whatsapp") || c.includes("telefone") || c.includes("celular"));
  const idxCidade     = cols.findIndex(c => c.includes("cidade"));
  const idxNasc       = cols.findIndex(c => c.includes("nasc") || c.includes("aniversario"));
  const idxCat        = cols.findIndex(c => c.includes("categoria"));

  const resultado: LinhaCSV[] = [];

  for (let i = 1; i < linhas.length; i++) {
    const cells = parseLine(linhas[i], delimitador);
    const erros: string[] = [];

    const nome      = idxNome >= 0 ? cells[idxNome]?.trim() ?? "" : "";
    const rawWa     = idxWhatsapp >= 0 ? cells[idxWhatsapp]?.trim() ?? "" : "";
    const whatsapp  = normalizarWhatsapp(rawWa);
    const cidade    = idxCidade >= 0 ? cells[idxCidade]?.trim() || undefined : undefined;
    const rawNasc   = idxNasc >= 0 ? cells[idxNasc]?.trim() ?? "" : "";
    const dataNasc  = normalizarData(rawNasc);
    const rawCat    = idxCat >= 0 ? cells[idxCat]?.trim().toLowerCase() ?? "" : "";
    const cat       = CATEGORIAS_VALIDAS.includes(rawCat as CategoriaFavorita)
                        ? (rawCat as CategoriaFavorita)
                        : undefined;

    if (!nome) erros.push("Nome obrigatório");
    if (!rawWa) erros.push("WhatsApp obrigatório");
    else if (whatsapp.length < 12) erros.push("WhatsApp inválido");
    if (rawNasc && !dataNasc) erros.push("Data inválida (use DD/MM/AAAA)");
    if (rawCat && !cat) erros.push(`Categoria inválida: ${rawCat}`);

    resultado.push({ linha: i + 1, nome, whatsapp, cidade, data_nascimento: dataNasc, categoria_favorita: cat, erros });
  }

  return resultado;
}

function parseLine(line: string, sep: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === sep && !inQ) { cells.push(cur); cur = ""; continue; }
    cur += ch;
  }
  cells.push(cur);
  return cells;
}

const CSV_MODELO = `nome,whatsapp,cidade,data_nascimento,categoria_favorita
Maria Silva,21987654321,Rio de Janeiro,15/03/1985,praia
João Costa,11912345678,São Paulo,,serra
Ana Pereira,21998887766,Niterói,02/07/1990,fe`;

// ── Componente ─────────────────────────────────────────────

interface Props {
  onClose:  () => void;
  onSaved:  () => void;
}

export default function ImportarClientesModal({ onClose, onSaved }: Props) {
  const [step, setStep]         = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [rows, setRows]         = useState<LinhaCSV[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [resultado, setResultado] = useState({ inseridos: 0, ignorados: 0, erros: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const processarArquivo = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) { alert("Selecione um arquivo .csv"); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setStep("preview");
    };
    reader.readAsText(file, "utf-8");
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processarArquivo(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  }

  function baixarModelo() {
    const blob = new Blob([CSV_MODELO], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "modelo-importacao-clientes.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const validas  = rows.filter(r => r.erros.length === 0);
  const invalidas = rows.filter(r => r.erros.length > 0);

  async function importar() {
    if (!validas.length) return;
    setStep("importing");

    const supabase = createClient();

    // Checar quais whatsapps já existem
    const numbers = validas.map(r => r.whatsapp);
    const { data: existentes } = await supabase
      .from("clientes")
      .select("whatsapp")
      .in("whatsapp", numbers);
    const existentesSet = new Set((existentes ?? []).map((e: { whatsapp: string }) => e.whatsapp));

    const novos  = validas.filter(r => !existentesSet.has(r.whatsapp));
    const igno   = validas.filter(r => existentesSet.has(r.whatsapp));

    let inseridos = 0;
    let erros     = 0;

    // Inserir em lotes de 50
    for (let i = 0; i < novos.length; i += 50) {
      const lote = novos.slice(i, i + 50).map(r => ({
        nome:                      r.nome,
        whatsapp:                  r.whatsapp,
        cidade:                    r.cidade ?? null,
        data_nascimento:           r.data_nascimento ?? null,
        categoria_favorita:        r.categoria_favorita ?? null,
        origem:                    "importacao",
        aceitou_receber_mensagens: true,
        opt_out:                   false,
      }));
      const { error } = await supabase.from("clientes").insert(lote);
      if (error) erros += lote.length;
      else inseridos += lote.length;
    }

    setResultado({ inseridos, ignorados: igno.length, erros });
    setStep("done");
    if (inseridos > 0) onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Importar clientes</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* ── STEP: UPLOAD ── */}
          {step === "upload" && (
            <>
              <p className="text-sm text-gray-500">
                Importe contatos em massa via arquivo CSV.
                Colunas aceitas: <code className="bg-gray-100 px-1 rounded text-xs">nome</code>,{" "}
                <code className="bg-gray-100 px-1 rounded text-xs">whatsapp</code>,{" "}
                <code className="bg-gray-100 px-1 rounded text-xs">cidade</code>,{" "}
                <code className="bg-gray-100 px-1 rounded text-xs">data_nascimento</code>,{" "}
                <code className="bg-gray-100 px-1 rounded text-xs">categoria_favorita</code>.
              </p>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragOver ? "border-brand-primary bg-brand-primary/5" : "border-gray-200 hover:border-brand-primary/50 hover:bg-gray-50"
                }`}
              >
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">Clique ou arraste o arquivo CSV aqui</p>
                <p className="text-xs text-gray-400 mt-1">Suporte a vírgula (,) e ponto-e-vírgula (;) como separadores</p>
                <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
              </div>

              <button onClick={baixarModelo} className="flex items-center gap-2 text-sm text-brand-primary hover:underline">
                <Download className="w-4 h-4" /> Baixar modelo CSV
              </button>
            </>
          )}

          {/* ── STEP: PREVIEW ── */}
          {step === "preview" && (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-green-700">{validas.length}</div>
                  <div className="text-xs text-green-600 mt-0.5">Prontos para importar</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-red-600">{invalidas.length}</div>
                  <div className="text-xs text-red-500 mt-0.5">Com erro (serão ignorados)</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gray-700">{rows.length}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Total de linhas</div>
                </div>
              </div>

              {/* Tabela de prévia */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {["#", "Nome", "WhatsApp", "Cidade", "Status"].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.map(r => (
                        <tr key={r.linha} className={r.erros.length ? "bg-red-50/50" : ""}>
                          <td className="px-3 py-2 text-gray-400">{r.linha}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">{r.nome || <span className="text-red-400 italic">vazio</span>}</td>
                          <td className="px-3 py-2 font-mono text-gray-600">{r.whatsapp || "—"}</td>
                          <td className="px-3 py-2 text-gray-500">{r.cidade || "—"}</td>
                          <td className="px-3 py-2">
                            {r.erros.length ? (
                              <span className="flex items-center gap-1 text-red-500" title={r.erros.join(" | ")}>
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate max-w-[120px]">{r.erros[0]}</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-3.5 h-3.5" /> OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {invalidas.length > 0 && (
                <p className="text-xs text-amber-600 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  As linhas com erro serão ignoradas. Corrija o CSV e reimporte-as separadamente.
                </p>
              )}
            </>
          )}

          {/* ── STEP: IMPORTING ── */}
          {step === "importing" && (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600">Importando contatos…</p>
            </div>
          )}

          {/* ── STEP: DONE ── */}
          {step === "done" && (
            <div className="py-8 text-center space-y-4">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
              <h3 className="font-bold text-gray-900 text-lg">Importação concluída</h3>
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-green-700">{resultado.inseridos}</div>
                  <div className="text-xs text-green-600">Inseridos</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-amber-600">{resultado.ignorados}</div>
                  <div className="text-xs text-amber-600">Já existiam</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-red-600">{resultado.erros}</div>
                  <div className="text-xs text-red-500">Erros</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
          {step === "upload" && (
            <>
              <button onClick={onClose} className="btn-secondary">Cancelar</button>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <FileText className="w-3.5 h-3.5" /> Apenas arquivos .csv
              </span>
            </>
          )}
          {step === "preview" && (
            <>
              <button onClick={() => setStep("upload")} className="btn-secondary">← Voltar</button>
              <button
                onClick={importar}
                disabled={validas.length === 0}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Importar {validas.length} contato{validas.length !== 1 ? "s" : ""}
              </button>
            </>
          )}
          {step === "done" && (
            <button onClick={onClose} className="btn-primary w-full">Fechar</button>
          )}
        </div>
      </div>
    </div>
  );
}
