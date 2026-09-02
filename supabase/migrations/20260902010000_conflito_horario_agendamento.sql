-- =============================================================================
-- MIGRATION: Impede conflito de horário na agenda (dois colaboradores no
-- mesmo slot com o mesmo psicólogo)
-- =============================================================================
--
-- Índice único PARCIAL: só considera agendamentos "ativos" (não cancelados
-- e não remarcados). Sem o filtro de status, cancelar ou remarcar uma sessão
-- nunca liberaria aquele horário de novo para outro colaborador.
--
-- Isso é a fonte de verdade contra condição de corrida: mesmo que dois
-- colaboradores cliquem "confirmar" ao mesmo tempo e ambos passem pela
-- checagem feita na Server Action, o banco rejeita o segundo INSERT.

create unique index agendamentos_sem_conflito_horario
on core.agendamentos (psicologo_id, data_hora)
where status not in ('cancelado', 'remarcado');
