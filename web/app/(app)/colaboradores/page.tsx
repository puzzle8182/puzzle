import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CriarEmpresaForm } from '@/components/criar-empresa-form'
import { AdicionarColaboradorForm } from '@/components/adicionar-colaborador-form'

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
        <div className="mt-8">
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

  const { data: colaboradores } = await supabase
    .schema('corporate')
    .from('colaboradores_elegiveis')
    .select('id, profile_id, ativo, created_at')
    .eq('empresa_id', vinculo.empresa_id)
    .order('created_at', { ascending: false })

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

      <div className="mt-8">
        <h2 className="font-display text-lg text-ink mb-3">Adicionar colaborador</h2>
        <AdicionarColaboradorForm empresaId={vinculo.empresa_id} />
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg text-ink mb-3">
          Colaboradores ({colaboradores?.length ?? 0})
        </h2>

        {(!colaboradores || colaboradores.length === 0) && (
          <p className="text-ink-soft text-sm">Nenhum colaborador adicionado ainda.</p>
        )}

        <div className="flex flex-col gap-2">
          {colaboradores?.map((c) => {
            const perfil = perfilPorId[c.profile_id]
            return (
              <div
                key={c.id}
                className="rounded-lg border border-border-soft bg-white px-4 py-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {perfil?.full_name ?? 'Sem nome'}
                  </p>
                  <p className="text-xs text-ink-soft">{perfil?.email}</p>
                </div>
                <span
                  className={`text-xs uppercase tracking-wide ${
                    c.ativo ? 'text-pine' : 'text-ink-soft'
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

