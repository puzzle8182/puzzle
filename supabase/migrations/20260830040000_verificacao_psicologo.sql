-- ============================================================
-- 0013: Verificação de documentação do psicólogo
-- Separado do status_assinatura (financeiro) — um psicólogo só
-- aparece na busca quando as DUAS condições são verdadeiras:
-- assinatura ativa E documentação aprovada pelo responsável técnico.
-- ============================================================

alter table clinical.psicologos
  add column if not exists status_verificacao text not null default 'pendente'
    check (status_verificacao in ('pendente', 'aprovado', 'rejeitado')),
  add column if not exists documento_url text;

-- Atualiza a view de busca pública para exigir também aprovação de documentação
drop view if exists clinical.psicologos_busca;

create view clinical.psicologos_busca as
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
  and status_assinatura = 'ativa'
  and status_verificacao = 'aprovado';

grant select on clinical.psicologos_busca to authenticated;

-- Só admin_plataforma pode aprovar/rejeitar (UPDATE na tabela em geral).
-- A policy existente "psicologos_update_own" já cobre o próprio psicólogo
-- editar seu perfil; esta é adicional, específica pro admin.
create policy "psicologos_update_admin_plataforma"
  on clinical.psicologos for update
  using (public.is_admin_plataforma());

-- Trava extra: mesmo que alguém tente burlar via update direto na própria
-- linha (permitido pela policy do dono), o campo status_verificacao só
-- muda de verdade se quem está atualizando for admin_plataforma. Isso
-- impede autoaprovação mesmo que a policy de UPDATE do próprio psicólogo
-- permita editar a linha inteira.
create or replace function clinical.protect_status_verificacao()
returns trigger
language plpgsql
security definer
set search_path = public, clinical
as $$
begin
  -- O próprio psicólogo pode voltar o status para 'pendente' (ex: ao
  -- reenviar um documento pedindo nova análise), mas só admin_plataforma
  -- pode mover para 'aprovado' ou 'rejeitado'.
  if not public.is_admin_plataforma() and new.status_verificacao <> 'pendente' then
    new.status_verificacao := old.status_verificacao;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_status_verificacao on clinical.psicologos;
create trigger trg_protect_status_verificacao
  before update on clinical.psicologos
  for each row execute function clinical.protect_status_verificacao();

-- ============================================================
-- Storage: bucket privado para documentos de comprovação (CRP etc.)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('documentos-psicologos', 'documentos-psicologos', false)
on conflict (id) do nothing;

-- Cada psicólogo só pode enviar/ver arquivos dentro da própria "pasta"
-- (o path do arquivo precisa começar com o próprio auth.uid()).
create policy "psicologo_upload_proprio_documento"
  on storage.objects for insert
  with check (
    bucket_id = 'documentos-psicologos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "psicologo_atualiza_proprio_documento"
  on storage.objects for update
  using (
    bucket_id = 'documentos-psicologos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- O próprio psicólogo vê seu documento; admin_plataforma vê todos
-- (para conferir a documentação antes de aprovar).
create policy "documento_select_dono_ou_admin"
  on storage.objects for select
  using (
    bucket_id = 'documentos-psicologos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin_plataforma()
    )
  );
