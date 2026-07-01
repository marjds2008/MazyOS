"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  id: string;
  titulo: string;
}

export default function BotaoDeletarCampanha({ id, titulo }: Props) {
  const router = useRouter();
  const [deletando, setDeletando] = useState(false);

  async function excluir(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Excluir a campanha "${titulo}"?\n\nEsta ação não pode ser desfeita.`)) return;
    setDeletando(true);
    const supabase = createClient();
    await supabase.from("mensagens_whatsapp").delete().eq("campanha_id", id);
    await supabase.from("campanhas_whatsapp").delete().eq("id", id);
    
  }

  return (
    <button
      onClick={excluir}
      disabled={deletando}
      title="Excluir campanha"
      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
