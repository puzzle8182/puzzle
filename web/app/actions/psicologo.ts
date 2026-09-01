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
  const arquivo = formData.get('documento') as File | null

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

  const payload: Record<string, unknown> = {
    id: user.id,
    crp,
    bio,
    abordagem,
    areas_atuacao: areasAtuacao,
    valor_sessao: valorSessao,
    disponibilidade,
  }

  // Só mexe no documento se um arquivo novo foi de fato enviado —
  // sem isso, o campo existente não é tocado.
  if (arquivo && arquivo.size > 0) {
    const extensao = arquivo.name.split('.').pop() || 'pdf'
    const caminho = `${user.id}/comprovante.${extensao}`

    const { error: uploadError } = await supabase.storage
      .from('documentos-psicologos')
      .upload(caminho, arquivo, { upsert: true })

    if (uploadError) {
      return { error: 'Erro ao enviar o documento: ' + uploadError.message }
    }

    payload.documento_url = caminho
    // Reenviar o documento pede uma nova análise — o trigger no banco
    // permite essa transição específica mesmo vindo do próprio psicólogo.
    payload.status_verificacao = 'pendente'
  }

  const { error } = await supabase
    .schema('clinical')
    .from('psicologos')
    .upsert(payload, { onConflict: 'id' })

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

