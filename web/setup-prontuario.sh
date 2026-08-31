#!/bin/bash
set -e

echo "Criando estrutura de pastas..."
mkdir -p "app/(app)/pacientes" "app/(app)/prontuarios/[colaboradorId]" "app/actions" "components"

echo "Criando app/actions/prontuario.ts..."
cat > "app/actions/prontuario.ts" << 'ENDOFFILE'
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function salvarNotaSessao(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const agendamentoId = formData.get('agendamentoId') as string
  const colaboradorProfileId = formData.get('colaboradorProfileId') as string
  const conteudo = (formData.get('conteudo') as string)?.trim()

  if (!conteudo) {
    return { error: 'Escreva algo antes de salvar.' }
  }

  const { error } = await supabase
    .schema('clinical')
    .from('notas_sessao')
    .upsert(
      {
        agendamento_id: agendamentoId,
        psicologo_id: user.id,
        colaborador_profile_id: colaboradorProfileId,
        conteudo,
      },
      { onConflict: 'agendamento_id' }
    )

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/prontuarios/${colaboradorProfileId}`)
  return { success: true }
}

ENDOFFILE

echo "Criando components/nota-sessao-form.tsx..."
cat > "components/nota-sessao-form.tsx" << 'ENDOFFILE'
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvarNotaSessao } from '@/app/actions/prontuario'

export function NotaSessaoForm({
  agendamentoId,
  colaboradorProfileId,
  conteudoInicial,
}: {
  agendamentoId: string
  colaboradorProfileId: string
  conteudoInicial: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)
    formData.set('agendamentoId', agendamentoId)
    formData.set('colaboradorProfileId', colaboradorProfileId)

    startTransition(async () => {
      const result = await salvarNotaSessao(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-2">
      <textarea
        name="conteudo"
        defaultValue={conteudoInicial}
        rows={4}
        placeholder="Registre suas observações sobre esta sessão..."
        className="w-full rounded-lg border border-border-soft bg-paper px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage resize-none text-sm"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-pine text-paper px-4 py-2 text-sm font-medium hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          {isPending ? 'Salvando...' : 'Salvar nota'}
        </button>
        {error && <p className="text-xs text-red-700">{error}</p>}
        {success && <p className="text-xs text-pine">Salvo.</p>}
      </div>
    </form>
  )
}

ENDOFFILE

echo "Criando app/(app)/pacientes/page.tsx..."
cat > "app/(app)/pacientes/page.tsx" << 'ENDOFFILE'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function PacientesPage() {
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

  const { data: agendamentos } = await supabase
    .schema('core')
    .from('agendamentos')
    .select('colaborador_profile_id')
    .eq('psicologo_id', user.id)

  const colaboradorIds = [
    ...new Set((agendamentos ?? []).map((a) => a.colaborador_profile_id)),
  ]

  let pacientes: { id: string; full_name: string | null; email: string | null }[] = []
  if (colaboradorIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', colaboradorIds)
    pacientes = data ?? []
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Pacientes</h1>
      <p className="text-ink-soft mt-2">
        Colaboradores que já agendaram sessão com você.
      </p>

      {pacientes.length === 0 && (
        <p className="mt-8 text-ink-soft">
          Você ainda não tem nenhuma sessão agendada.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-2">
        {pacientes.map((p) => (
          <Link
            key={p.id}
            href={`/prontuarios/${p.id}`}
            className="block rounded-xl border border-border-soft bg-white p-4 hover:border-sage transition-colors"
          >
            <p className="text-sm font-medium text-ink">{p.full_name ?? 'Sem nome'}</p>
            <p className="text-xs text-ink-soft">{p.email}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

ENDOFFILE

echo "Criando app/(app)/prontuarios/page.tsx..."
cat > "app/(app)/prontuarios/page.tsx" << 'ENDOFFILE'
import { redirect } from 'next/navigation'

export default function ProntuariosIndexPage() {
  redirect('/pacientes')
}

ENDOFFILE

echo "Criando app/(app)/prontuarios/[colaboradorId]/page.tsx..."
cat > "app/(app)/prontuarios/[colaboradorId]/page.tsx" << 'ENDOFFILE'
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

ENDOFFILE

echo ""
echo "Pronto! Arquivos criados:"
echo "  app/actions/prontuario.ts"
echo "  components/nota-sessao-form.tsx"
echo "  app/(app)/pacientes/page.tsx"
echo "  app/(app)/prontuarios/page.tsx"
echo "  app/(app)/prontuarios/[colaboradorId]/page.tsx"