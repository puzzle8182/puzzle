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

