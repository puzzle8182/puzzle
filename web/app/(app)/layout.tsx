import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { AppSidebar } from '@/components/app-sidebar'
import { SignOutButton } from '@/components/sign-out-button'
import { ROLE_LABEL, type AppRole } from '@/lib/nav-config'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  // LOG TEMPORÁRIO DE DEBUG — remover depois de identificar o problema
  console.log('DEBUG user.id:', user.id)
  console.log('DEBUG profile:', profile)
  console.log('DEBUG profileError:', profileError)

  if (!profile) {
    redirect('/cadastro')
  }

  const role = profile.role as AppRole

  return (
    <div className="flex min-h-screen bg-paper">
      <AppSidebar role={role} />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-border-soft px-8 py-4">
          <p className="text-sm text-ink-soft">
            {profile.full_name ?? 'Bem-vindo'} · {ROLE_LABEL[role]}
          </p>
          <SignOutButton />
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
