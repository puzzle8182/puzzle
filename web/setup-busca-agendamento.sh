#!/bin/bash
set -e

echo "Criando estrutura de pastas..."
mkdir -p "app/(app)/buscar/[id]" "app/(app)/agendamentos" "app/actions" "components"

echo "Criando app/(app)/buscar/page.tsx..."
cat > "app/(app)/buscar/page.tsx" << 'ENDOFFILE'
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

ENDOFFILE

echo "Criando app/(app)/buscar/[id]/page.tsx..."
cat > "app/(app)/buscar/[id]/page.tsx" << 'ENDOFFILE'
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
    .select('id, bio, abordagem, areas_atuacao, valor_sessao')
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
          <BookingForm psicologoId={psicologo.id} valorSessao={psicologo.valor_sessao} />
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

ENDOFFILE

echo "Criando app/actions/agendamentos.ts..."
cat > "app/actions/agendamentos.ts" << 'ENDOFFILE'
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarAgendamento(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const psicologoId = formData.get('psicologoId') as string
  const dataHora = formData.get('dataHora') as string
  const valorSessao = Number(formData.get('valorSessao'))

  const { data: vinculoRows, error: vinculoError } = await supabase
    .schema('corporate')
    .rpc('get_config_financiamento_colaborador')

  const vinculo = vinculoRows?.[0]

  if (vinculoError || !vinculo) {
    return { error: 'Você não está vinculado a uma empresa na plataforma.' }
  }

  const percentual =
    vinculo.modalidade_financiamento === 'integral'
      ? 100
      : Number(vinculo.percentual_coparticipacao_empresa ?? 0)

  const valorEmpresa = Math.round(((valorSessao * percentual) / 100) * 100) / 100
  const valorColaborador = Math.round((valorSessao - valorEmpresa) * 100) / 100

  const { error } = await supabase
    .schema('core')
    .from('agendamentos')
    .insert({
      psicologo_id: psicologoId,
      colaborador_profile_id: user.id,
      empresa_id: vinculo.empresa_id,
      data_hora: dataHora,
      valor_sessao: valorSessao,
      valor_empresa: valorEmpresa,
      valor_colaborador: valorColaborador,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/agendamentos')
  return { success: true }
}

ENDOFFILE

echo "Criando components/booking-form.tsx..."
cat > "components/booking-form.tsx" << 'ENDOFFILE'
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { criarAgendamento } from '@/app/actions/agendamentos'

export function BookingForm({
  psicologoId,
  valorSessao,
}: {
  psicologoId: string
  valorSessao: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    formData.set('psicologoId', psicologoId)
    formData.set('valorSessao', String(valorSessao))

    startTransition(async () => {
      const result = await criarAgendamento(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      router.push('/agendamentos')
      router.refresh()
    })
  }

  if (success) {
    return <p className="text-sm text-pine font-medium">Sessão agendada com sucesso!</p>
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div>
        <label htmlFor="dataHora" className="text-sm text-ink-soft block mb-1.5">
          Data e horário
        </label>
        <input
          id="dataHora"
          name="dataHora"
          type="datetime-local"
          required
          className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
        />
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3.5 py-2.5">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-pine text-paper py-2.5 font-medium hover:bg-pine-dark transition-colors disabled:opacity-60"
      >
        {isPending ? 'Agendando...' : 'Agendar sessão'}
      </button>
    </form>
  )
}

ENDOFFILE

echo "Criando app/(app)/agendamentos/page.tsx..."
cat > "app/(app)/agendamentos/page.tsx" << 'ENDOFFILE'
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

ENDOFFILE

echo ""
echo "Pronto! Arquivos criados:"
echo "  app/(app)/buscar/page.tsx"
echo "  app/(app)/buscar/[id]/page.tsx"
echo "  app/actions/agendamentos.ts"
echo "  components/booking-form.tsx"
echo "  app/(app)/agendamentos/page.tsx"