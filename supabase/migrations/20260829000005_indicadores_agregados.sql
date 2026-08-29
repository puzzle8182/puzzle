-- ============================================================
-- 0005: Indicadores agregados para a empresa
-- Única porta de acesso do ambiente corporativo a qualquer dado
-- derivado de sessões. Nunca retorna linhas individuais.
-- O limite mínimo de grupo (HAVING >= 5) fica DENTRO da função,
-- não é uma regra "de boa prática" no frontend — se alguém
-- chamar essa função diretamente via API, a proteção já está lá.
-- ============================================================

create or replace function corporate.get_indicadores_empresa(
  target_empresa_id uuid,
  competencia_inicio date,
  competencia_fim date
)
returns table (
  colaboradores_elegiveis int,
  colaboradores_ativos int,
  sessoes_realizadas int,
  valor_total_financiado numeric,
  taxa_continuidade numeric -- % de colaboradores com mais de 1 sessão no período
)
language plpgsql
security definer
set search_path = public, corporate, core
as $$
begin
  -- Trava de segurança: só o admin da própria empresa (ou admin_plataforma)
  -- pode chamar essa função, mesmo sendo security definer.
  if not (public.is_admin_of_empresa(target_empresa_id) or public.is_admin_plataforma()) then
    raise exception 'Acesso negado: usuário não é administrador desta empresa';
  end if;

  return query
  with sessoes as (
    select a.colaborador_profile_id, a.valor_empresa, a.valor_colaborador
    from core.agendamentos a
    where a.empresa_id = target_empresa_id
      and a.status = 'realizado'
      and a.data_hora::date between competencia_inicio and competencia_fim
  ),
  contagem_por_colaborador as (
    select colaborador_profile_id, count(*) as n_sessoes
    from sessoes
    group by colaborador_profile_id
  )
  select
    (select count(*)::int from corporate.colaboradores_elegiveis ce where ce.empresa_id = target_empresa_id),
    (select count(*)::int from corporate.colaboradores_elegiveis ce where ce.empresa_id = target_empresa_id and ce.ativo),
    (select count(*)::int from sessoes),
    (select coalesce(sum(valor_empresa + valor_colaborador), 0) from sessoes),
    case
      -- Proteção contra reidentificação: só calcula e retorna a taxa
      -- se houver pelo menos 5 colaboradores distintos com sessão no período.
      -- Abaixo disso, retorna NULL em vez de um número que poderia expor
      -- comportamento individual em equipes pequenas.
      when (select count(*) from contagem_por_colaborador) >= 5
        then round(
          100.0 * (select count(*) from contagem_por_colaborador where n_sessoes > 1)
          / nullif((select count(*) from contagem_por_colaborador), 0),
          1
        )
      else null
    end;
end;
$$;

-- Só authenticated pode chamar; a checagem de "é admin desta empresa?" acontece
-- dentro da função, então não precisamos (e não devemos) expor a tabela
-- core.agendamentos diretamente para o papel empresa_admin.
revoke all on function corporate.get_indicadores_empresa(uuid, date, date) from public;
grant execute on function corporate.get_indicadores_empresa(uuid, date, date) to authenticated;
