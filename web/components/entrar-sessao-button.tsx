'use client'

import Link from 'next/link'

export function EntrarSessaoButton({
  agendamentoId,
  dataHora,
  status,
}: {
  agendamentoId: string
  dataHora: string
  status: string
}) {
  if (status !== 'agendado') return null

  const inicioJanela = new Date(dataHora).getTime() - 15 * 60 * 1000
  const disponivel = Date.now() >= inicioJanela

  if (!disponivel) {
    return (
      <span className="rounded-full bg-paper border border-border-soft px-3 py-1.5 text-xs text-ink-soft">
        Disponível 15 min antes
      </span>
    )
  }

  return (
    <Link
      href={`/sala-video/${agendamentoId}`}
      className="rounded-full bg-pine px-4 py-1.5 text-xs font-medium text-paper hover:bg-pine-dark transition-colors"
    >
      Entrar na sessão
    </Link>
  )
}