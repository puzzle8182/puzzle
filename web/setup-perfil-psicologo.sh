#!/bin/bash
set -e

echo "Criando estrutura de pastas..."
mkdir -p "app/(app)/perfil-psicologo" "app/actions" "components" "lib"

echo "Criando/atualizando app/actions/psicologo.ts..."
cat > "app/actions/psicologo.ts" << 'ENDOFFILE'
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function salvarPerfilPsicologo(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const crp = (formData.get('crp') as string)?.trim()
  const bio = (formData.get('bio') as string)?.trim()
  const abordagem = (formData.get('abordagem') as string)?.trim()
  const areasRaw = (formData.get('areasAtuacao') as string)?.trim()
  const valorSessao = Number(formData.get('valorSessao'))

  if (!crp) {
    return { error: 'O CRP é obrigatório.' }
  }
  if (!valorSessao || valorSessao <= 0) {
    return { error: 'Informe um valor de sessão válido.' }
  }

  const areasAtuacao = areasRaw
    ? areasRaw.split(',').map((a) => a.trim()).filter(Boolean)
    : []

  const { error } = await supabase
    .schema('clinical')
    .from('psicologos')
    .upsert(
      {
        id: user.id,
        crp,
        bio,
        abordagem,
        areas_atuacao: areasAtuacao,
        valor_sessao: valorSessao,
      },
      { onConflict: 'id' }
    )

  if (error) {
    // CRP é único — erro de violação de constraint vira mensagem amigável
    if (error.code === '23505') {
      return { error: 'Esse CRP já está cadastrado por outra conta.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/perfil-psicologo')
  return { success: true }
}

ENDOFFILE

echo "Criando/atualizando components/psicologo-profile-form.tsx..."
cat > "components/psicologo-profile-form.tsx" << 'ENDOFFILE'
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvarPerfilPsicologo } from '@/app/actions/psicologo'

type PerfilExistente = {
  crp: string
  bio: string | null
  abordagem: string | null
  areas_atuacao: string[] | null
  valor_sessao: number
  status_assinatura: string
} | null

export function PsicologoProfileForm({ perfil }: { perfil: PerfilExistente }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await salvarPerfilPsicologo(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  return (
    <div className="max-w-lg">
      {perfil && (
        <div className="mb-6 rounded-lg bg-sage/15 border border-sage/40 px-4 py-3 text-sm text-ink">
          Status da assinatura:{' '}
          <strong className="capitalize">{perfil.status_assinatura}</strong>.{' '}
          {perfil.status_assinatura !== 'ativa' &&
            'Seu perfil só aparece na busca de colaboradores quando a assinatura estiver ativa.'}
        </div>
      )}

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="crp" className="text-sm text-ink-soft block mb-1.5">
            CRP
          </label>
          <input
            id="crp"
            name="crp"
            type="text"
            required
            defaultValue={perfil?.crp ?? ''}
            placeholder="Ex: 06/123456"
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label htmlFor="abordagem" className="text-sm text-ink-soft block mb-1.5">
            Abordagem
          </label>
          <input
            id="abordagem"
            name="abordagem"
            type="text"
            defaultValue={perfil?.abordagem ?? ''}
            placeholder="Ex: Terapia Cognitivo-Comportamental"
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label htmlFor="bio" className="text-sm text-ink-soft block mb-1.5">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={perfil?.bio ?? ''}
            placeholder="Conte um pouco sobre sua prática, para colaboradores que estão escolhendo um psicólogo."
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage resize-none"
          />
        </div>

        <div>
          <label htmlFor="areasAtuacao" className="text-sm text-ink-soft block mb-1.5">
            Áreas de atuação
          </label>
          <input
            id="areasAtuacao"
            name="areasAtuacao"
            type="text"
            defaultValue={perfil?.areas_atuacao?.join(', ') ?? ''}
            placeholder="Separe por vírgula: ansiedade, luto, relacionamentos"
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label htmlFor="valorSessao" className="text-sm text-ink-soft block mb-1.5">
            Valor da sessão (R$)
          </label>
          <input
            id="valorSessao"
            name="valorSessao"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={perfil?.valor_sessao ?? ''}
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3.5 py-2.5">{error}</p>
        )}
        {success && (
          <p className="text-sm text-pine font-medium">Perfil salvo com sucesso.</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-lg bg-pine text-paper py-2.5 font-medium hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          {isPending ? 'Salvando...' : 'Salvar perfil'}
        </button>
      </form>
    </div>
  )
}

ENDOFFILE

echo "Criando/atualizando app/(app)/perfil-psicologo/page.tsx..."
cat > "app/(app)/perfil-psicologo/page.tsx" << 'ENDOFFILE'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PsicologoProfileForm } from '@/components/psicologo-profile-form'

export default async function PerfilPsicologoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'psicologo') {
    redirect('/dashboard')
  }

  const { data: perfil } = await supabase
    .schema('clinical')
    .from('psicologos')
    .select('crp, bio, abordagem, areas_atuacao, valor_sessao, status_assinatura')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Meu perfil profissional</h1>
      <p className="text-ink-soft mt-2">
        Essas informações aparecem para colaboradores na hora de escolher um
        psicólogo.
      </p>

      <div className="mt-8">
        <PsicologoProfileForm perfil={perfil ?? null} />
      </div>
    </div>
  )
}

ENDOFFILE

echo "Criando/atualizando lib/nav-config.ts..."
cat > "lib/nav-config.ts" << 'ENDOFFILE'
export type AppRole = 'empresa_admin' | 'colaborador' | 'psicologo' | 'admin_plataforma'

export type NavItem = {
  label: string
  href: string
  icon: 'home' | 'users' | 'calendar' | 'file' | 'chart' | 'card' | 'search' | 'settings'
}

export const NAV_BY_ROLE: Record<AppRole, NavItem[]> = {
  empresa_admin: [
    { label: 'Visão geral', href: '/dashboard', icon: 'home' },
    { label: 'Colaboradores', href: '/colaboradores', icon: 'users' },
    { label: 'Indicadores', href: '/indicadores', icon: 'chart' },
    { label: 'Faturas', href: '/faturas', icon: 'card' },
  ],
  colaborador: [
    { label: 'Início', href: '/dashboard', icon: 'home' },
    { label: 'Buscar psicólogo', href: '/buscar', icon: 'search' },
    { label: 'Meus agendamentos', href: '/agendamentos', icon: 'calendar' },
  ],
  psicologo: [
    { label: 'Agenda', href: '/dashboard', icon: 'calendar' },
    { label: 'Meu perfil profissional', href: '/perfil-psicologo', icon: 'settings' },
    { label: 'Pacientes', href: '/pacientes', icon: 'users' },
    { label: 'Prontuários', href: '/prontuarios', icon: 'file' },
    { label: 'Financeiro', href: '/financeiro', icon: 'card' },
  ],
  admin_plataforma: [
    { label: 'Visão geral', href: '/dashboard', icon: 'home' },
    { label: 'Empresas', href: '/admin/empresas', icon: 'users' },
    { label: 'Psicólogos', href: '/admin/psicologos', icon: 'users' },
    { label: 'Configurações', href: '/admin/config', icon: 'settings' },
  ],
}

export const ROLE_LABEL: Record<AppRole, string> = {
  empresa_admin: 'Administrador de RH',
  colaborador: 'Colaborador',
  psicologo: 'Psicólogo',
  admin_plataforma: 'Admin da plataforma',
}

ENDOFFILE

echo "Criando/atualizando app/(app)/dashboard/page.tsx..."
cat > "app/(app)/dashboard/page.tsx" << 'ENDOFFILE'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { AppRole } from '@/lib/nav-config'

const WELCOME_COPY: Record<AppRole, { title: string; subtitle: string }> = {
  empresa_admin: {
    title: 'Visão geral do benefício',
    subtitle: 'Acompanhe uso e investimento, sem acesso a conteúdo clínico.',
  },
  colaborador: {
    title: 'Encontre seu psicólogo',
    subtitle: 'Escolha livremente quem você quer para te acompanhar.',
  },
  psicologo: {
    title: 'Sua agenda',
    subtitle: 'Organize seus atendimentos e prontuários com autonomia.',
  },
  admin_plataforma: {
    title: 'Painel da plataforma',
    subtitle: 'Visão consolidada de empresas e profissionais na rede.',
  },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/cadastro')

  const role = profile.role as AppRole
  const copy = WELCOME_COPY[role]

  let precisaCompletarPerfil = false
  if (role === 'psicologo') {
    const { data: perfilClinico } = await supabase
      .schema('clinical')
      .from('psicologos')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    precisaCompletarPerfil = !perfilClinico
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">{copy.title}</h1>
      <p className="text-ink-soft mt-2">{copy.subtitle}</p>

      {precisaCompletarPerfil && (
        <div className="mt-6 rounded-lg bg-amber/10 border border-amber/30 px-4 py-3.5 flex items-center justify-between">
          <p className="text-sm text-ink">
            Complete seu perfil profissional para aparecer na busca dos colaboradores.
          </p>
          <Link
            href="/perfil-psicologo"
            className="text-sm font-medium text-pine hover:underline shrink-0 ml-4"
          >
            Completar agora →
          </Link>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border-soft bg-white p-5">
          <p className="text-xs text-ink-soft uppercase tracking-wide">Em breve</p>
          <p className="font-display text-2xl text-ink mt-1">—</p>
        </div>
        <div className="rounded-xl border border-border-soft bg-white p-5">
          <p className="text-xs text-ink-soft uppercase tracking-wide">Em breve</p>
          <p className="font-display text-2xl text-ink mt-1">—</p>
        </div>
        <div className="rounded-xl border border-border-soft bg-white p-5">
          <p className="text-xs text-ink-soft uppercase tracking-wide">Em breve</p>
          <p className="font-display text-2xl text-ink mt-1">—</p>
        </div>
      </div>
    </div>
  )
}

ENDOFFILE

echo ""
echo "Pronto! Arquivos criados/atualizados:"
echo "  app/actions/psicologo.ts"
echo "  components/psicologo-profile-form.tsx"
echo "  app/(app)/perfil-psicologo/page.tsx"
echo "  lib/nav-config.ts"
echo "  app/(app)/dashboard/page.tsx"