-- ============================================================
-- 0010: Onboarding de empresa
-- Em vez de dar policies de INSERT direto em corporate.empresas
-- e corporate.empresa_admins (o que exigiria lógica de "primeira
-- empresa" espalhada em RLS), usamos funções security definer
-- que encapsulam as regras de negócio num só lugar.
-- ============================================================

-- Cria a empresa e já vincula quem está criando como admin dela,
-- de forma atômica (as duas inserções acontecem juntas ou nenhuma).
create or replace function corporate.criar_empresa(
  p_nome text,
  p_cnpj text,
  p_modalidade text,
  p_percentual numeric
)
returns uuid
language plpgsql
security definer
set search_path = public, corporate
as $$
declare
  v_empresa_id uuid;
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'empresa_admin'
  ) then
    raise exception 'Apenas contas de empresa podem cadastrar uma empresa.';
  end if;

  if exists (select 1 from corporate.empresa_admins where profile_id = auth.uid()) then
    raise exception 'Você já está vinculado a uma empresa.';
  end if;

  insert into corporate.empresas (nome, cnpj, modalidade_financiamento, percentual_coparticipacao_empresa)
  values (p_nome, p_cnpj, p_modalidade, p_percentual)
  returning id into v_empresa_id;

  insert into corporate.empresa_admins (empresa_id, profile_id)
  values (v_empresa_id, auth.uid());

  return v_empresa_id;
end;
$$;

revoke all on function corporate.criar_empresa(text, text, text, numeric) from public;
grant execute on function corporate.criar_empresa(text, text, text, numeric) to authenticated;

-- Vincula um colaborador já cadastrado (por e-mail) à empresa do
-- admin que está chamando a função. Não existe forma direta do
-- cliente consultar auth.users por e-mail — por isso isso precisa
-- ser uma função no servidor.
create or replace function corporate.adicionar_colaborador_por_email(
  p_empresa_id uuid,
  p_email text
)
returns text
language plpgsql
security definer
set search_path = public, corporate
as $$
declare
  v_profile_id uuid;
  v_role public.app_role;
begin
  if not public.is_admin_of_empresa(p_empresa_id) then
    raise exception 'Você não é administrador desta empresa.';
  end if;

  select p.id, p.role into v_profile_id, v_role
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower(p_email);

  if v_profile_id is null then
    return 'nao_encontrado';
  end if;

  if v_role <> 'colaborador' then
    return 'nao_e_colaborador';
  end if;

  insert into corporate.colaboradores_elegiveis (empresa_id, profile_id, ativo)
  values (p_empresa_id, v_profile_id, true)
  on conflict (profile_id) do update set ativo = true, empresa_id = excluded.empresa_id;

  return 'ok';
end;
$$;

revoke all on function corporate.adicionar_colaborador_por_email(uuid, text) from public;
grant execute on function corporate.adicionar_colaborador_por_email(uuid, text) to authenticated;
