import { createClient } from '@/utils/supabase/server'

export default async function AgendamentosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: agendamentos } = await supabase
    .schema('core')
    .from('agendamentos')
    .select('id, data_hora, status, valor_sessao, psicologo_id')
    .eq('colaborador_profile_id', user!.id)
    .order('data_hora', { ascending: false })

  const psicologoIds = [...new Set((agendamentos ?? []).map((a) => a.psicologo_id))]

  let rotuloPorId: Record<string, string> = {}
  if (psicologoIds.length > 0) {
    const { data: psicologos } = await supabase
      .schema('clinical')
      .from('psicologos_busca')
      .select('id, abordagem')
      .in('id', psicologoIds)

    rotuloPorId = Object.fromEntries(
      (psicologos ?? []).map((p) => [p.id, p.abordagem ?? 'Psicoterapia'])
    )
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Meus agendamentos</h1>

      {(!agendamentos || agendamentos.length === 0) && (
        <p className="text-ink-soft mt-4">Você ainda não tem sessões agendadas.</p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {agendamentos?.map((a) => (
          <div
            key={a.id}
            className="rounded-xl border border-border-soft bg-white p-4 flex justify-between items-center"
          >
            <div>
              <p className="text-sm text-ink-soft">
                {rotuloPorId[a.psicologo_id] ?? 'Psicoterapia'}
              </p>
              <p className="font-display text-lg text-ink">
                {new Date(a.data_hora).toLocaleString('pt-BR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
            <span className="text-xs uppercase tracking-wide text-ink-soft">
              {a.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

