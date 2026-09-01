'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function definirStatusVerificacao(
  psicologoId: string,
  novoStatus: 'aprovado' | 'rejeitado'
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin_plataforma') {
    return { error: 'Apenas o responsável técnico pode fazer isso.' }
  }

  const { error } = await supabase
    .schema('clinical')
    .from('psicologos')
    .update({ status_verificacao: novoStatus })
    .eq('id', psicologoId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/psicologos')
  return { success: true }
}

