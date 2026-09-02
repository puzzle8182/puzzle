'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']

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

  // Validação de disponibilidade — a fonte de verdade é sempre o servidor,
  // não o que o formulário mostrou (alguém poderia chamar a Server Action
  // direto, sem passar pelo seletor de horários da UI).
  const { data: psicologoData } = await supabase
    .schema('clinical')
    .from('psicologos_busca')
    .select('disponibilidade')
    .eq('id', psicologoId)
    .single()

  const disponibilidade = psicologoData?.disponibilidade as
    | { dia: string; horarios: string[] }[]
    | null

  if (!disponibilidade || disponibilidade.length === 0) {
    return { error: 'Este psicólogo ainda não cadastrou horários de disponibilidade.' }
  }

  const dataObj = new Date(dataHora)
  const diaEscolhido = DIAS_SEMANA[dataObj.getDay()]
  const horaEscolhida = `${String(dataObj.getHours()).padStart(2, '0')}:${String(
    dataObj.getMinutes()
  ).padStart(2, '0')}`

  const entradaDia = disponibilidade.find((d) => d.dia === diaEscolhido)
  const disponivel = entradaDia?.horarios?.includes(horaEscolhida)

  if (!disponivel) {
    return {
      error:
        'O psicólogo não está disponível nesse dia/horário. Escolha um horário na lista de disponibilidade.',
    }
  }

  // Checagem prévia de conflito de horário. Isso cobre o caso comum (dá uma
  // mensagem clara antes de tentar inserir), mas NÃO é a proteção real contra
  // condição de corrida — essa vem da constraint única no banco
  // (agendamentos_sem_conflito_horario). Se dois colaboradores confirmarem ao
  // mesmo tempo, os dois podem passar por esta checagem; só o banco garante
  // que apenas um INSERT vai vencer.
  const { data: conflitantes } = await supabase
    .schema('core')
    .from('agendamentos')
    .select('id')
    .eq('psicologo_id', psicologoId)
    .eq('data_hora', dataHora)
    .not('status', 'in', '(cancelado,remarcado)')
    .limit(1)

  if (conflitantes && conflitantes.length > 0) {
    return {
      error: 'Esse horário acabou de ser reservado por outro colaborador. Escolha outro horário.',
    }
  }

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
    // Rede de segurança contra condição de corrida: se a checagem prévia
    // passou pros dois colaboradores mas o banco só aceitou um INSERT, o
    // Postgres retorna o código 23505 (unique_violation). Traduzimos isso
    // pra uma mensagem compreensível em vez de mostrar o erro cru do banco.
    if (error.code === '23505') {
      return {
        error: 'Esse horário acabou de ser reservado por outro colaborador. Escolha outro horário.',
      }
    }
    return { error: error.message }
  }

  revalidatePath('/agendamentos')
  return { success: true }
}
