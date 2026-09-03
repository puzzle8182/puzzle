import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { AprovarPsicologoButtons } from '@/components/aprovar-psicologo-buttons'
import { Icon } from '@/components/icon'

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Em análise',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
}

const STATUS_STYLE: Record<string, string> = {
  aprovado: 'bg-sage/20 text-pine',
  rejeitado: 'bg-red-50 text-red-700',
}

export default async function AdminPsicologosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin_plataforma') {
    redirect('/dashboard')
  }

  const { data: psicologos } = await supabase
    .schema('clinical')
    .from('psicologos')
    .select('id, crp, status_verificacao, status_assinatura, documento_url, created_at')
    .order('created_at', { ascending: false })

  const profileIds = (psicologos ?? []).map((p) => p.id)

  let perfilPorId: Record<string, { full_name: string | null; email: string | null }> = {}
  if (profileIds.length > 0) {
    const { data: perfis } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', profileIds)
    perfilPorId = Object.fromEntries((perfis ?? []).map((p) => [p.id, p]))
  }

  // Gera links assinados (o bucket é privado) para o admin conseguir
  // abrir o documento de cada psicólogo que já enviou um.
  const linksDocumento: Record<string, string | null> = {}
  for (const p of psicologos ?? []) {
    if (p.documento_url) {
      const { data } = await supabase.storage
        .from('documentos-psicologos')
        .createSignedUrl(p.documento_url, 60 * 10)
      linksDocumento[p.id] = data?.signedUrl ?? null
    }
  }

  const pendentes = (psicologos ?? []).filter((p) => p.status_verificacao === 'pendente')
  const decididos = (psicologos ?? []).filter((p) => p.status_verificacao !== 'pendente')

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Aprovação de psicólogos</h1>
      <p className="text-ink-soft mt-2">
        Verifique o CRP antes de aprovar; psicólogos só aparecem na busca
        depois de aprovados e com assinatura ativa.
      </p>

      <h2 className="font-display text-lg text-ink mt-10 mb-4">
        Aguardando análise ({pendentes.length})
      </h2>

      {pendentes.length === 0 && (
        <p className="text-ink-soft text-sm">Nenhum psicólogo aguardando aprovação.</p>
      )}

      <div className="flex flex-col gap-4">
        {pendentes.map((p) => {
          const perfil = perfilPorId[p.id]
          return (
            <div
              key={p.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border-soft bg-white p-6"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber/15 text-amber">
                  <Icon name="shield" width={18} height={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">
                    {perfil?.full_name ?? 'Sem nome'}
                  </p>
                  <p className="text-xs text-ink-soft">{perfil?.email}</p>
                  <p className="text-xs text-ink-soft mt-1">CRP: {p.crp}</p>
                  {linksDocumento[p.id] ? (
                    <a
                      href={linksDocumento[p.id]!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-pine font-medium hover:underline mt-2"
                    >
                      <Icon name="file" width={12} height={12} />
                      Ver documento enviado
                    </a>
                  ) : (
                    <p className="text-xs text-amber mt-2">Nenhum documento enviado ainda.</p>
                  )}
                </div>
              </div>
              <AprovarPsicologoButtons psicologoId={p.id} />
            </div>
          )
        })}
      </div>

      <h2 className="font-display text-lg text-ink mt-12 mb-4">Já analisados</h2>

      <div className="flex flex-col gap-3">
        {decididos.map((p) => {
          const perfil = perfilPorId[p.id]
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border-soft bg-white px-6 py-4"
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  {perfil?.full_name ?? 'Sem nome'}
                </p>
                <p className="text-xs text-ink-soft">CRP: {p.crp}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${
                  STATUS_STYLE[p.status_verificacao] ?? 'bg-paper text-ink-soft border border-border-soft'
                }`}
              >
                {STATUS_LABEL[p.status_verificacao]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
