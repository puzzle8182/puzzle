'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

const STATUS_VALIDOS = ['ativo', 'concluido', 'pausado']

export async function criarObjetivo(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const colaboradorProfileId = formData.get('colaboradorProfileId') as string
  const descricao = (formData.get('descricao') as string)?.trim()

  if (!colaboradorProfileId) {
    return { error: 'Paciente não identificado.' }
  }
  if (!descricao) {
    return { error: 'Descreva o objetivo terapêutico.' }
  }

  const { error } = await supabase
    .schema('clinical')
    .from('objetivos_terapeuticos')
    .insert({
      psicologo_id: user.id,
      colaborador_profile_id: colaboradorProfileId,
      descricao,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/prontuarios/${colaboradorProfileId}`)
  revalidatePath('/pacientes')
  return { success: true }
}

export async function atualizarStatusObjetivo(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const objetivoId = formData.get('objetivoId') as string
  const colaboradorProfileId = formData.get('colaboradorProfileId') as string
  const status = formData.get('status') as string

  if (!STATUS_VALIDOS.includes(status)) {
    return { error: 'Status inválido.' }
  }

  const { error } = await supabase
    .schema('clinical')
    .from('objetivos_terapeuticos')
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq('id', objetivoId)
    .eq('psicologo_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/prontuarios/${colaboradorProfileId}`)
  revalidatePath('/pacientes')
  return { success: true }
}
