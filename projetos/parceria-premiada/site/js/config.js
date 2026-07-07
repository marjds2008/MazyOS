/**
 * Parceria Premiada — Supabase Config
 *
 * Como configurar:
 * 1. Acesse app.supabase.com → seu projeto → Settings → API
 * 2. Copie Project URL e anon public key
 * 3. Substitua os valores abaixo
 *
 * A chave anon é segura para uso público — as RLS policies
 * do banco controlam o que cada chamada pode acessar.
 */

const SUPABASE_URL      = 'https://supabase.mundodosbots.app.br';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.DJCl1WlIBIcZ2aTGCWr2jUbeF21uk_ivnQDZ-mXKtqE';

/**
 * Meta Pixel — opcional.
 * Defina o ID abaixo para ativar rastreamento de eventos (PageView, Lead, etc.).
 * Deixe vazio ('') para desativar.
 * Nunca commitar IDs de produção aqui — use variáveis de ambiente no CI/CD.
 */
const PP_META_PIXEL_ID = '';
