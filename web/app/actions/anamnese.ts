'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function salvarAnamnese(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const colaboradorProfileId = formData.get('colaboradorProfileId') as string

  // A RLS já impede um psicólogo de gravar anamnese de colaborador que não é
  // seu (a policy usa auth.uid() = psicologo_id), mas confirmar o papel aqui
  // dá uma mensagem de erro mais clara do que deixar a RLS barrar silenciosamente.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'psicologo') {
    return { error: 'Apenas psicólogos podem registrar anamnese.' }
  }

  const campos = {
    colaborador_profile_id: colaboradorProfileId,
    psicologo_id: user.id,
    data_nascimento: (formData.get('dataNascimento') as string) || null,
    telefone: (formData.get('telefone') as string)?.trim() || null,
    estado_civil: (formData.get('estadoCivil') as string)?.trim() || null,
    profissao: (formData.get('profissao') as string)?.trim() || null,
    queixa_principal: (formData.get('queixaPrincipal') as string)?.trim() || null,
    historia_clinica: (formData.get('historiaClinica') as string)?.trim() || null,
    historia_familiar: (formData.get('historiaFamiliar') as string)?.trim() || null,
    historia_laboral: (formData.get('historiaLaboral') as string)?.trim() || null,
    rede_apoio: (formData.get('redeApoio') as string)?.trim() || null,
    objetivos_terapeuticos: (formData.get('objetivosTerapeuticos') as string)?.trim() || null,
    intercorrencias_iniciais: (formData.get('intercorrenciasIniciais') as string)?.trim() || null,
  }

  if (!campos.queixa_principal) {
    return { error: 'A queixa principal é obrigatória.' }
  }

  // upsert por (colaborador_profile_id, psicologo_id): uma única anamnese por
  // par colaborador+psicólogo, editável depois (constraint adicionada na
  // migration 20260902020000).
  const { error } = await supabase
    .schema('clinical')
    .from('anamneses')
    .upsert(campos, { onConflict: 'colaborador_profile_id,psicologo_id' })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/prontuarios/${colaboradorProfileId}`)
  return { success: true }
}
