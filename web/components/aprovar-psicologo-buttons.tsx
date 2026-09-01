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

