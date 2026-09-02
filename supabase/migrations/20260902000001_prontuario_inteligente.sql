-- =============================================================================
-- MIGRATION: Prontuário Inteligente (portado do Puzzle 1.0 para Puzzle 2.0)
-- =============================================================================
--
-- ORIGEM: micaelsonnen/Puzzle (1.0) — tabelas anamneses, hipoteses_diagnosticas,
-- intercorrencias, avaliacoes, autorizacoes_suporte, função existe_autorizacao_ativa()
--
-- Verificado contra o schema real do 2.0 antes de escrever este arquivo:
--   - public.profiles (id uuid = auth.uid(), role enum: empresa_admin,
--     colaborador, psicologo, admin_plataforma)
--   - core.agendamentos (colaborador_profile_id, psicologo_id, status text
--     com CHECK: 'agendado' | 'realizado' | 'cancelado' | 'remarcado')
--   - clinical.notas_sessao já usa o padrão colaborador_profile_id
--
-- Todas as tabelas novas abaixo seguem esse mesmo padrão de nomenclatura.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. TABELAS CLÍNICAS (schema `clinical`)
-- -----------------------------------------------------------------------------

create table if not exists clinical.anamneses (
    id uuid primary key default gen_random_uuid(),
    colaborador_profile_id uuid not null references public.profiles(id) on delete cascade,
    psicologo_id uuid not null references public.profiles(id) on delete restrict,
    data_nascimento date,
    telefone text,
    estado_civil text,
    profissao text,
    queixa_principal text,
    historia_clinica text,
    historia_familiar text,
    historia_laboral text,
    rede_apoio text,
    objetivos_terapeuticos text,
    intercorrencias_iniciais text,
    criado_em timestamptz default now(),
    atualizado_em timestamptz default now()
);

create table if not exists clinical.hipoteses_diagnosticas (
    id uuid primary key default gen_random_uuid(),
    colaborador_profile_id uuid not null references public.profiles(id) on delete cascade,
    psicologo_id uuid not null references public.profiles(id) on delete restrict,
    cid text,
    descricao text,
    ativa boolean default true,
    criado_em timestamptz default now()
);

create table if not exists clinical.intercorrencias (
    id uuid primary key default gen_random_uuid(),
    colaborador_profile_id uuid not null references public.profiles(id) on delete cascade,
    psicologo_id uuid not null references public.profiles(id) on delete restrict,
    data date not null default current_date,
    descricao text not null,
    gravidade text default 'leve',
    visivel_colaborador boolean default false,
    criado_em timestamptz default now()
);

create table if not exists clinical.autorizacoes_suporte (
    id uuid primary key default gen_random_uuid(),
    psicologo_id uuid not null references public.profiles(id) on delete restrict,
    colaborador_profile_id uuid not null references public.profiles(id) on delete cascade,
    motivo text not null,
    status text default 'ativa',
    criado_em timestamptz default now(),
    expira_em timestamptz not null default (now() + interval '7 days'),
    revogada_em timestamptz
);

create table if not exists core.avaliacoes (
    id uuid primary key default gen_random_uuid(),
    psicologo_id uuid not null references public.profiles(id) on delete cascade,
    colaborador_profile_id uuid not null references public.profiles(id) on delete cascade,
    nota integer not null check (nota between 1 and 5),
    comentario text,
    criado_em timestamptz default now()
);

grant usage on schema clinical to authenticated;
grant usage on schema core to authenticated;

grant select, insert on clinical.anamneses to authenticated;
grant select, insert on clinical.hipoteses_diagnosticas to authenticated;
grant select, insert on clinical.intercorrencias to authenticated;
grant select, insert, update on clinical.autorizacoes_suporte to authenticated;
grant select, insert, update, delete on core.avaliacoes to authenticated;

create or replace function clinical.existe_autorizacao_ativa(p_colaborador_profile_id uuid)
returns boolean
language sql
stable security definer
set search_path = clinical
as $$
  select exists (
    select 1 from clinical.autorizacoes_suporte
    where colaborador_profile_id = p_colaborador_profile_id
      and status = 'ativa'
      and expira_em > now()
  );
$$;

alter table clinical.anamneses enable row level security;
alter table clinical.hipoteses_diagnosticas enable row level security;
alter table clinical.intercorrencias enable row level security;
alter table clinical.autorizacoes_suporte enable row level security;
alter table core.avaliacoes enable row level security;

create policy colaborador_ve_propria_anamnese
on clinical.anamneses for select
using (auth.uid() = colaborador_profile_id);

create policy psicologo_gerencia_anamneses_dos_seus_colaboradores
on clinical.anamneses for all
using (auth.uid() = psicologo_id)
with check (auth.uid() = psicologo_id);

create policy admin_ve_anamneses_autorizadas
on clinical.anamneses for select
using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin_plataforma')
    and clinical.existe_autorizacao_ativa(colaborador_profile_id)
);

create policy colaborador_ve_proprias_hipoteses
on clinical.hipoteses_diagnosticas for select
using (auth.uid() = colaborador_profile_id);

create policy psicologo_ve_hipoteses_dos_seus_colaboradores
on clinical.hipoteses_diagnosticas for select
using (auth.uid() = psicologo_id);

create policy psicologo_insere_hipoteses
on clinical.hipoteses_diagnosticas for insert
with check (auth.uid() = psicologo_id);

create policy admin_ve_hipoteses_autorizadas
on clinical.hipoteses_diagnosticas for select
using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin_plataforma')
    and clinical.existe_autorizacao_ativa(colaborador_profile_id)
);

create policy colaborador_ve_intercorrencias_visiveis
on clinical.intercorrencias for select
using (auth.uid() = colaborador_profile_id and visivel_colaborador = true);

create policy psicologo_gerencia_intercorrencias_dos_seus_colaboradores
on clinical.intercorrencias for all
using (auth.uid() = psicologo_id)
with check (auth.uid() = psicologo_id);

create policy admin_ve_intercorrencias_autorizadas
on clinical.intercorrencias for select
using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin_plataforma')
    and clinical.existe_autorizacao_ativa(colaborador_profile_id)
);

create policy psicologo_gerencia_suas_autorizacoes
on clinical.autorizacoes_suporte for all
using (auth.uid() = psicologo_id)
with check (auth.uid() = psicologo_id);

create policy admin_ve_autorizacoes
on clinical.autorizacoes_suporte for select
using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin_plataforma')
);

create policy colaborador_ve_autorizacoes_sobre_si
on clinical.autorizacoes_suporte for select
using (auth.uid() = colaborador_profile_id);

create policy colaborador_ve_proprias_avaliacoes
on core.avaliacoes for select
using (auth.uid() = colaborador_profile_id);

create policy colaborador_avalia_apos_sessao_realizada
on core.avaliacoes for insert
with check (
    auth.uid() = colaborador_profile_id
    and exists (
        select 1 from core.agendamentos a
        where a.colaborador_profile_id = avaliacoes.colaborador_profile_id
          and a.psicologo_id = avaliacoes.psicologo_id
          and a.status = 'realizado'
    )
);

create policy colaborador_edita_propria_avaliacao
on core.avaliacoes for update
using (auth.uid() = colaborador_profile_id);

create policy colaborador_apaga_propria_avaliacao
on core.avaliacoes for delete
using (auth.uid() = colaborador_profile_id);
