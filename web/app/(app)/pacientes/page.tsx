import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function PacientesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'psicologo') {
    redirect('/dashboard')
  }

  const { data: agendamentos } = await supabase
    .schema('core')
    .from('agendamentos')
    .select('colaborador_profile_id')
    .eq('psicologo_id', user.id)

  const colaboradorIds = [
    ...new Set((agendamentos ?? []).map((a) => a.colaborador_profile_id)),
  ]

  let pacientes: { id: string; full_name: string | null; email: string | null }[] = []
  if (colaboradorIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', colaboradorIds)
    pacientes = data ?? []
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Pacientes</h1>
      <p className="text-ink-soft mt-2">
        Colaboradores que já agendaram sessão com você.
      </p>

      {pacientes.length === 0 && (
        <p className="mt-8 text-ink-soft">
          Você ainda não tem nenhuma sessão agendada.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-2">
        {pacientes.map((p) => (
          <Link
            key={p.id}
            href={`/prontuarios/${p.id}`}
            className="block rounded-xl border border-border-soft bg-white p-4 hover:border-sage transition-colors"
          >
            <p className="text-sm font-medium text-ink">{p.full_name ?? 'Sem nome'}</p>
            <p className="text-xs text-ink-soft">{p.email}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

