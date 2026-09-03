'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvarAnamnese } from '@/app/actions/anamnese'

type Anamnese = {
  data_nascimento: string | null
  telefone: string | null
  estado_civil: string | null
  profissao: string | null
  queixa_principal: string | null
  historia_clinica: string | null
  historia_familiar: string | null
  historia_laboral: string | null
  rede_apoio: string | null
  objetivos_terapeuticos: string | null
  intercorrencias_iniciais: string | null
} | null

const CAMPOS_TEXTAREA: { name: string; label: string; campo: keyof NonNullable<Anamnese> }[] = [
  { name: 'queixaPrincipal', label: 'Queixa principal *', campo: 'queixa_principal' },
  { name: 'historiaClinica', label: 'História clínica', campo: 'historia_clinica' },
  { name: 'historiaFamiliar', label: 'História familiar', campo: 'historia_familiar' },
  { name: 'historiaLaboral', label: 'História laboral', campo: 'historia_laboral' },
  { name: 'redeApoio', label: 'Rede de apoio', campo: 'rede_apoio' },
  {
    name: 'objetivosTerapeuticos',
    label: 'Objetivos terapêuticos (texto livre da entrada)',
    campo: 'objetivos_terapeuticos',
  },
  {
    name: 'intercorrenciasIniciais',
    label: 'Intercorrências iniciais',
    campo: 'intercorrencias_iniciais',
  },
]

export function AnamneseForm({
  colaboradorProfileId,
  anamnese,
}: {
  colaboradorProfileId: string
  anamnese: Anamnese
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await salvarAnamnese(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="colaboradorProfileId" value={colaboradorProfileId} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-sm text-ink-soft">
          Data de nascimento
          <input
            type="date"
            name="dataNascimento"
            defaultValue={anamnese?.data_nascimento ?? ''}
            className="rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-soft">
          Telefone
          <input
            type="text"
            name="telefone"
            defaultValue={anamnese?.telefone ?? ''}
            className="rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-soft">
          Estado civil
          <input
            type="text"
            name="estadoCivil"
            defaultValue={anamnese?.estado_civil ?? ''}
            className="rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-ink-soft">
        Profissão
        <input
          type="text"
          name="profissao"
          defaultValue={anamnese?.profissao ?? ''}
          className="rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-sage"
        />
      </label>

      {CAMPOS_TEXTAREA.map((c) => (
        <label key={c.name} className="flex flex-col gap-1 text-sm text-ink-soft">
          {c.label}
          <textarea
            name={c.name}
            rows={3}
            defaultValue={anamnese?.[c.campo] ?? ''}
            className="rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-sage resize-y"
          />
        </label>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-pine px-4 py-2 text-sm font-medium text-paper hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          {isPending ? 'Salvando...' : 'Salvar anamnese'}
        </button>
        {success && <span className="text-sm text-pine">Salvo com sucesso.</span>}
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  )
}
