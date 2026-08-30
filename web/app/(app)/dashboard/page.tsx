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

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">{copy.title}</h1>
      <p className="text-ink-soft mt-2">{copy.subtitle}</p>

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
