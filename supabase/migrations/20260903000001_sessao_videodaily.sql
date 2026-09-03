-- =============================================================================
-- MIGRATION: Sessao de video via Daily.co (portado do Puzzle 1.0)
-- =============================================================================

create table if not exists core.salas_video (
    id uuid primary key default gen_random_uuid(),
    agendamento_id uuid not null references core.agendamentos(id) on delete cascade,
    video_room_url text not null,
    video_room_name text not null,
    criado_em timestamptz default now(),
    constraint salas_video_agendamento_unique unique (agendamento_id)
);

create table if not exists core.video_requests (
    request_id bigint primary key,
    agendamento_id uuid not null references core.agendamentos(id) on delete cascade,
    solicitante_id uuid not null references public.profiles(id),
    tipo text not null check (tipo in ('sala', 'token')),
    criado_em timestamptz default now()
);

alter table core.salas_video enable row level security;
alter table core.video_requests enable row level security;
-- Sem policies de proposito: nenhuma delas e acessada por select/insert direto
-- do cliente. Todo acesso passa pelas funcoes security definer abaixo, que
-- fazem sua propria checagem de participacao no agendamento.

create or replace function core.obter_sala_video(p_agendamento_id uuid)
returns text
language plpgsql
security definer
set search_path = core, public
as $$
declare
  v_meu_id uuid := auth.uid();
  v_participante boolean;
  v_url text;
begin
  select exists (
    select 1 from core.agendamentos a
    where a.id = p_agendamento_id
      and (a.psicologo_id = v_meu_id or a.colaborador_profile_id = v_meu_id)
  ) into v_participante;

  if not v_participante then
    raise exception 'Acesso negado - voce nao faz parte desta sessao.';
  end if;

  select video_room_url into v_url
  from core.salas_video
  where agendamento_id = p_agendamento_id;

  return v_url;
end;
$$;

create or replace function core.iniciar_criar_sala(p_agendamento_id uuid)
returns bigint
language plpgsql
security definer
set search_path = core, public, vault, extensions
as $$
declare
  v_agendamento record;
  v_meu_id uuid := auth.uid();
  v_api_key text;
  v_video_nome text;
  v_request_id bigint;
  v_pendente bigint;
begin
  select id, psicologo_id, colaborador_profile_id, data_hora
  into v_agendamento
  from core.agendamentos
  where id = p_agendamento_id;

  if v_agendamento.id is null then
    raise exception 'Agendamento nao encontrado.';
  end if;

  if not (v_agendamento.psicologo_id = v_meu_id or v_agendamento.colaborador_profile_id = v_meu_id) then
    raise exception 'Acesso negado - voce nao faz parte deste agendamento.';
  end if;

  if exists (select 1 from core.salas_video where agendamento_id = p_agendamento_id) then
    raise exception 'A sala ja foi criada. Atualize a pagina.';
  end if;

  select request_id into v_pendente
  from core.video_requests
  where agendamento_id = p_agendamento_id
    and tipo = 'sala'
    and criado_em > now() - interval '30 seconds'
  order by criado_em desc
  limit 1;

  if v_pendente is not null then
    return v_pendente;
  end if;

  select decrypted_secret into v_api_key from vault.decrypted_secrets where name = 'daily_api_key';
  if v_api_key is null then
    raise exception 'daily_api_key nao encontrada no Vault.';
  end if;

  v_video_nome := 'puzzle-' || replace(p_agendamento_id::text, '-', '');

  v_request_id := net.http_post(
    url := 'https://api.daily.co/v1/rooms',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_api_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'name', v_video_nome,
      'privacy', 'private',
      'properties', jsonb_build_object(
        'exp', extract(epoch from greatest(now() + interval '30 minutes', v_agendamento.data_hora + interval '3 hours'))::bigint,
        'enable_chat', true,
        'enable_recording', false,
        'eject_at_room_exp', true
      )
    )
  );

  insert into core.video_requests (request_id, agendamento_id, solicitante_id, tipo)
  values (v_request_id, p_agendamento_id, v_meu_id, 'sala');

  return v_request_id;
end;
$$;

create or replace function core.checar_criar_sala(p_agendamento_id uuid, p_request_id bigint)
returns text
language plpgsql
security definer
set search_path = core, public
as $$
declare
  v_meu_id uuid := auth.uid();
  v_status int;
  v_conteudo text;
  v_url text;
  v_nome text;
begin
  if not exists (
    select 1 from core.video_requests
    where request_id = p_request_id
      and agendamento_id = p_agendamento_id
      and tipo = 'sala'
  ) then
    raise exception 'Pedido invalido.';
  end if;

  if not exists (
    select 1 from core.agendamentos a
    where a.id = p_agendamento_id
      and (a.psicologo_id = v_meu_id or a.colaborador_profile_id = v_meu_id)
  ) then
    raise exception 'Acesso negado - voce nao faz parte deste agendamento.';
  end if;

  select status_code, content into v_status, v_conteudo from net._http_response where id = p_request_id;

  if v_status is null then
    return null;
  end if;

  if v_status >= 400 then
    raise exception 'Erro da API do Daily.co (status %): %', v_status, v_conteudo;
  end if;

  v_url := (v_conteudo::jsonb) ->> 'url';
  v_nome := (v_conteudo::jsonb) ->> 'name';

  insert into core.salas_video (agendamento_id, video_room_url, video_room_name)
  values (p_agendamento_id, v_url, v_nome)
  on conflict (agendamento_id) do update
    set video_room_url = excluded.video_room_url,
        video_room_name = excluded.video_room_name;

  return v_url;
end;
$$;

create or replace function core.iniciar_criar_token(p_agendamento_id uuid)
returns bigint
language plpgsql
security definer
set search_path = core, public, vault, extensions
as $$
declare
  v_agendamento record;
  v_sala record;
  v_meu_id uuid := auth.uid();
  v_sou_psicologo boolean;
  v_meu_nome text;
  v_api_key text;
  v_request_id bigint;
begin
  select id, psicologo_id, colaborador_profile_id
  into v_agendamento
  from core.agendamentos
  where id = p_agendamento_id;

  if v_agendamento.id is null then
    raise exception 'Agendamento nao encontrado.';
  end if;

  v_sou_psicologo := v_agendamento.psicologo_id = v_meu_id;
  if not (v_sou_psicologo or v_agendamento.colaborador_profile_id = v_meu_id) then
    raise exception 'Acesso negado - voce nao faz parte deste agendamento.';
  end if;

  select video_room_name into v_sala from core.salas_video where agendamento_id = p_agendamento_id;
  if v_sala.video_room_name is null then
    raise exception 'A sala ainda nao foi criada.';
  end if;

  select full_name into v_meu_nome from public.profiles where id = v_meu_id;

  select decrypted_secret into v_api_key from vault.decrypted_secrets where name = 'daily_api_key';
  if v_api_key is null then
    raise exception 'daily_api_key nao encontrada no Vault.';
  end if;

  v_request_id := net.http_post(
    url := 'https://api.daily.co/v1/meeting-tokens',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_api_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'properties', jsonb_build_object(
        'room_name', v_sala.video_room_name,
        'is_owner', v_sou_psicologo,
        'user_name', coalesce(v_meu_nome, 'Participante'),
        'exp', extract(epoch from (now() + interval '3 hours'))::bigint
      )
    )
  );

  insert into core.video_requests (request_id, agendamento_id, solicitante_id, tipo)
  values (v_request_id, p_agendamento_id, v_meu_id, 'token');

  return v_request_id;
end;
$$;

create or replace function core.checar_criar_token(p_request_id bigint)
returns text
language plpgsql
security definer
set search_path = core, public
as $$
declare
  v_meu_id uuid := auth.uid();
  v_status int;
  v_conteudo text;
begin
  if not exists (
    select 1 from core.video_requests
    where request_id = p_request_id
      and tipo = 'token'
      and solicitante_id = v_meu_id
  ) then
    raise exception 'Pedido invalido.';
  end if;

  select status_code, content into v_status, v_conteudo from net._http_response where id = p_request_id;
  if v_status is null then return null; end if;
  if v_status >= 400 then
    raise exception 'Erro da API do Daily.co (status %): %', v_status, v_conteudo;
  end if;

  return (v_conteudo::jsonb) ->> 'token';
end;
$$;

revoke all on function core.obter_sala_video(uuid) from public;
revoke all on function core.iniciar_criar_sala(uuid) from public;
revoke all on function core.checar_criar_sala(uuid, bigint) from public;
revoke all on function core.iniciar_criar_token(uuid) from public;
revoke all on function core.checar_criar_token(bigint) from public;

grant execute on function core.obter_sala_video(uuid) to authenticated;
grant execute on function core.iniciar_criar_sala(uuid) to authenticated;
grant execute on function core.checar_criar_sala(uuid, bigint) to authenticated;
grant execute on function core.iniciar_criar_token(uuid) to authenticated;
grant execute on function core.checar_criar_token(bigint) to authenticated;