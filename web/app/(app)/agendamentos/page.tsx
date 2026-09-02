import { createClient } from '@/utils/supabase/server'
import { Icon } from '@/components/icon'

const STATUS_STYLE: Record<string, string> = {
  realizado: 'bg-sage/20 text-pine',
  agendado: 'bg-amber/15 text-amber',
  cancelado: 'bg-paper text-ink-soft border border-border-soft',
}

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

      <div className="mt-8 flex flex-col gap-4">
        {agendamentos?.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border-soft bg-white p-6"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
                <Icon name="calendar" width={18} height={18} />
              </span>
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
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${
                STATUS_STYLE[a.status] ?? 'bg-paper text-ink-soft border border-border-soft'
              }`}
            >
              {a.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
