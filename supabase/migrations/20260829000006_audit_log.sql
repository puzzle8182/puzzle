-- ============================================================
-- 0006: Log de auditoria para dado clínico
-- IMPORTANTE: Postgres não dispara triggers em SELECT. Isso cobre
-- automaticamente inserts/updates/deletes em prontuário. O log de
-- LEITURA (quem acessou qual prontuário e quando) precisa ser feito
-- na camada de aplicação/Edge Function, chamando
-- core.registrar_acesso_clinico() explicitamente a cada leitura.
-- ============================================================

create table if not exists core.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id),
  acao text not null check (acao in ('insert', 'update', 'delete', 'select')),
  tabela text not null,
  registro_id uuid not null,
  detalhe jsonb,
  criado_em timestamptz not null default now()
);

alter table core.audit_log enable row level security;

-- Só admin_plataforma consulta o log de auditoria (para investigação de incidentes)
create policy "audit_log_select_admin"
  on core.audit_log for select
  using (public.is_admin_plataforma());

-- Trigger genérica para insert/update/delete em tabelas clínicas
create or replace function core.log_clinical_write()
returns trigger
language plpgsql
security definer
set search_path = public, core
as $$
begin
  insert into core.audit_log (actor_profile_id, acao, tabela, registro_id, detalhe)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_schema || '.' || tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_notas_sessao on clinical.notas_sessao;
create trigger trg_audit_notas_sessao
  after insert or update or delete on clinical.notas_sessao
  for each row execute function core.log_clinical_write();

drop trigger if exists trg_audit_objetivos on clinical.objetivos_terapeuticos;
create trigger trg_audit_objetivos
  after insert or update or delete on clinical.objetivos_terapeuticos
  for each row execute function core.log_clinical_write();

-- Função a ser chamada pela aplicação (Edge Function) toda vez que
-- um psicólogo ABRE/LÊ um prontuário — isso não acontece sozinho.
create or replace function core.registrar_acesso_clinico(
  p_tabela text,
  p_registro_id uuid
)
returns void
language sql
security definer
set search_path = public, core
as $$
  insert into core.audit_log (actor_profile_id, acao, tabela, registro_id)
  values (auth.uid(), 'select', p_tabela, p_registro_id);
$$;

grant execute on function core.registrar_acesso_clinico(text, uuid) to authenticated;
