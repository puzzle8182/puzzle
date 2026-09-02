'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvarPerfilPsicologo } from '@/app/actions/psicologo'
import { AvatarUpload } from '@/components/avatar-upload'
import { Icon } from '@/components/icon'

type DisponibilidadeItem = { dia: string; horarios: string[] }

type PerfilExistente = {
  crp: string
  bio: string | null
  abordagem: string | null
  areas_atuacao: string[] | null
  formacao: string[] | null
  anos_experiencia: number | null
  modalidade_atendimento: string | null
  cidade: string | null
  estado: string | null
  valor_sessao: number
  status_assinatura: string
  status_verificacao: string
  documento_url: string | null
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

const MODALIDADES = [
  { value: '', label: 'Não informado' },
  { value: 'online', label: 'Online' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido (online e presencial)' },
]

const VERIFICACAO_LABEL: Record<string, string> = {
  pendente: 'Em análise',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado — reenvie o documento',
}

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

export function PsicologoProfileForm({
  perfil,
  fotoUrl,
  nome,
}: {
  perfil: PerfilExistente
  fotoUrl: string | null
  nome: string
}) {
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
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex items-start gap-3.5 rounded-2xl border border-sage/40 bg-sage/15 px-5 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage/25 text-pine">
              <Icon name="card" width={16} height={16} />
            </span>
            <p className="text-sm text-ink leading-6">
              Status da assinatura:{' '}
              <strong className="capitalize">{perfil.status_assinatura}</strong>.{' '}
              {perfil.status_assinatura !== 'ativa' &&
                'Seu perfil só aparece na busca quando a assinatura estiver ativa.'}
            </p>
          </div>
          <div
            className={`flex items-start gap-3.5 rounded-2xl border px-5 py-4 ${
              perfil.status_verificacao === 'aprovado'
                ? 'bg-sage/15 border-sage/40'
                : perfil.status_verificacao === 'rejeitado'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber/10 border-amber/30'
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                perfil.status_verificacao === 'aprovado'
                  ? 'bg-sage/25 text-pine'
                  : perfil.status_verificacao === 'rejeitado'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber/20 text-amber'
              }`}
            >
              <Icon name="shield" width={16} height={16} />
            </span>
            <p className="text-sm text-ink leading-6">
              Documentação:{' '}
              <strong>{VERIFICACAO_LABEL[perfil.status_verificacao] ?? perfil.status_verificacao}</strong>.{' '}
              {perfil.status_verificacao !== 'aprovado' &&
                'Um responsável técnico precisa aprovar seu CRP antes do seu perfil aparecer na busca.'}
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-border-soft bg-white p-6">
        <p className="text-sm text-ink-soft mb-3">
          Foto de perfil — aparece para colaboradores na busca.
        </p>
        <AvatarUpload fotoUrl={fotoUrl} nome={nome} />
      </div>

      <form action={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border-soft bg-white p-6 sm:p-7">
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
          <label htmlFor="documento" className="text-sm text-ink-soft block mb-1.5">
            Comprovante do CRP (PDF ou imagem)
          </label>
          {perfil?.documento_url && (
            <p className="text-xs text-ink-soft mb-1.5">
              Documento já enviado. Envie um novo arquivo aqui apenas se quiser substituí-lo.
            </p>
          )}
          <input
            id="documento"
            name="documento"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage file:mr-3 file:rounded-md file:border-0 file:bg-sage/20 file:px-3 file:py-1.5 file:text-pine"
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
          <label htmlFor="formacao" className="text-sm text-ink-soft block mb-1.5">
            Formação acadêmica
          </label>
          <textarea
            id="formacao"
            name="formacao"
            rows={3}
            defaultValue={perfil?.formacao?.join('\n') ?? ''}
            placeholder={'Uma formação por linha, ex:\nGraduação em Psicologia — USP (2015)\nEspecialização em TCC — PUC-SP (2018)'}
            className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage resize-none"
          />
        </div>

        <div>
          <label htmlFor="areasAtuacao" className="text-sm text-ink-soft block mb-1.5">
            Especialidades / áreas de atuação
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="anosExperiencia" className="text-sm text-ink-soft block mb-1.5">
              Anos de experiência
            </label>
            <input
              id="anosExperiencia"
              name="anosExperiencia"
              type="number"
              min="0"
              max="70"
              defaultValue={perfil?.anos_experiencia ?? ''}
              className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label htmlFor="modalidadeAtendimento" className="text-sm text-ink-soft block mb-1.5">
              Modalidade de atendimento
            </label>
            <select
              id="modalidadeAtendimento"
              name="modalidadeAtendimento"
              defaultValue={perfil?.modalidade_atendimento ?? ''}
              className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
            >
              {MODALIDADES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-4">
          <div>
            <label htmlFor="cidade" className="text-sm text-ink-soft block mb-1.5">
              Cidade
            </label>
            <input
              id="cidade"
              name="cidade"
              type="text"
              defaultValue={perfil?.cidade ?? ''}
              placeholder="Ex: Belo Horizonte"
              className="w-full rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label htmlFor="estado" className="text-sm text-ink-soft block mb-1.5">
              UF
            </label>
            <input
              id="estado"
              name="estado"
              type="text"
              maxLength={2}
              defaultValue={perfil?.estado ?? ''}
              placeholder="MG"
              className="w-20 rounded-lg border border-border-soft bg-white px-3.5 py-2.5 text-ink uppercase outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
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
          <div className="overflow-x-auto rounded-xl border border-border-soft">
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
