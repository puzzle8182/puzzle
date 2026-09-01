import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PsicologoProfileForm } from '@/components/psicologo-profile-form'

export default async function PerfilPsicologoPage() {
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

  const { data: perfil } = await supabase
    .schema('clinical')
    .from('psicologos')
    .select(
      'crp, bio, abordagem, areas_atuacao, valor_sessao, status_assinatura, status_verificacao, documento_url, disponibilidade'
    )
    .eq('id', user.id)
    .single()

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Meu perfil profissional</h1>
      <p className="text-ink-soft mt-2">
        Essas informações aparecem para colaboradores na hora de escolher um
        psicólogo.
      </p>

      <div className="mt-8">
        <PsicologoProfileForm perfil={perfil ?? null} />
      </div>
    </div>
  )
}

