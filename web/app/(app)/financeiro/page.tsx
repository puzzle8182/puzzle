import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

const STATUS_ASSINATURA_LABEL: Record<string, string> = {
  ativa: 'Ativa',
  inadimplente: 'Inadimplente',
  cancelada: 'Cancelada',
  pendente: 'Pendente',
}

const STATUS_ASSINATURA_STYLE: Record<string, string> = {
  ativa: 'bg-sage/20 text-pine',
  inadimplente: 'bg-red-50 text-red-700',
  cancelada: 'bg-paper border border-border-soft text-ink-soft',
  pendente: 'bg-amber/15 text-amber',
}

const STATUS_PAGAMENTO_LABEL: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  falhou: 'Falhou',
  estornado: 'Estornado',
}

const STATUS_PAGAMENTO_STYLE: Record<string, string> = {
  pago: 'bg-sage/20 text-pine',
  pendente: 'bg-amber/15 text-amber',
  falhou: 'bg-red-50 text-red-700',
  estornado: 'bg-paper border border-border-soft text-ink-soft',
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function FinanceiroPage() {
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

  const { data: psicologoInfo } = await supabase
    .schema('clinical')
    .from('psicologos')
    .select('status_assinatura')
    .eq('id', user.id)
    .single()

  const { data: agendamentos } = await supabase
    .schema('core')
    .from('agendamentos')
    .select('id, data_hora, colaborador_profile_id')
    .eq('psicologo_id', user.id)

  const agendamentoIds = (agendamentos ?? []).map((a) => a.id)
  const agendamentoPorId = Object.fromEntries((agendamentos ?? []).map((a) => [a.id, a]))

  let pagamentos: {
    id: string
    agendamento_id: string
    valor_total: number
    status: string
    pago_em: string | null
    created_at: string
  }[] = []

  if (agendamentoIds.length > 0) {
    const { data } = await supabase
      .schema('core')
      .from('pagamentos_sessao')
      .select('id, agendamento_id, valor_total, status, pago_em, created_at')
      .in('agendamento_id', agendamentoIds)
      .order('created_at', { ascending: false })
    pagamentos = data ?? []
  }

  const colaboradorIds = [
    ...new Set(
      pagamentos
        .map((p) => agendamentoPorId[p.agendamento_id]?.colaborador_profile_id)
        .filter(Boolean)
    ),
  ] as string[]

  let nomePorColaborador: Record<string, string> = {}
  if (colaboradorIds.length > 0) {
    const { data: perfis } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', colaboradorIds)
    nomePorColaborador = Object.fromEntries(
      (perfis ?? []).map((p) => [p.id, p.full_name ?? 'Colaborador'])
    )
  }

  const totalRecebido = pagamentos
    .filter((p) => p.status === 'pago')
    .reduce((soma, p) => soma + Number(p.valor_total), 0)

  const totalPendente = pagamentos
    .filter((p) => p.status === 'pendente')
    .reduce((soma, p) => soma + Number(p.valor_total), 0)

  const statusAssinatura = psicologoInfo?.status_assinatura ?? 'pendente'

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Financeiro</h1>
      <p className="text-ink-soft mt-2">Seus recebimentos e o status da sua assinatura.</p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border-soft bg-white p-5">
          <p className="text-xs text-ink-soft">Total recebido</p>
          <p className="font-display text-2xl text-ink mt-1">{formatarMoeda(totalRecebido)}</p>
        </div>
        <div className="rounded-2xl border border-border-soft bg-white p-5">
          <p className="text-xs text-ink-soft">Pendente</p>
          <p className="font-display text-2xl text-ink mt-1">{formatarMoeda(totalPendente)}</p>
        </div>
        <div className="rounded-2xl border border-border-soft bg-white p-5">
          <p className="text-xs text-ink-soft">Assinatura da plataforma</p>
          <span
            className={`inline-block mt-2 rounded-full px-2.5 py-1 text-xs font-medium ${
              STATUS_ASSINATURA_STYLE[statusAssinatura] ?? 'bg-paper text-ink-soft'
            }`}
          >
            {STATUS_ASSINATURA_LABEL[statusAssinatura] ?? statusAssinatura}
          </span>
        </div>
      </div>

      {statusAssinatura !== 'ativa' && (
        <p className="mt-4 text-sm text-ink-soft bg-paper border border-border-soft rounded-lg px-4 py-3">
          A ativação e cobrança da assinatura ainda são feitas manualmente enquanto a
          integração com o gateway de pagamento não é finalizada.
        </p>
      )}

      <h2 className="font-medium text-ink mt-10 mb-4">Extrato de sessões</h2>

      {pagamentos.length === 0 && (
        <p className="text-ink-soft">Nenhum pagamento de sessão registrado ainda.</p>
      )}

      <div className="flex flex-col gap-3">
        {pagamentos.map((p) => {
          const agendamento = agendamentoPorId[p.agendamento_id]
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border-soft bg-white p-5"
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  {agendamento ? nomePorColaborador[agendamento.colaborador_profile_id] : 'Colaborador'}
                </p>
                <p className="text-xs text-ink-soft mt-0.5">
                  {agendamento
                    ? new Date(agendamento.data_hora).toLocaleString('pt-BR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-ink">
                  {formatarMoeda(Number(p.valor_total))}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    STATUS_PAGAMENTO_STYLE[p.status] ?? 'bg-paper text-ink-soft'
                  }`}
                >
                  {STATUS_PAGAMENTO_LABEL[p.status] ?? p.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}