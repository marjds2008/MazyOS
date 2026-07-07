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

const SUPABASE_URL      = 'https://vuhawrfkzutcuqnleykd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aGF3cmZrenV0Y3VxbmxleWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjY1ODMsImV4cCI6MjA4OTgwMjU4M30.pd2IYWUCyy_C_8AT3IvCG6tvtocKAisP1w_gvDnH1mI';

/**
 * Meta Pixel — opcional.
 * Defina o ID abaixo para ativar rastreamento de eventos (PageView, Lead, etc.).
 * Deixe vazio ('') para desativar.
 * Nunca commitar IDs de produção aqui — use variáveis de ambiente no CI/CD.
 */
const PP_META_PIXEL_ID = '';
