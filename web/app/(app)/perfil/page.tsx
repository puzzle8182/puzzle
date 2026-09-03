import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { AvatarUpload } from '@/components/avatar-upload'
import { Icon } from '@/components/icon'

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

      <div className="mt-8 rounded-2xl border border-border-soft bg-white p-7">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pine/10 text-pine">
            <Icon name="settings" width={16} height={16} />
          </span>
          <p className="text-sm font-medium text-ink">Dados pessoais</p>
        </div>

        <AvatarUpload fotoUrl={profile?.foto_url ?? null} nome={nome} />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-paper p-4">
            <p className="text-sm text-ink-soft mb-1">Nome</p>
            <p className="font-medium text-ink">{profile?.full_name ?? 'Não informado'}</p>
          </div>
          <div className="rounded-xl bg-paper p-4">
            <p className="text-sm text-ink-soft mb-1">E-mail</p>
            <p className="font-medium text-ink">{profile?.email ?? 'Não informado'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
