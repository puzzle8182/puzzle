import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { AprovarPsicologoButtons } from '@/components/aprovar-psicologo-buttons'

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Em análise',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
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
        Verifique o CRP antes de aprovar — psicólogos só aparecem na busca
        depois de aprovados e com assinatura ativa.
      </p>

      <h2 className="font-display text-lg text-ink mt-8 mb-3">
        Aguardando análise ({pendentes.length})
      </h2>

      {pendentes.length === 0 && (
        <p className="text-ink-soft text-sm">Nenhum psicólogo aguardando aprovação.</p>
      )}

      <div className="flex flex-col gap-3">
        {pendentes.map((p) => {
          const perfil = perfilPorId[p.id]
          return (
            <div
              key={p.id}
              className="rounded-xl border border-border-soft bg-white p-4 flex justify-between items-start gap-4"
            >
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
                    className="text-xs text-pine font-medium hover:underline mt-1 inline-block"
                  >
                    Ver documento enviado →
                  </a>
                ) : (
                  <p className="text-xs text-amber mt-1">Nenhum documento enviado ainda.</p>
                )}
              </div>
              <AprovarPsicologoButtons psicologoId={p.id} />
            </div>
          )
        })}
      </div>

      <h2 className="font-display text-lg text-ink mt-10 mb-3">Já analisados</h2>

      <div className="flex flex-col gap-2">
        {decididos.map((p) => {
          const perfil = perfilPorId[p.id]
          return (
            <div
              key={p.id}
              className="rounded-lg border border-border-soft bg-white px-4 py-3 flex justify-between items-center"
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  {perfil?.full_name ?? 'Sem nome'}
                </p>
                <p className="text-xs text-ink-soft">CRP: {p.crp}</p>
              </div>
              <span
                className={`text-xs uppercase tracking-wide ${
                  p.status_verificacao === 'aprovado' ? 'text-pine' : 'text-red-700'
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

