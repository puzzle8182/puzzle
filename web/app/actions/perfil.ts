'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function salvarFotoPerfil(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const arquivo = formData.get('foto') as File | null

  if (!arquivo || arquivo.size === 0) {
    return { error: 'Selecione uma imagem.' }
  }
  if (!arquivo.type.startsWith('image/')) {
    return { error: 'Envie um arquivo de imagem (JPG ou PNG).' }
  }
  if (arquivo.size > 5 * 1024 * 1024) {
    return { error: 'A imagem deve ter até 5MB.' }
  }

  const extensao = arquivo.name.split('.').pop() || 'jpg'
  const caminho = `${user.id}/avatar.${extensao}`

  const { error: uploadError } = await supabase.storage
    .from('fotos-perfil')
    .upload(caminho, arquivo, { upsert: true })

  if (uploadError) {
    return { error: 'Erro ao enviar a foto: ' + uploadError.message }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('fotos-perfil').getPublicUrl(caminho)

  // cache-bust: sem isso, o navegador continua mostrando a foto antiga
  // em cache mesmo depois de trocar o arquivo (mesmo caminho, mesmo nome).
  const fotoUrl = `${publicUrl}?v=${Date.now()}`

  const { error } = await supabase
    .from('profiles')
    .update({ foto_url: fotoUrl })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/perfil')
  revalidatePath('/perfil-psicologo')
  revalidatePath('/buscar')
  revalidatePath('/pacientes')

  return { success: true, fotoUrl }
}
