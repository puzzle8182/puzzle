'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { BrandMark } from '@/components/brand-mark'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError('E-mail ou senha incorretos. Confira e tente de novo.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-[1.75rem] border border-border-soft bg-white p-8 shadow-[0_24px_64px_-24px_rgba(23,36,42,0.18)] sm:p-10">
        <div className="flex flex-col items-center mb-8">
          <BrandMark size={40} tone="dark" />
          <h1 className="font-display text-2xl text-ink mt-4">Entrar</h1>
          <p className="text-ink-soft text-sm mt-1">Acesse sua conta na plataforma</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="text-sm text-ink-soft block mb-1.5">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border-soft bg-paper px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
              placeholder="voce@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm text-ink-soft block mb-1.5">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border-soft bg-paper px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3.5 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-pine text-paper py-2.5 font-medium hover:bg-pine-dark transition-colors disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-sm text-ink-soft text-center mt-6">
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="text-pine font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
