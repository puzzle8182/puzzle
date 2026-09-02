import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

const MODALIDADE_LABEL: Record<string, string> = {
  online: 'Online',
  presencial: 'Presencial',
  hibrido: 'Online e presencial',
}

export default async function BuscarPage() {
  const supabase = await createClient()

  const { data: psicologos } = await supabase
    .schema('clinical')
    .from('psicologos_busca')
    .select(
      'id, full_name, foto_url, bio, abordagem, areas_atuacao, anos_experiencia, modalidade_atendimento, cidade, estado, valor_sessao'
    )
    .order('valor_sessao', { ascending: true })

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Encontre seu psicólogo</h1>
      <p className="text-ink-soft mt-2">
        Escolha livremente quem você quer para te acompanhar.
      </p>

      {(!psicologos || psicologos.length === 0) && (
        <p className="mt-8 text-ink-soft">
          Ainda não há psicólogos disponíveis na rede. Volte em breve.
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {psicologos?.map((p) => (
          <Link
            key={p.id}
            href={`/buscar/${p.id}`}
            className="block rounded-xl border border-border-soft bg-white p-5 hover:border-sage transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border-soft bg-sage/20">
                {p.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.foto_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-sm text-pine">
                    {(p.full_name ?? '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-ink truncate">{p.full_name ?? 'Psicólogo(a)'}</p>
                <p className="text-xs text-ink-soft truncate">
                  {p.abordagem ?? 'Psicoterapia'}
                </p>
              </div>
            </div>

            <p className="font-display text-lg text-ink mt-4">
              Sessão · R$ {p.valor_sessao}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.modalidade_atendimento && (
                <span className="rounded-full bg-paper border border-border-soft px-2.5 py-0.5 text-xs text-ink-soft">
                  {MODALIDADE_LABEL[p.modalidade_atendimento] ?? p.modalidade_atendimento}
                </span>
              )}
              {p.cidade && (
                <span className="rounded-full bg-paper border border-border-soft px-2.5 py-0.5 text-xs text-ink-soft">
                  {p.cidade}
                  {p.estado ? `/${p.estado}` : ''}
                </span>
              )}
              {typeof p.anos_experiencia === 'number' && (
                <span className="rounded-full bg-paper border border-border-soft px-2.5 py-0.5 text-xs text-ink-soft">
                  {p.anos_experiencia} anos de experiência
                </span>
              )}
            </div>

            <p className="text-sm text-ink-soft mt-3 line-clamp-3">
              {p.bio ?? 'Sem descrição ainda.'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
