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

