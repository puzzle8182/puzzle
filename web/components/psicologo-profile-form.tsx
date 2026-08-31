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

