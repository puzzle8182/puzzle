import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function BuscarPage() {
  const supabase = await createClient()

  const { data: psicologos } = await supabase
    .schema('clinical')
    .from('psicologos_busca')
    .select('id, bio, abordagem, areas_atuacao, valor_sessao')
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
            <p className="text-xs text-ink-soft uppercase tracking-wide">
              {p.abordagem ?? 'Psicoterapia'}
            </p>
            <p className="font-display text-lg text-ink mt-1">
              Sessão · R$ {p.valor_sessao}
            </p>
            <p className="text-sm text-ink-soft mt-2 line-clamp-3">
              {p.bio ?? 'Sem descrição ainda.'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

