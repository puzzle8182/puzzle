'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarEmpresa(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const nome = (formData.get('nome') as string)?.trim()
  const cnpj = (formData.get('cnpj') as string)?.trim()
  const modalidade = formData.get('modalidade') as string
  const percentualRaw = formData.get('percentual') as string

  if (!nome || !cnpj) {
    return { error: 'Preencha nome e CNPJ.' }
  }

  const percentual =
    modalidade === 'coparticipacao' ? Number(percentualRaw) : null

  if (modalidade === 'coparticipacao' && (!percentual || percentual <= 0 || percentual > 100)) {
    return { error: 'Informe um percentual de coparticipação entre 1 e 100.' }
  }

  const { error } = await supabase.schema('corporate').rpc('criar_empresa', {
    p_nome: nome,
    p_cnpj: cnpj,
    p_modalidade: modalidade,
    p_percentual: percentual,
  })

  if (error) {
    if (error.message.includes('duplicate') || error.code === '23505') {
      return { error: 'Já existe uma empresa cadastrada com esse CNPJ.' }
    }
    return { error: error.message }
  }

  revalidatePath('/colaboradores')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function adicionarColaborador(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const empresaId = formData.get('empresaId') as string
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    return { error: 'Informe um e-mail.' }
  }

  const { data, error } = await supabase
    .schema('corporate')
    .rpc('adicionar_colaborador_por_email', {
      p_empresa_id: empresaId,
      p_email: email,
    })

  if (error) {
    return { error: error.message }
  }

  if (data === 'nao_encontrado') {
    return {
      error:
        'Nenhuma conta encontrada com esse e-mail. Peça para a pessoa se cadastrar na plataforma primeiro, escolhendo "Sou colaborador".',
    }
  }

  if (data === 'nao_e_colaborador') {
    return { error: 'Essa conta não está cadastrada como colaborador.' }
  }

  revalidatePath('/colaboradores')
  return { success: true }
}

