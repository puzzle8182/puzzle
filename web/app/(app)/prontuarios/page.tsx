import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Icon } from '@/components/icon'

export default async function ProntuariosPage() {
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

  const inicioDoMes = new Date()
  inicioDoMes.setDate(1)
  inicioDoMes.setHours(0, 0, 0, 0)

  const [
    { data: agendamentos },
    { count: totalAnamneses },
    { count: hipotesesAtivas },
    { count: notasEsteMes },
  ] = await Promise.all([
    supabase
      .schema('core')
      .from('agendamentos')
      .select('colaborador_profile_id')
      .eq('psicologo_id', user.id),
    supabase
      .schema('clinical')
      .from('anamneses')
      .select('*', { count: 'exact', head: true })
      .eq('psicologo_id', user.id),
    supabase
      .schema('clinical')
      .from('hipoteses_diagnosticas')
      .select('*', { count: 'exact', head: true })
      .eq('psicologo_id', user.id)
      .eq('ativa', true),
    supabase
      .schema('clinical')
      .from('notas_sessao')
      .select('*', { count: 'exact', head: true })
      .eq('psicologo_id', user.id)
      .gte('criado_em', inicioDoMes.toISOString()),
  ])

  const colaboradorIds = [
    ...new Set((agendamentos ?? []).map((a) => a.colaborador_profile_id)),
  ]

  let pacientes: { id: string; full_name: string | null; email: string | null }[] = []
  let temAnamnesePorId = new Set<string>()

  if (colaboradorIds.length > 0) {
    const [{ data: perfis }, { data: anamnesesExistentes }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').in('id', colaboradorIds),
      supabase
        .schema('clinical')
        .from('anamneses')
        .select('colaborador_profile_id')
        .eq('psicologo_id', user.id)
        .in('colaborador_profile_id', colaboradorIds),
    ])
    pacientes = perfis ?? []
    temAnamnesePorId = new Set((anamnesesExistentes ?? []).map((a) => a.colaborador_profile_id))
  }

  const cards = [
    { label: 'Pacientes com prontuário', valor: colaboradorIds.length },
    { label: 'Anamneses registradas', valor: totalAnamneses ?? 0 },
    { label: 'Hipóteses diagnósticas ativas', valor: hipotesesAtivas ?? 0 },
    { label: 'Notas de sessão este mês', valor: notasEsteMes ?? 0 },
  ]

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Prontuários</h1>
      <p className="text-ink-soft mt-2">Visão geral dos seus registros clínicos.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-border-soft bg-white p-4"
          >
            <p className="font-display text-2xl text-ink">{c.valor}</p>
            <p className="text-xs text-ink-soft mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <h2 className="font-medium text-ink mt-10 mb-4">Pacientes</h2>

      {pacientes.length === 0 && (
        <p className="text-ink-soft">Você ainda não tem nenhum paciente com sessão agendada.</p>
      )}

      <div className="flex flex-col gap-3">
        {pacientes.map((p) => (
          <Link
            key={p.id}
            href={`/prontuarios/${p.id}`}
            className="flex items-center justify-between gap-3.5 rounded-2xl border border-border-soft bg-white p-5 transition hover:-translate-y-0.5 hover:border-sage hover:shadow-lg hover:shadow-pine/5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{p.full_name ?? 'Sem nome'}</p>
              <p className="text-xs text-ink-soft truncate">{p.email}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${
                temAnamnesePorId.has(p.id)
                  ? 'bg-sage/20 text-pine'
                  : 'bg-paper border border-border-soft text-ink-soft'
              }`}
            >
              {temAnamnesePorId.has(p.id) ? (
                <span className="flex items-center gap-1">
                  <Icon name="check" width={12} height={12} /> Anamnese feita
                </span>
              ) : (
                'Sem anamnese'
              )}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}