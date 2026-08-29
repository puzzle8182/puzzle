-- ============================================================
-- 0002: Schema CORPORATE
-- Empresa nunca tem policy de acesso a nada em `clinical`.
-- ============================================================

create table if not exists corporate.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text unique not null,
  modalidade_financiamento text not null check (modalidade_financiamento in ('integral', 'coparticipacao')),
  percentual_coparticipacao_empresa numeric check (percentual_coparticipacao_empresa between 0 and 100),
  created_at timestamptz not null default now()
);

-- Relação N:N entre empresa e usuários com papel empresa_admin
-- (permite mais de um admin de RH por empresa)
create table if not exists corporate.empresa_admins (
  empresa_id uuid not null references corporate.empresas(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (empresa_id, profile_id)
);

create table if not exists corporate.colaboradores_elegiveis (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references corporate.empresas(id) on delete cascade,
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists corporate.contratos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references corporate.empresas(id) on delete cascade,
  valor_mensal numeric not null,
  data_inicio date not null,
  data_fim date,
  status text not null default 'ativo' check (status in ('ativo', 'suspenso', 'encerrado')),
  created_at timestamptz not null default now()
);

create table if not exists corporate.faturas (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references corporate.contratos(id) on delete cascade,
  competencia date not null, -- primeiro dia do mês de referência
  valor numeric not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'atrasado')),
  pago_em timestamptz,
  created_at timestamptz not null default now(),
  unique (contrato_id, competencia)
);

alter table corporate.empresas enable row level security;
alter table corporate.empresa_admins enable row level security;
alter table corporate.colaboradores_elegiveis enable row level security;
alter table corporate.contratos enable row level security;
alter table corporate.faturas enable row level security;

-- Helper: o usuário atual é admin de RH desta empresa?
create or replace function public.is_admin_of_empresa(target_empresa_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from corporate.empresa_admins
    where empresa_id = target_empresa_id and profile_id = auth.uid()
  );
$$;

-- EMPRESAS: admin da própria empresa e admin_plataforma podem ver
create policy "empresas_select"
  on corporate.empresas for select
  using (public.is_admin_of_empresa(id) or public.is_admin_plataforma());

-- EMPRESA_ADMINS: cada admin vê os vínculos da própria empresa
create policy "empresa_admins_select"
  on corporate.empresa_admins for select
  using (public.is_admin_of_empresa(empresa_id) or public.is_admin_plataforma());

-- COLABORADORES_ELEGIVEIS: admin de RH vê os colaboradores da própria empresa;
-- o próprio colaborador vê seu vínculo
create policy "colaboradores_select"
  on corporate.colaboradores_elegiveis for select
  using (
    public.is_admin_of_empresa(empresa_id)
    or profile_id = auth.uid()
    or public.is_admin_plataforma()
  );

create policy "colaboradores_insert_by_empresa_admin"
  on corporate.colaboradores_elegiveis for insert
  with check (public.is_admin_of_empresa(empresa_id));

-- CONTRATOS e FATURAS: só admin de RH da própria empresa (dado financeiro/administrativo,
-- nunca clínico — por isso é seguro liberar aqui)
create policy "contratos_select"
  on corporate.contratos for select
  using (public.is_admin_of_empresa(empresa_id) or public.is_admin_plataforma());

create policy "faturas_select"
  on corporate.faturas for select
  using (
    exists (
      select 1 from corporate.contratos c
      where c.id = contrato_id and public.is_admin_of_empresa(c.empresa_id)
    )
    or public.is_admin_plataforma()
  );
