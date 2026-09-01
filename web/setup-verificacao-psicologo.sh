#!/bin/bash
set -e

echo "Criando estrutura de pastas..."
mkdir -p "app/(app)/perfil-psicologo" "app/(app)/admin/psicologos" "app/actions" "components"

echo "Atualizando/criando app/actions/psicologo.ts..."
cat > "app/actions/psicologo.ts" << 'ENDOFFILE'
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function salvarPerfilPsicologo(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const crp = (formData.get('crp') as string)?.trim()
  const bio = (formData.get('bio') as string)?.trim()
  const abordagem = (formData.get('abordagem') as string)?.trim()
  const areasRaw = (formData.get('areasAtuacao') as string)?.trim()
  const valorSessao = Number(formData.get('valorSessao'))
  const disponibilidadeRaw = formData.get('disponibilidade') as string
  const arquivo = formData.get('documento') as File | null

  if (!crp) {
    return { error: 'O CRP é obrigatório.' }
  }
  if (!valorSessao || valorSessao <= 0) {
    return { error: 'Informe um valor de sessão válido.' }
  }

  const areasAtuacao = areasRaw
    ? areasRaw.split(',').map((a) => a.trim()).filter(Boolean)
    : []

  let disponibilidade: unknown = []
  try {
    disponibilidade = disponibilidadeRaw ? JSON.parse(disponibilidadeRaw) : []
  } catch {
    disponibilidade = []
  }

  const payload: Record<string, unknown> = {
    id: user.id,
    crp,
    bio,
    abordagem,
    areas_atuacao: areasAtuacao,
    valor_sessao: valorSessao,
    disponibilidade,
  }

  // Só mexe no documento se um arquivo novo foi de fato enviado —
  // sem isso, o campo existente não é tocado.
  if (arquivo && arquivo.size > 0) {
    const extensao = arquivo.name.split('.').pop() || 'pdf'
    const caminho = `${user.id}/comprovante.${extensao}`

    const { error: uploadError } = await supabase.storage
      .from('documentos-psicologos')
      .upload(caminho, arquivo, { upsert: true })

    if (uploadError) {
      return { error: 'Erro ao enviar o documento: ' + uploadError.message }
    }

    payload.documento_url = caminho
    // Reenviar o documento pede uma nova análise — o trigger no banco
    // permite essa transição específica mesmo vindo do próprio psicólogo.
    payload.status_verificacao = 'pendente'
  }

  const { error } = await supabase
    .schema('clinical')
    .from('psicologos')
    .upsert(payload, { onConflict: 'id' })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Esse CRP já está cadastrado por outra conta.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/perfil-psicologo')
  return { success: true }
}

ENDOFFILE

echo "Atualizando/criando components/psicologo-profile-form.tsx..."
cat > "components/psicologo-profile-form.tsx" << 'ENDOFFILE'
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvarPerfilPsicologo } from '@/app/actions/psicologo'

type DisponibilidadeItem = { dia: string; horarios: string[] }

type PerfilExistente = {
  crp: string
  bio: string | null
  abordagem: string | null
  areas_atuacao: string[] | null
  valor_sessao: number
  status_assinatura: string
  status_verificacao: string
  documento_url: string | null
  disponibilidade: DisponibilidadeItem[] | null
} | null

const DIAS = [
  { value: 'seg', label: 'Segunda' },
  { value: 'ter', label: 'Terça' },
  { value: 'qua', label: 'Quarta' },
  { value: 'qui', label: 'Quinta' },
  { value: 'sex', label: 'Sexta' },
  { value: 'sab', label: 'Sábado' },
  { value: 'dom', label: 'Domingo' },
]

const HORARIOS_PADRAO = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
]

const VERIFICACAO_LABEL: Record<string, string> = {
  pendente: 'Em análise',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado — reenvie o documento',
}

function disponibilidadeParaMapa(
  disponibilidade: DisponibilidadeItem[] | null
): Record<string, Set<string>> {
  const mapa: Record<string, Set<string>> = {}
  for (const dia of DIAS) mapa[dia.value] = new Set()
  for (const item of disponibilidade ?? []) {
    if (mapa[item.dia]) {
      for (const h of item.horarios) mapa[item.dia].add(h)
    }
  }
  return mapa
}

export function PsicologoProfileForm({ perfil }: { perfil: PerfilExistente }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [disponibilidade, setDisponibilidade] = useState<Record<string, Set<string>>>(() =>
    disponibilidadeParaMapa(perfil?.disponibilidade ?? null)
  )

  function toggleHorario(dia: string, horario: string) {
    setDisponibilidade((prev) => {
      const novo = { ...prev, [dia]: new Set(prev[dia]) }
      if (novo[dia].has(horario)) {
        novo[dia].delete(horario)
      } else {
        novo[dia].add(horario)
      }
      return novo
    })
  }

  function handleSubmit(formData: FormData) {
    setError(null)

    const disponibilidadeArray: DisponibilidadeItem[] = DIAS.map((dia) => ({
      dia: dia.value,
      horarios: Array.from(disponibilidade[dia.value] ?? []).sort(),
    })).filter((item) => item.horarios.length > 0)

    formData.set('disponibilidade', JSON.stringify(disponibilidadeArray))

    startTransition(async () => {
      const result = await salvarPerfilPsicologo(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  return (
    <div className="max-w-2xl">
      {perfil && (
        <div className="mb-6 flex flex-col gap-2">
          <div className="rounded-lg bg-sage/15 border border-sage/40 px-4 py-3 text-sm text-ink">
            Status da assinatura:{' '}
            <strong className="capitalize">{perfil.status_assinatura}</strong>.{' '}
            {perfil.status_assinatura !== 'ativa' &&
              'Seu perfil só aparece na busca quando a assinatura estiver ativa.'}
          </div>
          <div
            className={`rounded-lg border px-4 py-3 text-sm text-ink ${
              perfil.status_verificacao === 'aprovado'
                ? 'bg-sage/15 border-sage/40'
                : perfil.status_verificacao === 'rejeitado'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber/10 border-amber/30'
            }`}
          >
            Documentação:{' '}
            <strong>{VERIFICACAO_LABEL[perfil.status_verificacao] ?? perfil.status_verificacao}</strong>.{' '}
            {perfil.status_verificacao !== 'aprovado' &&
              'Um responsável técnico precisa aprovar seu CRP antes do seu perfil aparecer na busca.'}
          </div>
        </div>
      )}

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="crp" className="text-sm text-ink-soft block mb-1.5">
            CRP
          </label>
          <input
            id="crp"
            name="crp"
            type="text"
            required
            defaultValue={perfil?.crp ?? ''}
            placeholder="Ex: 06/123456"
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label htmlFor="documento" className="text-sm text-ink-soft block mb-1.5">
            Comprovante do CRP (PDF ou imagem)
          </label>
          {perfil?.documento_url && (
            <p className="text-xs text-ink-soft mb-1.5">
              Documento já enviado. Envie um novo arquivo aqui apenas se quiser substituí-lo.
            </p>
          )}
          <input
            id="documento"
            name="documento"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage file:mr-3 file:rounded-md file:border-0 file:bg-sage/20 file:px-3 file:py-1.5 file:text-pine"
          />
        </div>

        <div>
          <label htmlFor="abordagem" className="text-sm text-ink-soft block mb-1.5">
            Abordagem
          </label>
          <input
            id="abordagem"
            name="abordagem"
            type="text"
            defaultValue={perfil?.abordagem ?? ''}
            placeholder="Ex: Terapia Cognitivo-Comportamental"
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label htmlFor="bio" className="text-sm text-ink-soft block mb-1.5">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={perfil?.bio ?? ''}
            placeholder="Conte um pouco sobre sua prática, para colaboradores que estão escolhendo um psicólogo."
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage resize-none"
          />
        </div>

        <div>
          <label htmlFor="areasAtuacao" className="text-sm text-ink-soft block mb-1.5">
            Áreas de atuação
          </label>
          <input
            id="areasAtuacao"
            name="areasAtuacao"
            type="text"
            defaultValue={perfil?.areas_atuacao?.join(', ') ?? ''}
            placeholder="Separe por vírgula: ansiedade, luto, relacionamentos"
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label htmlFor="valorSessao" className="text-sm text-ink-soft block mb-1.5">
            Valor da sessão (R$)
          </label>
          <input
            id="valorSessao"
            name="valorSessao"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={perfil?.valor_sessao ?? ''}
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label className="text-sm text-ink-soft block mb-2">
            Disponibilidade semanal
          </label>
          <p className="text-xs text-ink-soft mb-3">
            Marque os horários em que você está disponível para atender, em
            cada dia da semana. Colaboradores só conseguem agendar dentro
            desses horários.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border-soft">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-paper">
                  <th className="text-left px-2 py-2 text-ink-soft font-medium">
                    Horário
                  </th>
                  {DIAS.map((dia) => (
                    <th
                      key={dia.value}
                      className="px-2 py-2 text-ink-soft font-medium"
                    >
                      {dia.label.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HORARIOS_PADRAO.map((horario) => (
                  <tr key={horario} className="border-t border-border-soft">
                    <td className="px-2 py-1.5 text-ink-soft">{horario}</td>
                    {DIAS.map((dia) => (
                      <td key={dia.value} className="text-center px-2 py-1.5">
                        <input
                          type="checkbox"
                          checked={disponibilidade[dia.value]?.has(horario) ?? false}
                          onChange={() => toggleHorario(dia.value, horario)}
                          className="accent-pine"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3.5 py-2.5">{error}</p>
        )}
        {success && (
          <p className="text-sm text-pine font-medium">Perfil salvo com sucesso.</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-lg bg-pine text-paper py-2.5 font-medium hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          {isPending ? 'Salvando...' : 'Salvar perfil'}
        </button>
      </form>
    </div>
  )
}

ENDOFFILE

echo "Atualizando/criando app/(app)/perfil-psicologo/page.tsx..."
cat > "app/(app)/perfil-psicologo/page.tsx" << 'ENDOFFILE'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PsicologoProfileForm } from '@/components/psicologo-profile-form'

export default async function PerfilPsicologoPage() {
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

  const { data: perfil } = await supabase
    .schema('clinical')
    .from('psicologos')
    .select(
      'crp, bio, abordagem, areas_atuacao, valor_sessao, status_assinatura, status_verificacao, documento_url, disponibilidade'
    )
    .eq('id', user.id)
    .single()

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Meu perfil profissional</h1>
      <p className="text-ink-soft mt-2">
        Essas informações aparecem para colaboradores na hora de escolher um
        psicólogo.
      </p>

      <div className="mt-8">
        <PsicologoProfileForm perfil={perfil ?? null} />
      </div>
    </div>
  )
}

ENDOFFILE

echo "Atualizando/criando app/actions/admin-psicologos.ts..."
cat > "app/actions/admin-psicologos.ts" << 'ENDOFFILE'
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function definirStatusVerificacao(
  psicologoId: string,
  novoStatus: 'aprovado' | 'rejeitado'
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin_plataforma') {
    return { error: 'Apenas o responsável técnico pode fazer isso.' }
  }

  const { error } = await supabase
    .schema('clinical')
    .from('psicologos')
    .update({ status_verificacao: novoStatus })
    .eq('id', psicologoId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/psicologos')
  return { success: true }
}

ENDOFFILE

echo "Atualizando/criando components/aprovar-psicologo-buttons.tsx..."
cat > "components/aprovar-psicologo-buttons.tsx" << 'ENDOFFILE'
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { definirStatusVerificacao } from '@/app/actions/admin-psicologos'

export function AprovarPsicologoButtons({ psicologoId }: { psicologoId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick(status: 'aprovado' | 'rejeitado') {
    setError(null)
    startTransition(async () => {
      const result = await definirStatusVerificacao(psicologoId, status)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="flex gap-2">
        <button
          onClick={() => handleClick('rejeitado')}
          disabled={isPending}
          className="rounded-lg border border-red-300 text-red-700 px-3 py-1.5 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-60"
        >
          Rejeitar
        </button>
        <button
          onClick={() => handleClick('aprovado')}
          disabled={isPending}
          className="rounded-lg bg-pine text-paper px-3 py-1.5 text-sm font-medium hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          Aprovar
        </button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  )
}

ENDOFFILE

echo "Atualizando/criando app/(app)/admin/psicologos/page.tsx..."
cat > "app/(app)/admin/psicologos/page.tsx" << 'ENDOFFILE'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { AprovarPsicologoButtons } from '@/components/aprovar-psicologo-buttons'

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Em análise',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
}

export default async function AdminPsicologosPage() {
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

  if (profile?.role !== 'admin_plataforma') {
    redirect('/dashboard')
  }

  const { data: psicologos } = await supabase
    .schema('clinical')
    .from('psicologos')
    .select('id, crp, status_verificacao, status_assinatura, documento_url, created_at')
    .order('created_at', { ascending: false })

  const profileIds = (psicologos ?? []).map((p) => p.id)

  let perfilPorId: Record<string, { full_name: string | null; email: string | null }> = {}
  if (profileIds.length > 0) {
    const { data: perfis } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', profileIds)
    perfilPorId = Object.fromEntries((perfis ?? []).map((p) => [p.id, p]))
  }

  // Gera links assinados (o bucket é privado) para o admin conseguir
  // abrir o documento de cada psicólogo que já enviou um.
  const linksDocumento: Record<string, string | null> = {}
  for (const p of psicologos ?? []) {
    if (p.documento_url) {
      const { data } = await supabase.storage
        .from('documentos-psicologos')
        .createSignedUrl(p.documento_url, 60 * 10)
      linksDocumento[p.id] = data?.signedUrl ?? null
    }
  }

  const pendentes = (psicologos ?? []).filter((p) => p.status_verificacao === 'pendente')
  const decididos = (psicologos ?? []).filter((p) => p.status_verificacao !== 'pendente')

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Aprovação de psicólogos</h1>
      <p className="text-ink-soft mt-2">
        Verifique o CRP antes de aprovar — psicólogos só aparecem na busca
        depois de aprovados e com assinatura ativa.
      </p>

      <h2 className="font-display text-lg text-ink mt-8 mb-3">
        Aguardando análise ({pendentes.length})
      </h2>

      {pendentes.length === 0 && (
        <p className="text-ink-soft text-sm">Nenhum psicólogo aguardando aprovação.</p>
      )}

      <div className="flex flex-col gap-3">
        {pendentes.map((p) => {
          const perfil = perfilPorId[p.id]
          return (
            <div
              key={p.id}
              className="rounded-xl border border-border-soft bg-white p-4 flex justify-between items-start gap-4"
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  {perfil?.full_name ?? 'Sem nome'}
                </p>
                <p className="text-xs text-ink-soft">{perfil?.email}</p>
                <p className="text-xs text-ink-soft mt-1">CRP: {p.crp}</p>
                {linksDocumento[p.id] ? (
                  <a
                    href={linksDocumento[p.id]!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-pine font-medium hover:underline mt-1 inline-block"
                  >
                    Ver documento enviado →
                  </a>
                ) : (
                  <p className="text-xs text-amber mt-1">Nenhum documento enviado ainda.</p>
                )}
              </div>
              <AprovarPsicologoButtons psicologoId={p.id} />
            </div>
          )
        })}
      </div>

      <h2 className="font-display text-lg text-ink mt-10 mb-3">Já analisados</h2>

      <div className="flex flex-col gap-2">
        {decididos.map((p) => {
          const perfil = perfilPorId[p.id]
          return (
            <div
              key={p.id}
              className="rounded-lg border border-border-soft bg-white px-4 py-3 flex justify-between items-center"
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  {perfil?.full_name ?? 'Sem nome'}
                </p>
                <p className="text-xs text-ink-soft">CRP: {p.crp}</p>
              </div>
              <span
                className={`text-xs uppercase tracking-wide ${
                  p.status_verificacao === 'aprovado' ? 'text-pine' : 'text-red-700'
                }`}
              >
                {STATUS_LABEL[p.status_verificacao]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

ENDOFFILE

echo ""
echo "Pronto! Arquivos atualizados/criados:"
echo "  app/actions/psicologo.ts"
echo "  components/psicologo-profile-form.tsx"
echo "  app/(app)/perfil-psicologo/page.tsx"
echo "  app/actions/admin-psicologos.ts"
echo "  components/aprovar-psicologo-buttons.tsx"
echo "  app/(app)/admin/psicologos/page.tsx"