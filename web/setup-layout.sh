#!/bin/bash
set -e

echo "Criando estrutura de pastas..."
mkdir -p lib components "app/(app)/dashboard"

echo "Criando lib/nav-config.ts..."
cat > lib/nav-config.ts << 'ENDOFFILE'
export type AppRole = 'empresa_admin' | 'colaborador' | 'psicologo' | 'admin_plataforma'

export type NavItem = {
  label: string
  href: string
  icon: 'home' | 'users' | 'calendar' | 'file' | 'chart' | 'card' | 'search' | 'settings'
}

export const NAV_BY_ROLE: Record<AppRole, NavItem[]> = {
  empresa_admin: [
    { label: 'Visão geral', href: '/dashboard', icon: 'home' },
    { label: 'Colaboradores', href: '/colaboradores', icon: 'users' },
    { label: 'Indicadores', href: '/indicadores', icon: 'chart' },
    { label: 'Faturas', href: '/faturas', icon: 'card' },
  ],
  colaborador: [
    { label: 'Início', href: '/dashboard', icon: 'home' },
    { label: 'Buscar psicólogo', href: '/buscar', icon: 'search' },
    { label: 'Meus agendamentos', href: '/agendamentos', icon: 'calendar' },
  ],
  psicologo: [
    { label: 'Agenda', href: '/dashboard', icon: 'calendar' },
    { label: 'Pacientes', href: '/pacientes', icon: 'users' },
    { label: 'Prontuários', href: '/prontuarios', icon: 'file' },
    { label: 'Financeiro', href: '/financeiro', icon: 'card' },
  ],
  admin_plataforma: [
    { label: 'Visão geral', href: '/dashboard', icon: 'home' },
    { label: 'Empresas', href: '/admin/empresas', icon: 'users' },
    { label: 'Psicólogos', href: '/admin/psicologos', icon: 'users' },
    { label: 'Configurações', href: '/admin/config', icon: 'settings' },
  ],
}

export const ROLE_LABEL: Record<AppRole, string> = {
  empresa_admin: 'Administrador de RH',
  colaborador: 'Colaborador',
  psicologo: 'Psicólogo',
  admin_plataforma: 'Admin da plataforma',
}
ENDOFFILE

echo "Criando components/icon.tsx..."
cat > components/icon.tsx << 'ENDOFFILE'
import type { SVGProps } from 'react'

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function Icon({
  name,
  ...props
}: { name: string } & SVGProps<SVGSVGElement>) {
  switch (name) {
    case 'home':
      return (
        <svg {...base} {...props}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
        </svg>
      )
    case 'users':
      return (
        <svg {...base} {...props}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15.5 13a4.5 4.5 0 0 1 5.2 4.4" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...base} {...props}>
          <rect x="3.5" y="5" width="17" height="16" rx="2" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      )
    case 'file':
      return (
        <svg {...base} {...props}>
          <path d="M6.5 3h8l5 5v13a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path d="M14 3v5h5M9 13h6M9 17h6" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...base} {...props}>
          <path d="M4 20V10M11 20V4M18 20v-7" />
          <path d="M2.5 20.5h19" />
        </svg>
      )
    case 'card':
      return (
        <svg {...base} {...props}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10.5h18M7 15h4" />
        </svg>
      )
    case 'search':
      return (
        <svg {...base} {...props}>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m20 20-4.3-4.3" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...base} {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 13a7.9 7.9 0 0 0 0-2l2-1.5-2-3.4-2.4.6a8 8 0 0 0-1.7-1L15 3h-4l-.3 2.7a8 8 0 0 0-1.7 1l-2.4-.6-2 3.4L6.6 11a7.9 7.9 0 0 0 0 2l-2 1.5 2 3.4 2.4-.6a8 8 0 0 0 1.7 1L11 21h4l.3-2.7a8 8 0 0 0 1.7-1l2.4.6 2-3.4Z" />
        </svg>
      )
    default:
      return null
  }
}
ENDOFFILE

echo "Criando components/brand-mark.tsx..."
cat > components/brand-mark.tsx << 'ENDOFFILE'
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 20 L9 13 M20 20 L31 13 M20 20 L20 32"
        stroke="var(--sage)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="9" cy="13" r="3.2" fill="var(--paper)" fillOpacity="0.9" />
      <circle cx="31" cy="13" r="3.2" fill="var(--paper)" fillOpacity="0.9" />
      <circle cx="20" cy="32" r="3.2" fill="var(--paper)" fillOpacity="0.9" />
      <circle cx="20" cy="20" r="4.5" fill="var(--sage)" className="brand-pulse" />
    </svg>
  )
}
ENDOFFILE

echo "Criando components/sign-out-button.tsx..."
cat > components/sign-out-button.tsx << 'ENDOFFILE'
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-ink-soft hover:text-ink transition-colors underline-offset-4 hover:underline"
    >
      Sair
    </button>
  )
}
ENDOFFILE

echo "Criando components/app-sidebar.tsx..."
cat > components/app-sidebar.tsx << 'ENDOFFILE'
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandMark } from '@/components/brand-mark'
import { Icon } from '@/components/icon'
import { NAV_BY_ROLE, ROLE_LABEL, type AppRole } from '@/lib/nav-config'

export function AppSidebar({ role }: { role: AppRole }) {
  const pathname = usePathname()
  const items = NAV_BY_ROLE[role]

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-pine text-paper">
      <div className="flex items-center gap-3 px-6 py-6">
        <BrandMark size={32} />
        <div>
          <p className="font-display text-lg leading-none">Plataforma</p>
          <p className="text-xs text-sage mt-1">{ROLE_LABEL[role]}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-paper text-pine font-medium'
                      : 'text-paper/85 hover:bg-pine-dark hover:text-paper'
                  }`}
                >
                  <Icon name={item.icon} width={18} height={18} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="px-6 py-5 text-xs text-paper/60 border-t border-white/10">
        Autonomia, sigilo e responsabilidade clínica sempre com o psicólogo.
      </div>
    </aside>
  )
}
ENDOFFILE

echo "Sobrescrevendo app/globals.css..."
cat > app/globals.css << 'ENDOFFILE'
@import "tailwindcss";

:root {
  --ink: #17242a;
  --ink-soft: #5c6b66;
  --paper: #f5f3ee;
  --pine: #2c4a46;
  --pine-dark: #1f3532;
  --sage: #9cbbab;
  --amber: #c89b3c;
  --border-soft: #e3ded2;
}

@theme inline {
  --color-ink: var(--ink);
  --color-ink-soft: var(--ink-soft);
  --color-paper: var(--paper);
  --color-pine: var(--pine);
  --color-pine-dark: var(--pine-dark);
  --color-sage: var(--sage);
  --color-amber: var(--amber);
  --color-border-soft: var(--border-soft);
  --font-display: var(--font-fraunces);
  --font-body: var(--font-inter);
}

body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body), ui-sans-serif, system-ui, sans-serif;
}

h1, h2, h3, .font-display {
  font-family: var(--font-display), Georgia, serif;
}

.brand-pulse {
  animation: brand-pulse 2.6s ease-in-out infinite;
  transform-origin: center;
}

@keyframes brand-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.85); }
}

@media (prefers-reduced-motion: reduce) {
  .brand-pulse {
    animation: none;
  }
}
ENDOFFILE

echo "Sobrescrevendo app/layout.tsx..."
cat > app/layout.tsx << 'ENDOFFILE'
import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['500', '600'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Plataforma',
  description: 'Acesso à psicoterapia e inteligência clínica.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${fraunces.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
ENDOFFILE

echo "Criando app/(app)/layout.tsx..."
cat > "app/(app)/layout.tsx" << 'ENDOFFILE'
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

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
ENDOFFILE

echo "Criando app/(app)/dashboard/page.tsx..."
cat > "app/(app)/dashboard/page.tsx" << 'ENDOFFILE'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { AppRole } from '@/lib/nav-config'

const WELCOME_COPY: Record<AppRole, { title: string; subtitle: string }> = {
  empresa_admin: {
    title: 'Visão geral do benefício',
    subtitle: 'Acompanhe uso e investimento, sem acesso a conteúdo clínico.',
  },
  colaborador: {
    title: 'Encontre seu psicólogo',
    subtitle: 'Escolha livremente quem você quer para te acompanhar.',
  },
  psicologo: {
    title: 'Sua agenda',
    subtitle: 'Organize seus atendimentos e prontuários com autonomia.',
  },
  admin_plataforma: {
    title: 'Painel da plataforma',
    subtitle: 'Visão consolidada de empresas e profissionais na rede.',
  },
}

export default async function DashboardPage() {
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

  if (!profile) redirect('/cadastro')

  const role = profile.role as AppRole
  const copy = WELCOME_COPY[role]

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">{copy.title}</h1>
      <p className="text-ink-soft mt-2">{copy.subtitle}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border-soft bg-white p-5">
          <p className="text-xs text-ink-soft uppercase tracking-wide">Em breve</p>
          <p className="font-display text-2xl text-ink mt-1">—</p>
        </div>
        <div className="rounded-xl border border-border-soft bg-white p-5">
          <p className="text-xs text-ink-soft uppercase tracking-wide">Em breve</p>
          <p className="font-display text-2xl text-ink mt-1">—</p>
        </div>
        <div className="rounded-xl border border-border-soft bg-white p-5">
          <p className="text-xs text-ink-soft uppercase tracking-wide">Em breve</p>
          <p className="font-display text-2xl text-ink mt-1">—</p>
        </div>
      </div>
    </div>
  )
}
ENDOFFILE

echo ""
echo "Pronto! Arquivos criados:"
echo "  lib/nav-config.ts"
echo "  components/icon.tsx"
echo "  components/brand-mark.tsx"
echo "  components/sign-out-button.tsx"
echo "  components/app-sidebar.tsx"
echo "  app/globals.css (sobrescrito)"
echo "  app/layout.tsx (sobrescrito)"
echo "  app/(app)/layout.tsx"
echo "  app/(app)/dashboard/page.tsx"
