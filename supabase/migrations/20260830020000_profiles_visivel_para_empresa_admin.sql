-- ============================================================
-- 0011: Permite que empresa_admin veja nome/e-mail dos
-- colaboradores vinculados à própria empresa.
-- A policy original de profiles só permitia ver o próprio
-- registro (ou admin_plataforma). Sem essa policy adicional, a
-- tela de gestão de colaboradores não conseguiria mostrar nome
-- e e-mail de ninguém além do próprio admin.
-- ============================================================

create policy "profiles_select_colaboradores_da_empresa"
  on public.profiles for select
  using (
    exists (
      select 1
      from corporate.colaboradores_elegiveis ce
      join corporate.empresa_admins ea on ea.empresa_id = ce.empresa_id
      where ce.profile_id = public.profiles.id
        and ea.profile_id = auth.uid()
    )
  );
