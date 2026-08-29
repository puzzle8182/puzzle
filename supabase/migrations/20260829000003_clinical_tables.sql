-- ============================================================
-- 0003: Schema CLINICAL
-- Regra de ouro: nenhuma policy aqui concede select para
-- empresa_admin. A ausência de policy já bloqueia por padrão
-- (RLS é deny-by-default), mas deixamos isso explícito nos
-- comentários de cada tabela como lembrete de arquitetura.
-- ============================================================

create table if not exists clinical.psicologos (
  id uuid primary key references public.profiles(id) on delete cascade,
  crp text not null unique,
  bio text,
  abordagem text,
  areas_atuacao text[],
  valor_sessao numeric not null,
  disponibilidade jsonb, -- ex: [{ "dia": "seg", "horarios": ["09:00","10:00"] }]
  status_assinatura text not null default 'pendente'
    check (status_assinatura in ('ativa', 'inadimplente', 'cancelada', 'pendente')),
  perfil_visivel boolean not null default true, -- controla aparição na busca
  created_at timestamptz not null default now()
);

create table if not exists clinical.notas_sessao (
  id uuid primary key default gen_random_uuid(),
  agendamento_id uuid not null, -- FK para core.agendamentos adicionada na migration 0005, após essa tabela existir
  psicologo_id uuid not null references clinical.psicologos(id) on delete cascade,
  colaborador_profile_id uuid not null references public.profiles(id) on delete cascade,
  conteudo text not null, -- registro narrativo da sessão
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists clinical.objetivos_terapeuticos (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references clinical.psicologos(id) on delete cascade,
  colaborador_profile_id uuid not null references public.profiles(id) on delete cascade,
  descricao text not null,
  status text not null default 'ativo' check (status in ('ativo', 'concluido', 'pausado')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table clinical.psicologos enable row level security;
alter table clinical.notas_sessao enable row level security;
alter table clinical.objetivos_terapeuticos enable row level security;

-- PSICOLOGOS: o próprio psicólogo gerencia seu perfil completo (todas as colunas)
create policy "psicologos_select_own"
  on clinical.psicologos for select
  using (id = auth.uid() or public.is_admin_plataforma());

create policy "psicologos_update_own"
  on clinical.psicologos for update
  using (id = auth.uid());

create policy "psicologos_insert_own"
  on clinical.psicologos for insert
  with check (id = auth.uid());

-- View pública de BUSCA: só colunas não-sensíveis, para colaboradores escolherem
-- o profissional. Isso evita ter que dar SELECT direto na tabela para todo mundo.
create or replace view clinical.psicologos_busca
with (security_invoker = true) as
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

-- NOTAS_SESSAO: só o psicólogo dono do registro tem acesso. Nem o colaborador,
-- nem a empresa, nem admin_plataforma (que só deve poder atuar em suporte técnico
-- pontual e auditado, não em leitura livre de prontuário).
create policy "notas_sessao_only_owner_psicologo"
  on clinical.notas_sessao for all
  using (psicologo_id = auth.uid())
  with check (psicologo_id = auth.uid());

-- OBJETIVOS_TERAPEUTICOS: mesma regra
create policy "objetivos_only_owner_psicologo"
  on clinical.objetivos_terapeuticos for all
  using (psicologo_id = auth.uid())
  with check (psicologo_id = auth.uid());
