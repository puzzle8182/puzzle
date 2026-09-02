'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { criarObjetivo, atualizarStatusObjetivo } from '@/app/actions/objetivos'

type Objetivo = {
  id: string
  descricao: string
  status: 'ativo' | 'concluido' | 'pausado'
  criado_em: string
}

const STATUS_LABEL: Record<Objetivo['status'], string> = {
  ativo: 'Ativo',
  concluido: 'Concluído',
  pausado: 'Pausado',
}

const STATUS_STYLE: Record<Objetivo['status'], string> = {
  ativo: 'bg-sage/20 text-pine',
  concluido: 'bg-pine text-paper',
  pausado: 'bg-paper border border-border-soft text-ink-soft',
}

export function ObjetivosTerapeuticos({
  colaboradorProfileId,
  objetivos,
}: {
  colaboradorProfileId: string
  objetivos: Objetivo[]
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [statusPendenteId, setStatusPendenteId] = useState<string | null>(null)

  const concluidos = objetivos.filter((o) => o.status === 'concluido').length
  const total = objetivos.length
  const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0

  function handleCriar(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await criarObjetivo(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
      router.refresh()
    })
  }

  function handleStatus(objetivoId: string, status: Objetivo['status']) {
    setError(null)
    setStatusPendenteId(objetivoId)
    const formData = new FormData()
    formData.set('objetivoId', objetivoId)
    formData.set('colaboradorProfileId', colaboradorProfileId)
    formData.set('status', status)

    startTransition(async () => {
      const result = await atualizarStatusObjetivo(formData)
      setStatusPendenteId(null)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div>
      {total > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-ink-soft">Progresso dos objetivos</span>
            <span className="font-medium text-ink">
              {concluidos} de {total} concluídos
            </span>
          </div>
          <div className="h-2 rounded-full bg-paper overflow-hidden">
            <div
              className="h-full rounded-full bg-pine transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}

      {objetivos.length === 0 && (
        <p className="text-sm text-ink-soft mb-4">
          Nenhum objetivo terapêutico registrado ainda.
        </p>
      )}

      <ul className="flex flex-col gap-2 mb-5">
        {objetivos.map((o) => (
          <li
            key={o.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border-soft bg-paper px-3.5 py-2.5"
          >
            <span
              className={`text-sm text-ink ${o.status === 'concluido' ? 'line-through text-ink-soft' : ''}`}
            >
              {o.descricao}
            </span>
            <select
              value={o.status}
              disabled={isPending && statusPendenteId === o.id}
              onChange={(e) => handleStatus(o.id, e.target.value as Objetivo['status'])}
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium outline-none ${STATUS_STYLE[o.status]}`}
            >
              {(['ativo', 'concluido', 'pausado'] as const).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>

      <form ref={formRef} action={handleCriar} className="flex gap-2">
        <input type="hidden" name="colaboradorProfileId" value={colaboradorProfileId} />
        <input
          name="descricao"
          type="text"
          placeholder="Novo objetivo terapêutico"
          required
          className="flex-1 rounded-lg border border-border-soft bg-white px-3.5 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-sage"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-pine px-4 py-2 text-sm font-medium text-paper hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}
