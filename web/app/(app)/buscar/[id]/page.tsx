import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { BookingForm } from '@/components/booking-form'
import { Icon } from '@/components/icon'

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
      <div className="rounded-2xl border border-border-soft bg-white p-7">
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

        <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-pine px-5 py-3 text-paper">
          <Icon name="card" width={18} height={18} className="text-sage" />
          <span className="font-display text-xl">Sessão · R$ {psicologo.valor_sessao}</span>
        </div>

        <p className="text-ink-soft mt-5 leading-7">{psicologo.bio ?? 'Sem descrição ainda.'}</p>

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
          <div className="mt-6 rounded-xl border border-border-soft bg-paper p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine/10 text-pine">
                <Icon name="file" width={15} height={15} />
              </span>
              <p className="text-sm font-medium text-ink">Formação</p>
            </div>
            <ul className="flex flex-col gap-1.5 pl-10">
              {psicologo.formacao.map((item: string) => (
                <li key={item} className="text-sm text-ink-soft">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6">
        {financiamento ? (
          <div className="rounded-2xl border border-border-soft bg-white p-7">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage/25 text-pine">
                <Icon name="calendar" width={16} height={16} />
              </span>
              <p className="font-display text-lg text-ink">Agendar sessão</p>
            </div>
            <BookingForm
              psicologoId={psicologo.id}
              valorSessao={psicologo.valor_sessao}
              disponibilidade={psicologo.disponibilidade}
            />
          </div>
        ) : (
          <div className="flex items-start gap-4 rounded-2xl border border-amber/30 bg-amber/10 px-6 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber/20 text-amber">
              <Icon name="shield" width={18} height={18} />
            </span>
            <p className="text-sm text-ink leading-6">
              Você ainda não está vinculado a uma empresa na plataforma. Peça
              para o RH da sua empresa te adicionar antes de agendar uma sessão.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
