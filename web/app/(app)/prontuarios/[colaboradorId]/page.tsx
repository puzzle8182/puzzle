import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { NotaSessaoForm } from '@/components/nota-sessao-form'
import { ObjetivosTerapeuticos } from '@/components/objetivos-terapeuticos'
import { Icon } from '@/components/icon'

const STATUS_STYLE: Record<string, string> = {
  realizado: 'bg-sage/20 text-pine',
  agendado: 'bg-amber/15 text-amber',
  cancelado: 'bg-paper text-ink-soft border border-border-soft',
}

export default async function ProntuarioPacientePage({
  params,
}: {
  params: Promise<{ colaboradorId: string }>
}) {
  const { colaboradorId } = await params
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

  const { data: paciente } = await supabase
    .from('profiles')
    .select('id, full_name, email, foto_url')
    .eq('id', colaboradorId)
    .single()

  if (!paciente) notFound()

  const { data: agendamentos } = await supabase
    .schema('core')
    .from('agendamentos')
    .select('id, data_hora, status')
    .eq('psicologo_id', user.id)
    .eq('colaborador_profile_id', colaboradorId)
    .order('data_hora', { ascending: false })

  if (!agendamentos || agendamentos.length === 0) notFound()

  const agendamentoIds = agendamentos.map((a) => a.id)

  const { data: notas } = await supabase
    .schema('clinical')
    .from('notas_sessao')
    .select('id, agendamento_id, conteudo')
    .in('agendamento_id', agendamentoIds)

  const notaPorAgendamento = Object.fromEntries(
    (notas ?? []).map((n) => [n.agendamento_id, n])
  )

  const { data: objetivos } = await supabase
    .schema('clinical')
    .from('objetivos_terapeuticos')
    .select('id, descricao, status, criado_em')
    .eq('psicologo_id', user.id)
    .eq('colaborador_profile_id', colaboradorId)
    .order('criado_em', { ascending: true })

  const sessoesRealizadas = agendamentos.filter((a) => a.status === 'realizado').length

  // Log de auditoria: registra que este psicólogo acessou o prontuário
  // deste paciente. Não bloqueia a página se falhar por algum motivo.
  await supabase.schema('core').rpc('registrar_acesso_clinico', {
    p_tabela: 'clinical.notas_sessao',
    p_registro_id: colaboradorId,
  })

  return (
    <div className="max-w-2xl">
      <div className="rounded-2xl border border-border-soft bg-white p-7">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border-soft bg-sage/20">
            {paciente.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={paciente.foto_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-xl text-pine">
                {(paciente.full_name ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl text-ink">{paciente.full_name ?? 'Paciente'}</h1>
            <p className="text-ink-soft text-sm">{paciente.email}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-paper border border-border-soft px-3 py-1 text-xs text-ink-soft">
            <Icon name="calendar" width={12} height={12} />
            {agendamentos.length} sessões agendadas
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-sage/20 px-3 py-1 text-xs text-pine">
            <Icon name="check" width={12} height={12} />
            {sessoesRealizadas} realizadas
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border-soft bg-white p-7">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pine/10 text-pine">
            <Icon name="chart" width={16} height={16} />
          </span>
          <h2 className="font-medium text-ink">Objetivos terapêuticos</h2>
        </div>
        <ObjetivosTerapeuticos
          colaboradorProfileId={colaboradorId}
          objetivos={objetivos ?? []}
        />
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {agendamentos.map((a) => {
          const nota = notaPorAgendamento[a.id]
          return (
            <div key={a.id} className="rounded-2xl border border-border-soft bg-white p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine/10 text-pine">
                    <Icon name="calendar" width={14} height={14} />
                  </span>
                  <p className="text-sm font-medium text-ink">
                    {new Date(a.data_hora).toLocaleString('pt-BR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${
                    STATUS_STYLE[a.status] ?? 'bg-paper text-ink-soft border border-border-soft'
                  }`}
                >
                  {a.status}
                </span>
              </div>
              <NotaSessaoForm
                agendamentoId={a.id}
                colaboradorProfileId={colaboradorId}
                conteudoInicial={nota?.conteudo ?? ''}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
