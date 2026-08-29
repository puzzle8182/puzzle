-- ============================================================
-- 0001: Schemas base + perfis de usuário + helpers de RBAC
-- ============================================================
-- Três schemas para reforçar a separação clínico/corporativo
-- diretamente no banco (não apenas na aplicação).

create schema if not exists corporate;   -- empresa, contratos, faturas, colaboradores elegíveis
create schema if not exists clinical;    -- psicólogos, prontuário, objetivos terapêuticos
create schema if not exists core;        -- agendamentos, pagamentos, assinaturas (dado compartilhado, não-clínico)

-- Papéis possíveis no sistema
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum (
      'empresa_admin',
      'colaborador',
      'psicologo',
      'admin_plataforma'
    );
  end if;
end $$;

-- Perfil de cada usuário autenticado (1:1 com auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada usuário só vê/edita o próprio perfil; admin da plataforma vê todos
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin_plataforma'
    )
  );

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: ao criar um usuário no Supabase Auth, cria o profile automaticamente.
-- O role vem de user_metadata definido no momento do signup (ex: signUp({ ..., options: { data: { role: 'colaborador' } } }))
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'colaborador'),
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers reutilizados em várias policies (evita repetir subqueries)
create or replace function public.current_role_is(target_role public.app_role)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = target_role
  );
$$;

create or replace function public.is_admin_plataforma()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_role_is('admin_plataforma');
$$;
