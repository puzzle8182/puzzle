import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { BookingForm } from '@/components/booking-form'

export default async function PsicologoPerfilPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: psicologo } = await supabase
    .schema('clinical')
    .from('psicologos_busca')
    .select('id, bio, abordagem, areas_atuacao, valor_sessao, disponibilidade')
    .eq('id', id)
    .single()

  if (!psicologo) notFound()

  const { data: vinculoRows } = await supabase
    .schema('corporate')
    .rpc('get_config_financiamento_colaborador')

  const financiamento = vinculoRows?.[0] ?? null

  return (
    <div className="max-w-2xl">
      <p className="text-xs text-ink-soft uppercase tracking-wide">
        {psicologo.abordagem ?? 'Psicoterapia'}
      </p>
      <h1 className="font-display text-3xl text-ink mt-1">
        Sessão · R$ {psicologo.valor_sessao}
      </h1>
      <p className="text-ink-soft mt-3">{psicologo.bio ?? 'Sem descrição ainda.'}</p>

      {psicologo.areas_atuacao && psicologo.areas_atuacao.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {psicologo.areas_atuacao.map((area: string) => (
            <span
              key={area}
              className="text-xs bg-sage/20 text-pine rounded-full px-3 py-1"
            >
              {area}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 border-t border-border-soft pt-6">
        {financiamento ? (
          <BookingForm
            psicologoId={psicologo.id}
            valorSessao={psicologo.valor_sessao}
            disponibilidade={psicologo.disponibilidade}
          />
        ) : (
          <div className="rounded-lg bg-amber/10 border border-amber/30 px-4 py-3 text-sm text-ink">
            Você ainda não está vinculado a uma empresa na plataforma. Peça
            para o RH da sua empresa te adicionar antes de agendar uma sessão.
          </div>
        )}
      </div>
    </div>
  )
}

