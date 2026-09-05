'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { adicionarColaborador } from '@/app/actions/empresa'

export function AdicionarColaboradorForm({ empresaId }: { empresaId: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [sucessoTipo, setSucessoTipo] = useState<'vinculado' | 'convite' | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    setSucessoTipo(null)
    formData.set('empresaId', empresaId)

    startTransition(async () => {
      const result = await adicionarColaborador(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setSucessoTipo(result?.tipo ?? 'vinculado')
      formRef.current?.reset()
      router.refresh()
    })
  }

  return (
    <div className="max-w-md">
      <form ref={formRef} action={handleSubmit} className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="email@colaborador.com"
          className="flex-1 rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-pine text-paper px-4 py-2.5 font-medium hover:bg-pine-dark transition-colors disabled:opacity-60 shrink-0"
        >
          {isPending ? 'Adicionando...' : 'Adicionar'}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-700 bg-red-50 rounded-lg px-3.5 py-2.5">
          {error}
        </p>
      )}
      {sucessoTipo === 'vinculado' && (
        <p className="mt-3 text-sm text-pine font-medium">
          Colaborador vinculado com sucesso.
        </p>
      )}
      {sucessoTipo === 'convite' && (
        <p className="mt-3 text-sm text-amber bg-amber/10 rounded-lg px-3.5 py-2.5">
          Essa pessoa ainda não tem conta na plataforma. Um convite foi
          registrado — assim que ela se cadastrar com esse e-mail escolhendo
          &quot;Sou colaborador&quot;, será vinculada à empresa automaticamente.
        </p>
      )}
    </div>
  )
}