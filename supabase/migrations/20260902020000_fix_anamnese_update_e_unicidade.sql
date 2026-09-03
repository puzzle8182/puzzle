-- =============================================================================
-- MIGRATION: Corrige privilégio de UPDATE e adiciona unicidade em anamneses
-- =============================================================================
--
-- A migration anterior (prontuario_inteligente) concedeu apenas select+insert
-- em clinical.anamneses, mas a tabela tem uma coluna atualizado_em, indicando
-- que ela deveria ser editável. A RLS já permite (a policy do psicólogo é
-- FOR ALL), mas faltava o GRANT — sem ele, um UPDATE falha mesmo passando
-- pela RLS.

grant update on clinical.anamneses to authenticated;

-- Sem uma constraint de unicidade, não é possível usar upsert (mesmo padrão
-- já usado em notas_sessao) e nada impede duas anamneses para o mesmo par
-- colaborador+psicólogo.
alter table clinical.anamneses
  add constraint anamneses_colaborador_psicologo_unique
  unique (colaborador_profile_id, psicologo_id);

-- Mantém atualizado_em correto automaticamente, em vez de depender do
-- código da aplicação lembrar de setar esse campo a cada UPDATE.
create or replace function clinical.set_anamnese_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger anamneses_atualizado_em
before update on clinical.anamneses
for each row
execute function clinical.set_anamnese_atualizado_em();
