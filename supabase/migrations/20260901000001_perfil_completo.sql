-- ============================================================
-- 0014: Perfil completo
-- - Foto de perfil para qualquer usuário (public.profiles), já
--   que colaborador, psicólogo e empresa_admin compartilham a
--   mesma tabela base.
-- - Campos profissionais adicionais para o psicólogo: formação
--   acadêmica, anos de experiência, modalidade de atendimento
--   e localização.
-- - View de busca passa a expor nome e foto (join com profiles),
--   já que antes o colaborador escolhia o psicólogo sem ver isso.
-- ============================================================

alter table public.profiles
  add column if not exists foto_url text;

alter table clinical.psicologos
  add column if not exists formacao text[],
  add column if not exists anos_experiencia integer,
  add column if not exists modalidade_atendimento text
    check (modalidade_atendimento in ('online', 'presencial', 'hibrido')),
  add column if not exists cidade text,
  add column if not exists estado text;

-- Recria a view de busca incluindo nome/foto (via join com profiles,
-- schema public) e os novos campos profissionais. Continua sem
-- security_invoker: roda com o dono da view, então não herda a RLS
-- de clinical.psicologos nem de public.profiles — a própria WHERE
-- já limita a exposição a perfis visíveis, com assinatura ativa e
-- documentação aprovada.
drop view if exists clinical.psicologos_busca;

create view clinical.psicologos_busca as
select
  cp.id,
  pr.full_name,
  pr.foto_url,
  cp.crp,
  cp.bio,
  cp.abordagem,
  cp.areas_atuacao,
  cp.formacao,
  cp.anos_experiencia,
  cp.modalidade_atendimento,
  cp.cidade,
  cp.estado,
  cp.valor_sessao,
  cp.disponibilidade
from clinical.psicologos cp
join public.profiles pr on pr.id = cp.id
where cp.perfil_visivel = true
  and cp.status_assinatura = 'ativa'
  and cp.status_verificacao = 'aprovado';

grant select on clinical.psicologos_busca to authenticated;

-- ============================================================
-- Storage: bucket PÚBLICO para fotos de perfil (avatar).
-- Diferente do bucket de documentos do CRP (privado, sensível),
-- a foto de perfil é feita para aparecer publicamente na busca —
-- por isso o bucket é público, mas o upload continua restrito
-- à própria pasta do usuário (mesmo padrão do bucket de documentos).
-- ============================================================

insert into storage.buckets (id, name, public)
values ('fotos-perfil', 'fotos-perfil', true)
on conflict (id) do nothing;

create policy "usuario_upload_propria_foto"
  on storage.objects for insert
  with check (
    bucket_id = 'fotos-perfil'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "usuario_atualiza_propria_foto"
  on storage.objects for update
  using (
    bucket_id = 'fotos-perfil'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "fotos_perfil_select_publico"
  on storage.objects for select
  using (bucket_id = 'fotos-perfil');
