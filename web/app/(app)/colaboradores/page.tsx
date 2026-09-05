import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CriarEmpresaForm } from '@/components/criar-empresa-form'
import { AdicionarColaboradorForm } from '@/components/adicionar-colaborador-form'
import { Icon } from '@/components/icon'

const MODALIDADE_LABEL: Record<string, string> = {
  integral: 'Custeio integral',
  coparticipacao: 'Coparticipação',
}

export default async function ColaboradoresPage() {
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

  if (profile?.role !== 'empresa_admin') {
    redirect('/dashboard')
  }

  const { data: vinculo } = await supabase
    .schema('corporate')
    .from('empresa_admins')
    .select('empresa_id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!vinculo) {
    return (
      <div>
        <h1 className="font-display text-3xl text-ink">Cadastre sua empresa</h1>
        <div className="mt-8 rounded-2xl border border-border-soft bg-white p-7">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pine/10 text-pine">
              <Icon name="building" width={16} height={16} />
            </span>
            <p className="text-sm font-medium text-ink">Dados da empresa</p>
          </div>
          <CriarEmpresaForm />
        </div>
      </div>
    )
  }

  const { data: empresa } = await supabase
    .schema('corporate')
    .from('empresas')
    .select('id, nome, cnpj, modalidade_financiamento, percentual_coparticipacao_empresa')
    .eq('id', vinculo.empresa_id)
    .single()

  const [{ data: colaboradores }, { data: convitesPendentes }] = await Promise.all([
    supabase
      .schema('corporate')
      .from('colaboradores_elegiveis')
      .select('id, profile_id, ativo, created_at')
      .eq('empresa_id', vinculo.empresa_id)
      .order('created_at', { ascending: false }),
    supabase
      .schema('corporate')
      .from('convites_colaborador')
      .select('id, email, created_at')
      .eq('empresa_id', vinculo.empresa_id)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false }),
  ])

  const profileIds = (colaboradores ?? []).map((c) => c.profile_id)

  let perfilPorId: Record<string, { full_name: string | null; email: string | null }> = {}
  if (profileIds.length > 0) {
    const { data: perfis } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', profileIds)

    perfilPorId = Object.fromEntries((perfis ?? []).map((p) => [p.id, p]))
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">{empresa?.nome}</h1>
      <p className="text-ink-soft mt-2">
        {empresa && MODALIDADE_LABEL[empresa.modalidade_financiamento]}
        {empresa?.modalidade_financiamento === 'coparticipacao' &&
          ` · empresa cobre ${empresa.percentual_coparticipacao_empresa}%`}
      </p>

      <div className="mt-8 rounded-2xl border border-border-soft bg-white p-7">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pine/10 text-pine">
            <Icon name="users" width={16} height={16} />
          </span>
          <h2 className="font-medium text-ink">Adicionar colaborador</h2>
        </div>
        <AdicionarColaboradorForm empresaId={vinculo.empresa_id} />
      </div>

      {convitesPendentes && convitesPendentes.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg text-ink mb-4">
            Convites pendentes ({convitesPendentes.length})
          </h2>
          <div className="flex flex-col gap-3">
            {convitesPendentes.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-border-soft bg-paper px-6 py-4"
              >
                <p className="text-sm text-ink">{c.email}</p>
                <span className="rounded-full bg-amber/15 text-amber px-2.5 py-1 text-xs font-medium uppercase tracking-wide">
                  Aguardando cadastro
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-display text-lg text-ink mb-4">
          Colaboradores ({colaboradores?.length ?? 0})
        </h2>

        {(!colaboradores || colaboradores.length === 0) && (
          <p className="text-ink-soft text-sm">Nenhum colaborador vinculado ainda.</p>
        )}

        <div className="flex flex-col gap-3">
          {colaboradores?.map((c) => {
            const perfil = perfilPorId[c.profile_id]
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border-soft bg-white px-6 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {perfil?.full_name ?? 'Sem nome'}
                  </p>
                  <p className="text-xs text-ink-soft">{perfil?.email}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${
                    c.ativo
                      ? 'bg-sage/20 text-pine'
                      : 'bg-paper text-ink-soft border border-border-soft'
                  }`}
                >
                  {c.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}