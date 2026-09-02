import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { BookingForm } from '@/components/booking-form'

const MODALIDADE_LABEL: Record<string, string> = {
  online: 'Online',
  presencial: 'Presencial',
  hibrido: 'Online e presencial',
}

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
    .select(
      'id, full_name, foto_url, bio, abordagem, areas_atuacao, formacao, anos_experiencia, modalidade_atendimento, cidade, estado, valor_sessao, disponibilidade'
    )
    .eq('id', id)
    .single()

  if (!psicologo) notFound()

  const { data: vinculoRows } = await supabase
    .schema('corporate')
    .rpc('get_config_financiamento_colaborador')

  const financiamento = vinculoRows?.[0] ?? null

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border-soft bg-sage/20">
          {psicologo.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={psicologo.foto_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-xl text-pine">
              {(psicologo.full_name ?? '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-2xl text-ink">
            {psicologo.full_name ?? 'Psicólogo(a)'}
          </h1>
          <p className="text-sm text-ink-soft">{psicologo.abordagem ?? 'Psicoterapia'}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {psicologo.modalidade_atendimento && (
          <span className="rounded-full bg-paper border border-border-soft px-3 py-1 text-xs text-ink-soft">
            {MODALIDADE_LABEL[psicologo.modalidade_atendimento] ?? psicologo.modalidade_atendimento}
          </span>
        )}
        {psicologo.cidade && (
          <span className="rounded-full bg-paper border border-border-soft px-3 py-1 text-xs text-ink-soft">
            {psicologo.cidade}
            {psicologo.estado ? `/${psicologo.estado}` : ''}
          </span>
        )}
        {typeof psicologo.anos_experiencia === 'number' && (
          <span className="rounded-full bg-paper border border-border-soft px-3 py-1 text-xs text-ink-soft">
            {psicologo.anos_experiencia} anos de experiência
          </span>
        )}
      </div>

      <p className="font-display text-2xl text-ink mt-6">
        Sessão · R$ {psicologo.valor_sessao}
      </p>

      <p className="text-ink-soft mt-3 leading-7">{psicologo.bio ?? 'Sem descrição ainda.'}</p>

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

      {psicologo.formacao && psicologo.formacao.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-ink mb-2">Formação</p>
          <ul className="flex flex-col gap-1.5">
            {psicologo.formacao.map((item: string) => (
              <li key={item} className="text-sm text-ink-soft">
                {item}
              </li>
            ))}
          </ul>
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
