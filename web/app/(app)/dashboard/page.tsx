import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Icon } from '@/components/icon'
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

const STATS_BY_ROLE: Record<AppRole, { icon: string; label: string }[]> = {
  empresa_admin: [
    { icon: 'users', label: 'Colaboradores elegíveis' },
    { icon: 'calendar', label: 'Sessões no mês' },
    { icon: 'card', label: 'Investimento no mês' },
  ],
  colaborador: [
    { icon: 'users', label: 'Psicólogos na rede' },
    { icon: 'calendar', label: 'Próxima sessão' },
    { icon: 'file', label: 'Sessões realizadas' },
  ],
  psicologo: [
    { icon: 'users', label: 'Pacientes ativos' },
    { icon: 'calendar', label: 'Sessões esta semana' },
    { icon: 'card', label: 'A receber' },
  ],
  admin_plataforma: [
    { icon: 'building', label: 'Empresas ativas' },
    { icon: 'users', label: 'Psicólogos verificados' },
    { icon: 'card', label: 'Assinaturas ativas' },
  ],
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
  const stats = STATS_BY_ROLE[role]

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
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-amber/30 bg-amber/10 px-6 py-5">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber/20 text-amber">
              <Icon name="settings" width={18} height={18} />
            </span>
            <p className="text-sm text-ink">
              Complete seu perfil profissional para aparecer na busca dos colaboradores.
            </p>
          </div>
          <Link
            href="/perfil-psicologo"
            className="flex items-center gap-1.5 text-sm font-medium text-pine hover:text-pine-dark transition-colors shrink-0"
          >
            Completar agora
            <Icon name="arrow-right" width={14} height={14} />
          </Link>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border-soft bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pine/5"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-pine/10 text-pine">
              <Icon name={stat.icon} width={18} height={18} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{stat.label}</p>
            <p className="font-display text-2xl text-ink mt-1.5">Em breve</p>
          </div>
        ))}
      </div>
    </div>
  )
}
