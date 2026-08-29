import { createBrowserClient } from '@supabase/ssr'

// Use este client em qualquer arquivo marcado com 'use client' no topo.
// A publishable key é segura para expor no navegador — a proteção real
// vem das policies de RLS que já configuramos no banco, não do sigilo desta chave.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
