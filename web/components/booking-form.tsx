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

