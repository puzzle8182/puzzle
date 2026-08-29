import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Use este client em Server Components, Server Actions e Route Handlers.
// Ele lê os cookies de sessão da requisição atual — é o que permite que
// auth.uid() funcione corretamente nas policies de RLS quando a consulta
// parte do servidor (ex: buscando os dados de um Server Component).
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // O método `setAll` foi chamado a partir de um Server Component.
            // Isso pode ser ignorado com segurança se você já tem o
            // middleware.ts (abaixo) atualizando a sessão em toda requisição.
          }
        },
      },
    }
  )
}
