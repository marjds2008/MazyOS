/**
 * Parceria Premiada — Supabase Client
 * Requer: config.js carregado antes desse arquivo
 */

function isSupabaseConfigured() {
  return (
    typeof SUPABASE_URL !== 'undefined' &&
    typeof SUPABASE_ANON_KEY !== 'undefined' &&
    SUPABASE_URL !== 'https://YOUR_PROJECT.supabase.co' &&
    SUPABASE_ANON_KEY !== 'YOUR_ANON_KEY_HERE'
  );
}

// ppSupabase: instância isolada do cliente Supabase para o projeto Parceria Premiada
// Prefixo 'pp' evita conflito com outros projetos no mesmo browser context
const ppSupabase = isSupabaseConfigured()
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!isSupabaseConfigured()) {
  console.warn('[PP] Supabase não configurado — usando modo localStorage. Configure js/config.js para ativar o banco.');
}
