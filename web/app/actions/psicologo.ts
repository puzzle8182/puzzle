'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function salvarPerfilPsicologo(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const crp = (formData.get('crp') as string)?.trim()
  const bio = (formData.get('bio') as string)?.trim()
  const abordagem = (formData.get('abordagem') as string)?.trim()
  const areasRaw = (formData.get('areasAtuacao') as string)?.trim()
  const valorSessao = Number(formData.get('valorSessao'))
  const disponibilidadeRaw = formData.get('disponibilidade') as string

  if (!crp) {
    return { error: 'O CRP é obrigatório.' }
  }
  if (!valorSessao || valorSessao <= 0) {
    return { error: 'Informe um valor de sessão válido.' }
  }

  const areasAtuacao = areasRaw
    ? areasRaw.split(',').map((a) => a.trim()).filter(Boolean)
    : []

  let disponibilidade: unknown = []
  try {
    disponibilidade = disponibilidadeRaw ? JSON.parse(disponibilidadeRaw) : []
  } catch {
    disponibilidade = []
  }

  const { error } = await supabase
    .schema('clinical')
    .from('psicologos')
    .upsert(
      {
        id: user.id,
        crp,
        bio,
        abordagem,
        areas_atuacao: areasAtuacao,
        valor_sessao: valorSessao,
        disponibilidade,
      },
      { onConflict: 'id' }
    )

  if (error) {
    if (error.code === '23505') {
      return { error: 'Esse CRP já está cadastrado por outra conta.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/perfil-psicologo')
  return { success: true }
}

