import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { NotaSessaoForm } from '@/components/nota-sessao-form'

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
    .select('id, full_name, email')
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

  // Log de auditoria: registra que este psicólogo acessou o prontuário
  // deste paciente. Não bloqueia a página se falhar por algum motivo.
  await supabase.schema('core').rpc('registrar_acesso_clinico', {
    p_tabela: 'clinical.notas_sessao',
    p_registro_id: colaboradorId,
  })

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-ink">{paciente.full_name ?? 'Paciente'}</h1>
      <p className="text-ink-soft mt-1">{paciente.email}</p>

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

