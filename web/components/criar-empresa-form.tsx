'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { criarEmpresa } from '@/app/actions/empresa'

export function CriarEmpresaForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [modalidade, setModalidade] = useState<'integral' | 'coparticipacao'>('integral')

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await criarEmpresa(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="max-w-lg">
      <p className="text-ink-soft mb-6">
        Cadastre sua empresa para começar a financiar o benefício e adicionar
        colaboradores.
      </p>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="nome" className="text-sm text-ink-soft block mb-1.5">
            Nome da empresa
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label htmlFor="cnpj" className="text-sm text-ink-soft block mb-1.5">
            CNPJ
          </label>
          <input
            id="cnpj"
            name="cnpj"
            type="text"
            required
            placeholder="00.000.000/0001-00"
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label className="text-sm text-ink-soft block mb-2">
            Modalidade de financiamento
          </label>
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-3 rounded-lg border border-border-soft bg-white px-4 py-3 cursor-pointer has-[:checked]:border-pine has-[:checked]:bg-sage/10">
              <input
                type="radio"
                name="modalidade"
                value="integral"
                checked={modalidade === 'integral'}
                onChange={() => setModalidade('integral')}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-ink">Custeio integral</span>
                <span className="block text-xs text-ink-soft mt-0.5">
                  A empresa paga 100% das sessões.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-lg border border-border-soft bg-white px-4 py-3 cursor-pointer has-[:checked]:border-pine has-[:checked]:bg-sage/10">
              <input
                type="radio"
                name="modalidade"
                value="coparticipacao"
                checked={modalidade === 'coparticipacao'}
                onChange={() => setModalidade('coparticipacao')}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-ink">Coparticipação</span>
                <span className="block text-xs text-ink-soft mt-0.5">
                  Empresa e colaborador dividem o valor da sessão.
                </span>
              </span>
            </label>
          </div>
        </div>

        {modalidade === 'coparticipacao' && (
          <div>
            <label htmlFor="percentual" className="text-sm text-ink-soft block mb-1.5">
              Percentual coberto pela empresa (%)
            </label>
            <input
              id="percentual"
              name="percentual"
              type="number"
              min="1"
              max="100"
              required
              placeholder="Ex: 50"
              className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3.5 py-2.5">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-lg bg-pine text-paper py-2.5 font-medium hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          {isPending ? 'Salvando...' : 'Cadastrar empresa'}
        </button>
      </form>
    </div>
  )
}

