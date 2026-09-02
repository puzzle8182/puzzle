import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { AvatarUpload } from '@/components/avatar-upload'

export default async function PerfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, foto_url')
    .eq('id', user.id)
    .single()

  const nome = profile?.full_name ?? profile?.email ?? 'Você'

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl text-ink">Meu perfil</h1>
      <p className="text-ink-soft mt-2">
        Sua foto aparece para o psicólogo que te acompanha, dentro do prontuário.
      </p>

      <div className="mt-8 rounded-xl border border-border-soft bg-white p-6">
        <AvatarUpload fotoUrl={profile?.foto_url ?? null} nome={nome} />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-ink-soft mb-1">Nome</p>
            <p className="font-medium text-ink">{profile?.full_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-ink-soft mb-1">E-mail</p>
            <p className="font-medium text-ink">{profile?.email ?? '—'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
