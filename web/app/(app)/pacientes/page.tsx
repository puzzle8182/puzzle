import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Icon } from '@/components/icon'

export default async function PacientesPage() {
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

  const { data: agendamentos } = await supabase
    .schema('core')
    .from('agendamentos')
    .select('colaborador_profile_id, status')
    .eq('psicologo_id', user.id)

  const colaboradorIds = [
    ...new Set((agendamentos ?? []).map((a) => a.colaborador_profile_id)),
  ]

  let pacientes: {
    id: string
    full_name: string | null
    email: string | null
    foto_url: string | null
  }[] = []
  let objetivos: { colaborador_profile_id: string; status: string }[] = []

  if (colaboradorIds.length > 0) {
    const [{ data: perfis }, { data: objetivosData }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, foto_url').in('id', colaboradorIds),
      supabase
        .schema('clinical')
        .from('objetivos_terapeuticos')
        .select('colaborador_profile_id, status')
        .eq('psicologo_id', user.id)
        .in('colaborador_profile_id', colaboradorIds),
    ])
    pacientes = perfis ?? []
    objetivos = objetivosData ?? []
  }

  const resumoPorPaciente = new Map(
    colaboradorIds.map((id) => {
      const sessoesDoColaborador = (agendamentos ?? []).filter(
        (a) => a.colaborador_profile_id === id
      )
      const objetivosDoColaborador = objetivos.filter(
        (o) => o.colaborador_profile_id === id
      )
      return [
        id,
        {
          totalSessoes: sessoesDoColaborador.length,
          sessoesRealizadas: sessoesDoColaborador.filter((a) => a.status === 'realizado')
            .length,
          totalObjetivos: objetivosDoColaborador.length,
          objetivosConcluidos: objetivosDoColaborador.filter((o) => o.status === 'concluido')
            .length,
        },
      ]
    })
  )

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Pacientes</h1>
      <p className="text-ink-soft mt-2">
        Colaboradores que já agendaram sessão com você.
      </p>

      {pacientes.length === 0 && (
        <p className="mt-8 text-ink-soft">
          Você ainda não tem nenhuma sessão agendada.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {pacientes.map((p) => {
          const resumo = resumoPorPaciente.get(p.id)
          return (
            <Link
              key={p.id}
              href={`/prontuarios/${p.id}`}
              className="flex items-center gap-3.5 rounded-2xl border border-border-soft bg-white p-5 transition hover:-translate-y-0.5 hover:border-sage hover:shadow-lg hover:shadow-pine/5"
            >
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border-soft bg-sage/20">
                {p.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.foto_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-sm text-pine">
                    {(p.full_name ?? '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{p.full_name ?? 'Sem nome'}</p>
                <p className="text-xs text-ink-soft truncate">{p.email}</p>
              </div>

              {resumo && (
                <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                  <span className="flex items-center gap-1.5 rounded-full bg-paper border border-border-soft px-2.5 py-1 text-xs text-ink-soft">
                    <Icon name="calendar" width={12} height={12} />
                    {resumo.sessoesRealizadas}/{resumo.totalSessoes} sessões
                  </span>
                  {resumo.totalObjetivos > 0 && (
                    <span className="flex items-center gap-1.5 rounded-full bg-sage/20 px-2.5 py-1 text-xs text-pine">
                      <Icon name="check" width={12} height={12} />
                      {resumo.objetivosConcluidos}/{resumo.totalObjetivos} objetivos
                    </span>
                  )}
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
