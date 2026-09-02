'use client'

import { useRef, useState, useTransition } from 'react'
import { salvarFotoPerfil } from '@/app/actions/perfil'

function iniciaisDe(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  return partes
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function AvatarUpload({
  fotoUrl,
  nome,
}: {
  fotoUrl: string | null
  nome: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(fotoUrl)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    setError(null)
    const previewLocal = URL.createObjectURL(arquivo)
    setPreview(previewLocal)

    const formData = new FormData()
    formData.set('foto', arquivo)

    startTransition(async () => {
      const result = await salvarFotoPerfil(formData)
      if (result?.error) {
        setError(result.error)
        setPreview(fotoUrl)
        return
      }
      if (result?.fotoUrl) setPreview(result.fotoUrl)
    })

    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border-soft bg-sage/20">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-xl text-pine">
            {iniciaisDe(nome)}
          </div>
        )}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/40 text-[10px] text-paper">
            Enviando...
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-medium text-pine hover:text-pine-dark transition-colors"
        >
          {preview ? 'Trocar foto' : 'Adicionar foto'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFile}
          className="hidden"
        />
        <p className="mt-1 text-xs text-ink-soft">JPG, PNG ou WebP, até 5MB.</p>
        {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      </div>
    </div>
  )
}
