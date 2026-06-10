export type Categoria     = "serra" | "praia" | "cultura" | "fe";
export type StatusViagem  = "rascunho" | "aberta" | "ultimas_vagas" | "esgotada" | "encerrada";
export type StatusLead    = "novo" | "contatado" | "negociando" | "fechado" | "perdido";
export type StatusCampanha = "rascunho" | "pronta" | "enviada" | "cancelada";
export type StatusEnvio   = "pendente" | "enviado" | "erro" | "ignorado_opt_out";

export interface Viagem {
  id: string;
  titulo: string;
  destino: string;
  estado?: string;
  categoria: Categoria;
  descricao_curta?: string;
  descricao_completa?: string;
  data_saida?: string;
  data_retorno?: string;
  horario_saida?: string;
  local_embarque?: string;
  pontos_embarque?: string[];
  valor?: number;
  valor_sinal?: number;
  parcelamento?: string;
  vagas_totais?: number;
  vagas_disponiveis?: number;
  incluso?: string[];
  nao_incluso?: string[];
  roteiro?: string;
  observacoes?: string;
  imagem_principal?: string;
  galeria?: string[];
  link_publico?: string;
  status: StatusViagem;
  criado_em: string;
  atualizado_em: string;
}

export interface Lead {
  id: string;
  nome: string;
  whatsapp: string;
  cidade?: string;
  viagem_id?: string;
  viagens?: { titulo: string };
  quantidade_pessoas: number;
  mensagem?: string;
  origem: string;
  status: StatusLead;
  criado_em: string;
}

export interface ListaVip {
  id: string;
  nome: string;
  whatsapp: string;
  cidade?: string;
  origem: string;
  criado_em: string;
}

export interface Depoimento {
  id: string;
  titulo?: string;
  imagem_url: string;
  ativo: boolean;
  ordem: number;
  destaque: boolean;
  criado_em: string;
}

export interface GaleriaItem {
  id: string;
  titulo?: string;
  destino?: string;
  categoria?: string;
  imagem_url: string;
  ativo: boolean;
  ordem: number;
  criado_em: string;
}

// ── CRM ────────────────────────────────────────────────────

export interface Cliente {
  id: string;
  nome: string;
  whatsapp: string;
  cidade?: string;
  origem: string;
  aceitou_receber_mensagens: boolean;
  opt_out: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Interesse {
  id: string;
  cliente_id?: string;
  viagem_id?: string;
  destino?: string;
  categoria?: string;
  quantidade_pessoas: number;
  mensagem?: string;
  status: StatusLead;
  criado_em: string;
  clientes?: Pick<Cliente, "id" | "nome" | "whatsapp" | "cidade">;
  viagens?: Pick<Viagem, "id" | "titulo" | "destino">;
}

// ── Campanhas WhatsApp ──────────────────────────────────────

export interface CampanhaWhatsapp {
  id: string;
  titulo: string;
  viagem_id?: string;
  segmento: string;
  mensagem: string;
  status: StatusCampanha;
  criado_por?: string;
  total_contatos: number;
  total_enviados: number;
  criado_em: string;
  enviado_em?: string;
  viagens?: Pick<Viagem, "id" | "titulo" | "destino" | "data_saida" | "valor" | "link_publico">;
}

export interface MensagemWhatsapp {
  id: string;
  campanha_id: string;
  cliente_id?: string;
  whatsapp: string;
  mensagem: string;
  status_envio: StatusEnvio;
  resposta_api?: Record<string, unknown>;
  enviado_em?: string;
  erro?: string;
  criado_em: string;
  clientes?: Pick<Cliente, "id" | "nome">;
}
