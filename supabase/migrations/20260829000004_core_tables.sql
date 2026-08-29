-- ============================================================
-- 0004: Schema CORE
-- Dado compartilhado, mas NÃO clínico (agenda + dois fluxos
-- financeiros distintos, conforme o modelo de negócio):
--   Fluxo 1: sessão -> empresa/colaborador paga o psicólogo
--   Fluxo 2: assinatura -> psicólogo paga a plataforma
-- ============================================================

create table if not exists core.agendamentos (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references clinical.psicologos(id) on delete cascade,
  colaborador_profile_id uuid not null references public.profiles(id) on delete cascade,
  empresa_id uuid not null references corporate.empresas(id) on delete restrict, -- denormalizado, útil para billing/indicadores
  data_hora timestamptz not null,
  status text not null default 'agendado'
    check (status in ('agendado', 'realizado', 'cancelado', 'remarcado')),
  valor_sessao numeric not null,
  valor_empresa numeric not null default 0,
  valor_colaborador numeric not null default 0,
  created_at timestamptz not null default now(),
  constraint valor_split_confere check (valor_empresa + valor_colaborador = valor_sessao)
);

-- Agora que core.agendamentos existe, conecta a FK pendente de clinical.notas_sessao
alter table clinical.notas_sessao
  add constraint notas_sessao_agendamento_fk
  foreign key (agendamento_id) references core.agendamentos(id) on delete restrict;

-- FLUXO 1: pagamento da sessão (empresa/colaborador -> psicólogo)
create table if not exists core.pagamentos_sessao (
  id uuid primary key default gen_random_uuid(),
  agendamento_id uuid not null unique references core.agendamentos(id) on delete cascade,
  valor_total numeric not null,
  valor_empresa numeric not null,
  valor_colaborador numeric not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'falhou', 'estornado')),
  gateway_transaction_id text,
  pago_em timestamptz,
  created_at timestamptz not null default now()
);

-- FLUXO 2: assinatura mensal do psicólogo (psicólogo -> plataforma, R$150 por padrão)
create table if not exists core.assinaturas_psicologo (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references clinical.psicologos(id) on delete cascade,
  valor numeric not null default 150.00,
  competencia date not null, -- primeiro dia do mês de referência
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'atrasado', 'cancelado')),
  gateway_subscription_id text,
  pago_em timestamptz,
  created_at timestamptz not null default now(),
  unique (psicologo_id, competencia)
);

alter table core.agendamentos enable row level security;
alter table core.pagamentos_sessao enable row level security;
alter table core.assinaturas_psicologo enable row level security;

-- AGENDAMENTOS: colaborador vê os próprios; psicólogo vê os próprios.
-- Empresa NÃO recebe policy de select direto aqui — o acesso dela é
-- só via função de indicadores agregados (migration 0006).
create policy "agendamentos_select_colaborador"
  on core.agendamentos for select
  using (colaborador_profile_id = auth.uid());

create policy "agendamentos_select_psicologo"
  on core.agendamentos for select
  using (psicologo_id = auth.uid());

create policy "agendamentos_select_admin_plataforma"
  on core.agendamentos for select
  using (public.is_admin_plataforma());

create policy "agendamentos_insert_colaborador"
  on core.agendamentos for insert
  with check (colaborador_profile_id = auth.uid());

-- PAGAMENTOS_SESSAO: contém dado financeiro (não clínico), então é aceitável
-- liberar para o admin de RH da empresa envolvida — ele precisa disso para
-- conferência de fatura e prestação de contas do benefício.
create policy "pagamentos_select_colaborador"
  on core.pagamentos_sessao for select
  using (
    exists (
      select 1 from core.agendamentos a
      where a.id = agendamento_id and a.colaborador_profile_id = auth.uid()
    )
  );

create policy "pagamentos_select_psicologo"
  on core.pagamentos_sessao for select
  using (
    exists (
      select 1 from core.agendamentos a
      where a.id = agendamento_id and a.psicologo_id = auth.uid()
    )
  );

create policy "pagamentos_select_empresa_admin"
  on core.pagamentos_sessao for select
  using (
    exists (
      select 1 from core.agendamentos a
      where a.id = agendamento_id and public.is_admin_of_empresa(a.empresa_id)
    )
  );

-- ASSINATURAS_PSICOLOGO: só o próprio psicólogo e o admin da plataforma
create policy "assinaturas_select_own"
  on core.assinaturas_psicologo for select
  using (psicologo_id = auth.uid() or public.is_admin_plataforma());
