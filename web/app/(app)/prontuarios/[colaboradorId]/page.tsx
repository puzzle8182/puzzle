import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { NotaSessaoForm } from '@/components/nota-sessao-form'
import { ObjetivosTerapeuticos } from '@/components/objetivos-terapeuticos'
import { AnamneseForm } from '@/components/anamnese-form'

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

  const { data: anamnese } = await supabase
    .schema('clinical')
    .from('anamneses')
    .select(
      'data_nascimento, telefone, estado_civil, profissao, queixa_principal, historia_clinica, historia_familiar, historia_laboral, rede_apoio, objetivos_terapeuticos, intercorrencias_iniciais'
    )
    .eq('psicologo_id', user.id)
    .eq('colaborador_profile_id', colaboradorId)
    .maybeSingle()

  const sessoesRealizadas = agendamentos.filter((a) => a.status === 'realizado').length

  // Log de auditoria: registra que este psicólogo acessou o prontuário
  // deste paciente. Não bloqueia a página se falhar por algum motivo.
  await supabase.schema('core').rpc('registrar_acesso_clinico', {
    p_tabela: 'clinical.notas_sessao',
    p_registro_id: colaboradorId,
  })

  return (
    <div className="max-w-2xl">
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
        <span className="rounded-full bg-paper border border-border-soft px-3 py-1 text-xs text-ink-soft">
          {agendamentos.length} sessões agendadas
        </span>
        <span className="rounded-full bg-paper border border-border-soft px-3 py-1 text-xs text-ink-soft">
          {sessoesRealizadas} realizadas
        </span>
      </div>

      <div className="mt-8 rounded-xl border border-border-soft bg-white p-5">
        <h2 className="font-medium text-ink mb-4">Anamnese</h2>
        <AnamneseForm colaboradorProfileId={colaboradorId} anamnese={anamnese ?? null} />
      </div>

      <div className="mt-8 rounded-xl border border-border-soft bg-white p-5">
        <h2 className="font-medium text-ink mb-4">Objetivos terapêuticos</h2>
        <ObjetivosTerapeuticos
          colaboradorProfileId={colaboradorId}
          objetivos={objetivos ?? []}
        />
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {agendamentos.map((a) => {
          const nota = notaPorAgendamento[a.id]
          return (
            <div key={a.id} className="rounded-xl border border-border-soft bg-white p-5">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium text-ink">
                  {new Date(a.data_hora).toLocaleString('pt-BR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
                <span className="text-xs uppercase tracking-wide text-ink-soft">
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
