-- ============================================================
-- 0012: Habilita a tela de Pacientes/Prontuário para o psicólogo
-- ============================================================

-- Permite que o psicólogo veja nome/e-mail dos colaboradores que já
-- agendaram sessão com ele. Sem isso, a tela de "Pacientes" não teria
-- como mostrar nada além do UUID do colaborador.
create policy "profiles_select_pacientes_do_psicologo"
  on public.profiles for select
  using (
    exists (
      select 1 from core.agendamentos a
      where a.colaborador_profile_id = public.profiles.id
        and a.psicologo_id = auth.uid()
    )
  );

-- Uma nota de sessão por agendamento — simplifica o fluxo para
-- "editar a nota desta sessão" em vez de gerenciar múltiplas notas
-- soltas por sessão.
alter table clinical.notas_sessao
  add constraint notas_sessao_agendamento_unique unique (agendamento_id);
