-- ============================================================
-- 0007: Corrige recursão infinita na policy de profiles
-- A policy original fazia um subquery em public.profiles
-- dentro de uma policy da própria public.profiles, o que o
-- Postgres detecta como recursão e recusa executar. A correção
-- usa a função security definer que já existia (is_admin_plataforma),
-- que evita a recursão por rodar como uma chamada de função separada.
-- ============================================================

drop policy if exists "profiles_select_own_or_admin" on public.profiles;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.is_admin_plataforma()
  );
