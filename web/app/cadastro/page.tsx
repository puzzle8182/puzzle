'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { BrandMark } from '@/components/brand-mark'

type Role = 'empresa_admin' | 'colaborador' | 'psicologo'

const ROLE_OPTIONS: { value: Role; label: string; hint: string }[] = [
  {
    value: 'empresa_admin',
    label: 'Sou de uma empresa (RH)',
    hint: 'Vou contratar e gerenciar o benefício para colaboradores.',
  },
  {
    value: 'colaborador',
    label: 'Sou colaborador',
    hint: 'Minha empresa oferece este benefício e quero usá-lo.',
  },
  {
    value: 'psicologo',
    label: 'Sou psicólogo(a)',
    hint: 'Quero atender pela plataforma como profissional independente.',
  },
]

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmEmailSent, setConfirmEmailSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!role) {
      setError('Escolha uma opção antes de continuar.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName },
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    // Se o projeto exige confirmação por e-mail, ainda não há sessão ativa aqui.
    if (!data.session) {
      setConfirmEmailSent(true)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (confirmEmailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="w-full max-w-sm rounded-[1.75rem] border border-border-soft bg-white p-10 text-center shadow-[0_24px_64px_-24px_rgba(23,36,42,0.18)]">
          <BrandMark size={40} tone="dark" />
          <h1 className="font-display text-2xl text-ink mt-4">Confirme seu e-mail</h1>
          <p className="text-ink-soft text-sm mt-2">
            Enviamos um link de confirmação para <strong>{email}</strong>. Depois de
            confirmar, você já pode entrar normalmente.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-pine font-medium hover:underline"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm rounded-[1.75rem] border border-border-soft bg-white p-8 shadow-[0_24px_64px_-24px_rgba(23,36,42,0.18)] sm:p-10">
        <div className="flex flex-col items-center mb-8">
          <BrandMark size={40} tone="dark" />
          <h1 className="font-display text-2xl text-ink mt-4">Criar conta</h1>
          <p className="text-ink-soft text-sm mt-1">Escolha como você usa a plataforma</p>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRole(opt.value)}
              className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                role === opt.value
                  ? 'border-pine bg-sage/20'
                  : 'border-border-soft bg-paper hover:border-sage'
              }`}
            >
              <p className="text-sm font-medium text-ink">{opt.label}</p>
              <p className="text-xs text-ink-soft mt-0.5">{opt.hint}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="fullName" className="text-sm text-ink-soft block mb-1.5">
              Nome completo
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border-soft bg-paper px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
            />
          </div>

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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border-soft bg-paper px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
              placeholder="mínimo 6 caracteres"
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
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-sm text-ink-soft text-center mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-pine font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
