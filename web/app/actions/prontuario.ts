'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function salvarNotaSessao(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const agendamentoId = formData.get('agendamentoId') as string
  const colaboradorProfileId = formData.get('colaboradorProfileId') as string
  const conteudo = (formData.get('conteudo') as string)?.trim()

  if (!conteudo) {
    return { error: 'Escreva algo antes de salvar.' }
  }

  const { error } = await supabase
    .schema('clinical')
    .from('notas_sessao')
    .upsert(
      {
        agendamento_id: agendamentoId,
        psicologo_id: user.id,
        colaborador_profile_id: colaboradorProfileId,
        conteudo,
      },
      { onConflict: 'agendamento_id' }
    )

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/prontuarios/${colaboradorProfileId}`)
  return { success: true }
}

