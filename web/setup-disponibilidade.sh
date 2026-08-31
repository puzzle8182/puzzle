#!/bin/bash
set -e

echo "Criando estrutura de pastas..."
mkdir -p "app/(app)/perfil-psicologo" "app/(app)/buscar/[id]" "app/actions" "components"

echo "Atualizando app/actions/psicologo.ts..."
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

  const { error } = await supabase
    .schema('clinical')
    .from('psicologos')
    .upsert(
      {
        id: user.id,
        crp,
        bio,
        abordagem,
        areas_atuacao: areasAtuacao,
        valor_sessao: valorSessao,
        disponibilidade,
      },
      { onConflict: 'id' }
    )

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

echo "Atualizando components/psicologo-profile-form.tsx..."
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
        <div className="mb-6 rounded-lg bg-sage/15 border border-sage/40 px-4 py-3 text-sm text-ink">
          Status da assinatura:{' '}
          <strong className="capitalize">{perfil.status_assinatura}</strong>.{' '}
          {perfil.status_assinatura !== 'ativa' &&
            'Seu perfil só aparece na busca de colaboradores quando a assinatura estiver ativa.'}
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

echo "Atualizando app/(app)/perfil-psicologo/page.tsx..."
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
      'crp, bio, abordagem, areas_atuacao, valor_sessao, status_assinatura, disponibilidade'
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

echo "Atualizando components/booking-form.tsx..."
cat > "components/booking-form.tsx" << 'ENDOFFILE'
'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { criarAgendamento } from '@/app/actions/agendamentos'

type DisponibilidadeItem = { dia: string; horarios: string[] }

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
const DIA_LABEL: Record<string, string> = {
  dom: 'domingo',
  seg: 'segunda',
  ter: 'terça',
  qua: 'quarta',
  qui: 'quinta',
  sex: 'sexta',
  sab: 'sábado',
}

export function BookingForm({
  psicologoId,
  valorSessao,
  disponibilidade,
}: {
  psicologoId: string
  valorSessao: number
  disponibilidade: DisponibilidadeItem[] | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [data, setData] = useState('')
  const [horario, setHorario] = useState('')

  const diaSemanaEscolhido = useMemo(() => {
    if (!data) return null
    const [ano, mes, dia] = data.split('-').map(Number)
    const d = new Date(ano, mes - 1, dia)
    return DIAS_SEMANA[d.getDay()]
  }, [data])

  const horariosDoDia = useMemo(() => {
    if (!diaSemanaEscolhido || !disponibilidade) return []
    const entrada = disponibilidade.find((item) => item.dia === diaSemanaEscolhido)
    return entrada?.horarios?.slice().sort() ?? []
  }, [diaSemanaEscolhido, disponibilidade])

  function handleSubmit(formData: FormData) {
    setError(null)

    if (!data || !horario) {
      setError('Escolha uma data e um horário disponível.')
      return
    }

    formData.set('psicologoId', psicologoId)
    formData.set('valorSessao', String(valorSessao))
    formData.set('dataHora', `${data}T${horario}`)

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

  if (!disponibilidade || disponibilidade.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        Este psicólogo ainda não cadastrou horários de disponibilidade.
      </p>
    )
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div>
        <label htmlFor="data" className="text-sm text-ink-soft block mb-1.5">
          Data
        </label>
        <input
          id="data"
          type="date"
          required
          value={data}
          onChange={(e) => {
            setData(e.target.value)
            setHorario('')
          }}
          min={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
        />
      </div>

      {data && (
        <div>
          <label htmlFor="horario" className="text-sm text-ink-soft block mb-1.5">
            Horário
          </label>
          {horariosDoDia.length > 0 ? (
            <select
              id="horario"
              required
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
            >
              <option value="">Selecione um horário</option>
              {horariosDoDia.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-ink-soft">
              Sem horários disponíveis{' '}
              {diaSemanaEscolhido && `neste dia (${DIA_LABEL[diaSemanaEscolhido]})`}. Escolha
              outra data.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3.5 py-2.5">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || !horario}
        className="rounded-lg bg-pine text-paper py-2.5 font-medium hover:bg-pine-dark transition-colors disabled:opacity-60"
      >
        {isPending ? 'Agendando...' : 'Agendar sessão'}
      </button>
    </form>
  )
}

ENDOFFILE

echo "Atualizando app/(app)/buscar/[id]/page.tsx..."
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

ENDOFFILE

echo "Atualizando app/actions/agendamentos.ts..."
cat > "app/actions/agendamentos.ts" << 'ENDOFFILE'
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']

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

  // Validação de disponibilidade — a fonte de verdade é sempre o servidor,
  // não o que o formulário mostrou (alguém poderia chamar a Server Action
  // direto, sem passar pelo seletor de horários da UI).
  const { data: psicologoData } = await supabase
    .schema('clinical')
    .from('psicologos_busca')
    .select('disponibilidade')
    .eq('id', psicologoId)
    .single()

  const disponibilidade = psicologoData?.disponibilidade as
    | { dia: string; horarios: string[] }[]
    | null

  if (!disponibilidade || disponibilidade.length === 0) {
    return { error: 'Este psicólogo ainda não cadastrou horários de disponibilidade.' }
  }

  const dataObj = new Date(dataHora)
  const diaEscolhido = DIAS_SEMANA[dataObj.getDay()]
  const horaEscolhida = `${String(dataObj.getHours()).padStart(2, '0')}:${String(
    dataObj.getMinutes()
  ).padStart(2, '0')}`

  const entradaDia = disponibilidade.find((d) => d.dia === diaEscolhido)
  const disponivel = entradaDia?.horarios?.includes(horaEscolhida)

  if (!disponivel) {
    return {
      error:
        'O psicólogo não está disponível nesse dia/horário. Escolha um horário na lista de disponibilidade.',
    }
  }

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

echo ""
echo "Pronto! Arquivos atualizados:"
echo "  app/actions/psicologo.ts"
echo "  components/psicologo-profile-form.tsx"
echo "  app/(app)/perfil-psicologo/page.tsx"
echo "  components/booking-form.tsx"
echo "  app/(app)/buscar/[id]/page.tsx"
echo "  app/actions/agendamentos.ts"