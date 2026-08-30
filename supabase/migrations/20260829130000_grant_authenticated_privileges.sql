-- ============================================================
-- 0008: Concede privilégios básicos de GRANT ao role authenticated
-- RLS só é avaliada DEPOIS que o Postgres confirma que o role tem
-- permissão básica (GRANT) na tabela. Sem isso, toda consulta é
-- negada antes mesmo de chegar nas policies — foi o que aconteceu
-- com public.profiles e provavelmente aconteceria com todas as
-- outras tabelas dos schemas customizados também.
-- ============================================================

-- Acesso de uso aos schemas (sem isso, nem consegue "ver" as tabelas)
grant usage on schema public to authenticated;
grant usage on schema corporate to authenticated;
grant usage on schema clinical to authenticated;
grant usage on schema core to authenticated;

-- Privilégios nas tabelas já existentes
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema corporate to authenticated;
grant select, insert, update, delete on all tables in schema clinical to authenticated;
grant select, insert, update, delete on all tables in schema core to authenticated;

-- Garante que TABELAS FUTURAS criadas nesses schemas já nasçam com
-- esse grant, evitando repetir esse mesmo bug em toda migration nova.
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema corporate grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema clinical grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema core grant select, insert, update, delete on tables to authenticated;
