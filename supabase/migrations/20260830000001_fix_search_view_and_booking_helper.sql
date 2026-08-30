-- ============================================================
-- 0009: Corrige view de busca pública + helper de rateio
-- ============================================================

-- CORREÇÃO: a view original usava security_invoker = true, o que
-- faz ela herdar a RLS de clinical.psicologos (que só permite cada
-- psicólogo ver o próprio registro). Isso fazia a busca pública
-- retornar vazio para qualquer colaborador. Recriando sem essa opção,
-- a view roda com o dono (postgres), que ignora a RLS da tabela base
-- — a própria WHERE clause da view já limita o que é exposto
-- (só perfis visíveis e com assinatura ativa).
drop view if exists clinical.psicologos_busca;

create view clinical.psicologos_busca as
select
  id,
  crp,
  bio,
  abordagem,
  areas_atuacao,
  valor_sessao,
  disponibilidade
from clinical.psicologos
where perfil_visivel = true
  and status_assinatura = 'ativa';

grant select on clinical.psicologos_busca to authenticated;

-- ============================================================
-- Helper: retorna a empresa e a modalidade de financiamento do
-- colaborador autenticado, para calcular o rateio da sessão na
-- hora de agendar. Sem isso, o colaborador não tem como saber
-- (nem o app tem como calcular) quanto a empresa cobre.
-- ============================================================
create or replace function corporate.get_config_financiamento_colaborador()
returns table (
  empresa_id uuid,
  modalidade_financiamento text,
  percentual_coparticipacao_empresa numeric
)
language sql
security definer
stable
set search_path = public, corporate
as $$
  select e.id, e.modalidade_financiamento, e.percentual_coparticipacao_empresa
  from corporate.empresas e
  join corporate.colaboradores_elegiveis ce on ce.empresa_id = e.id
  where ce.profile_id = auth.uid() and ce.ativo = true
  limit 1;
$$;

revoke all on function corporate.get_config_financiamento_colaborador() from public;
grant execute on function corporate.get_config_financiamento_colaborador() to authenticated;
