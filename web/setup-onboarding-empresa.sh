#!/bin/bash
set -e

echo "Criando estrutura de pastas..."
mkdir -p "app/(app)/colaboradores" "app/actions" "components"

echo "Criando app/actions/empresa.ts..."
cat > "app/actions/empresa.ts" << 'ENDOFFILE'
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarEmpresa(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const nome = (formData.get('nome') as string)?.trim()
  const cnpj = (formData.get('cnpj') as string)?.trim()
  const modalidade = formData.get('modalidade') as string
  const percentualRaw = formData.get('percentual') as string

  if (!nome || !cnpj) {
    return { error: 'Preencha nome e CNPJ.' }
  }

  const percentual =
    modalidade === 'coparticipacao' ? Number(percentualRaw) : null

  if (modalidade === 'coparticipacao' && (!percentual || percentual <= 0 || percentual > 100)) {
    return { error: 'Informe um percentual de coparticipação entre 1 e 100.' }
  }

  const { error } = await supabase.schema('corporate').rpc('criar_empresa', {
    p_nome: nome,
    p_cnpj: cnpj,
    p_modalidade: modalidade,
    p_percentual: percentual,
  })

  if (error) {
    if (error.message.includes('duplicate') || error.code === '23505') {
      return { error: 'Já existe uma empresa cadastrada com esse CNPJ.' }
    }
    return { error: error.message }
  }

  revalidatePath('/colaboradores')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function adicionarColaborador(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const empresaId = formData.get('empresaId') as string
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    return { error: 'Informe um e-mail.' }
  }

  const { data, error } = await supabase
    .schema('corporate')
    .rpc('adicionar_colaborador_por_email', {
      p_empresa_id: empresaId,
      p_email: email,
    })

  if (error) {
    return { error: error.message }
  }

  if (data === 'nao_encontrado') {
    return {
      error:
        'Nenhuma conta encontrada com esse e-mail. Peça para a pessoa se cadastrar na plataforma primeiro, escolhendo "Sou colaborador".',
    }
  }

  if (data === 'nao_e_colaborador') {
    return { error: 'Essa conta não está cadastrada como colaborador.' }
  }

  revalidatePath('/colaboradores')
  return { success: true }
}

ENDOFFILE

echo "Criando components/criar-empresa-form.tsx..."
cat > "components/criar-empresa-form.tsx" << 'ENDOFFILE'
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { criarEmpresa } from '@/app/actions/empresa'

export function CriarEmpresaForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [modalidade, setModalidade] = useState<'integral' | 'coparticipacao'>('integral')

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await criarEmpresa(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="max-w-lg">
      <p className="text-ink-soft mb-6">
        Cadastre sua empresa para começar a financiar o benefício e adicionar
        colaboradores.
      </p>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="nome" className="text-sm text-ink-soft block mb-1.5">
            Nome da empresa
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label htmlFor="cnpj" className="text-sm text-ink-soft block mb-1.5">
            CNPJ
          </label>
          <input
            id="cnpj"
            name="cnpj"
            type="text"
            required
            placeholder="00.000.000/0001-00"
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label className="text-sm text-ink-soft block mb-2">
            Modalidade de financiamento
          </label>
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-3 rounded-lg border border-border-soft bg-white px-4 py-3 cursor-pointer has-[:checked]:border-pine has-[:checked]:bg-sage/10">
              <input
                type="radio"
                name="modalidade"
                value="integral"
                checked={modalidade === 'integral'}
                onChange={() => setModalidade('integral')}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-ink">Custeio integral</span>
                <span className="block text-xs text-ink-soft mt-0.5">
                  A empresa paga 100% das sessões.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-lg border border-border-soft bg-white px-4 py-3 cursor-pointer has-[:checked]:border-pine has-[:checked]:bg-sage/10">
              <input
                type="radio"
                name="modalidade"
                value="coparticipacao"
                checked={modalidade === 'coparticipacao'}
                onChange={() => setModalidade('coparticipacao')}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-ink">Coparticipação</span>
                <span className="block text-xs text-ink-soft mt-0.5">
                  Empresa e colaborador dividem o valor da sessão.
                </span>
              </span>
            </label>
          </div>
        </div>

        {modalidade === 'coparticipacao' && (
          <div>
            <label htmlFor="percentual" className="text-sm text-ink-soft block mb-1.5">
              Percentual coberto pela empresa (%)
            </label>
            <input
              id="percentual"
              name="percentual"
              type="number"
              min="1"
              max="100"
              required
              placeholder="Ex: 50"
              className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3.5 py-2.5">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-lg bg-pine text-paper py-2.5 font-medium hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          {isPending ? 'Salvando...' : 'Cadastrar empresa'}
        </button>
      </form>
    </div>
  )
}

ENDOFFILE

echo "Criando components/adicionar-colaborador-form.tsx..."
cat > "components/adicionar-colaborador-form.tsx" << 'ENDOFFILE'
'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { adicionarColaborador } from '@/app/actions/empresa'

export function AdicionarColaboradorForm({ empresaId }: { empresaId: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)
    formData.set('empresaId', empresaId)

    startTransition(async () => {
      const result = await adicionarColaborador(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      formRef.current?.reset()
      router.refresh()
    })
  }

  return (
    <div className="max-w-md">
      <form ref={formRef} action={handleSubmit} className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="email@colaborador.com"
          className="flex-1 rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-pine text-paper px-4 py-2.5 font-medium hover:bg-pine-dark transition-colors disabled:opacity-60 shrink-0"
        >
          {isPending ? 'Adicionando...' : 'Adicionar'}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-700 bg-red-50 rounded-lg px-3.5 py-2.5">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 text-sm text-pine font-medium">
          Colaborador adicionado com sucesso.
        </p>
      )}
    </div>
  )
}

ENDOFFILE

echo "Criando app/(app)/colaboradores/page.tsx..."
cat > "app/(app)/colaboradores/page.tsx" << 'ENDOFFILE'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CriarEmpresaForm } from '@/components/criar-empresa-form'
import { AdicionarColaboradorForm } from '@/components/adicionar-colaborador-form'

const MODALIDADE_LABEL: Record<string, string> = {
  integral: 'Custeio integral',
  coparticipacao: 'Coparticipação',
}

export default async function ColaboradoresPage() {
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

  if (profile?.role !== 'empresa_admin') {
    redirect('/dashboard')
  }

  const { data: vinculo } = await supabase
    .schema('corporate')
    .from('empresa_admins')
    .select('empresa_id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!vinculo) {
    return (
      <div>
        <h1 className="font-display text-3xl text-ink">Cadastre sua empresa</h1>
        <div className="mt-8">
          <CriarEmpresaForm />
        </div>
      </div>
    )
  }

  const { data: empresa } = await supabase
    .schema('corporate')
    .from('empresas')
    .select('id, nome, cnpj, modalidade_financiamento, percentual_coparticipacao_empresa')
    .eq('id', vinculo.empresa_id)
    .single()

  const { data: colaboradores } = await supabase
    .schema('corporate')
    .from('colaboradores_elegiveis')
    .select('id, profile_id, ativo, created_at')
    .eq('empresa_id', vinculo.empresa_id)
    .order('created_at', { ascending: false })

  const profileIds = (colaboradores ?? []).map((c) => c.profile_id)

  let perfilPorId: Record<string, { full_name: string | null; email: string | null }> = {}
  if (profileIds.length > 0) {
    const { data: perfis } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', profileIds)

    perfilPorId = Object.fromEntries((perfis ?? []).map((p) => [p.id, p]))
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">{empresa?.nome}</h1>
      <p className="text-ink-soft mt-2">
        {empresa && MODALIDADE_LABEL[empresa.modalidade_financiamento]}
        {empresa?.modalidade_financiamento === 'coparticipacao' &&
          ` · empresa cobre ${empresa.percentual_coparticipacao_empresa}%`}
      </p>

      <div className="mt-8">
        <h2 className="font-display text-lg text-ink mb-3">Adicionar colaborador</h2>
        <AdicionarColaboradorForm empresaId={vinculo.empresa_id} />
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg text-ink mb-3">
          Colaboradores ({colaboradores?.length ?? 0})
        </h2>

        {(!colaboradores || colaboradores.length === 0) && (
          <p className="text-ink-soft text-sm">Nenhum colaborador adicionado ainda.</p>
        )}

        <div className="flex flex-col gap-2">
          {colaboradores?.map((c) => {
            const perfil = perfilPorId[c.profile_id]
            return (
              <div
                key={c.id}
                className="rounded-lg border border-border-soft bg-white px-4 py-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {perfil?.full_name ?? 'Sem nome'}
                  </p>
                  <p className="text-xs text-ink-soft">{perfil?.email}</p>
                </div>
                <span
                  className={`text-xs uppercase tracking-wide ${
                    c.ativo ? 'text-pine' : 'text-ink-soft'
                  }`}
                >
                  {c.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

ENDOFFILE

echo ""
echo "Pronto! Arquivos criados:"
echo "  app/actions/empresa.ts"
echo "  components/criar-empresa-form.tsx"
echo "  components/adicionar-colaborador-form.tsx"
echo "  app/(app)/colaboradores/page.tsx"