'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarAgendamento(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Você precisa estar logado.' }
  }

  const psicologoId = formData.get('psicologoId') as string
  const dataHora = formData.get('dataHora') as string
  const valorSessao = Number(formData.get('valorSessao'))

  const { data: vinculoRows, error: vinculoError } = await supabase
    .schema('corporate')
    .rpc('get_config_financiamento_colaborador')

  const vinculo = vinculoRows?.[0]

  if (vinculoError || !vinculo) {
    return { error: 'Você não está vinculado a uma empresa na plataforma.' }
  }

  const percentual =
    vinculo.modalidade_financiamento === 'integral'
      ? 100
      : Number(vinculo.percentual_coparticipacao_empresa ?? 0)

  const valorEmpresa = Math.round(((valorSessao * percentual) / 100) * 100) / 100
  const valorColaborador = Math.round((valorSessao - valorEmpresa) * 100) / 100

  const { error } = await supabase
    .schema('core')
    .from('agendamentos')
    .insert({
      psicologo_id: psicologoId,
      colaborador_profile_id: user.id,
      empresa_id: vinculo.empresa_id,
      data_hora: dataHora,
      valor_sessao: valorSessao,
      valor_empresa: valorEmpresa,
      valor_colaborador: valorColaborador,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/agendamentos')
  return { success: true }
}

