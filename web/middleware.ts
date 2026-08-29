import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Renova o token de sessão em toda requisição, antes que ele expire.
// Sem isso, sessões de usuário expirariam silenciosamente e o app
// pareceria "deslogar sozinho" depois de um tempo.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: não remova esta linha. Ela força a checagem do usuário,
  // o que é o que efetivamente atualiza o cookie de sessão antes de expirar.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Exemplo de proteção de rota: redireciona para /login quem não está
  // autenticado e tenta acessar qualquer coisa fora de rotas públicas.
  // Ajuste a lista conforme as páginas públicas do seu app (login, cadastro, home).
  const rotasPublicas = ['/login', '/cadastro', '/']
  const isRotaPublica = rotasPublicas.some((rota) => request.nextUrl.pathname === rota)

  if (!user && !isRotaPublica) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
