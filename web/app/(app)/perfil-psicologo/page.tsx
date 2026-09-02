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
    .select('full_name, email, foto_url, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'psicologo') redirect('/dashboard')

  const { data: perfil } = await supabase
    .schema('clinical')
    .from('psicologos')
    .select(
      'crp, bio, abordagem, areas_atuacao, formacao, anos_experiencia, modalidade_atendimento, cidade, estado, valor_sessao, status_assinatura, status_verificacao, documento_url, disponibilidade'
    )
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-1">Perfil profissional</h1>
      <p className="text-ink-soft mb-8">
        Essas informações aparecem para colaboradores na busca por psicólogos.
      </p>

      <PsicologoProfileForm
        perfil={perfil}
        fotoUrl={profile.foto_url ?? null}
        nome={profile.full_name ?? profile.email ?? 'Você'}
      />
    </div>
  )
}
