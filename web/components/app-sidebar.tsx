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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <BrandMark size={26} />
        </div>
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
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-paper text-pine font-medium shadow-sm'
                      : 'text-paper/85 hover:bg-pine-dark hover:text-paper'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? 'bg-pine/10 text-pine'
                        : 'bg-white/10 text-paper/85 group-hover:bg-white/15'
                    }`}
                  >
                    <Icon name={item.icon} width={16} height={16} />
                  </span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="flex items-start gap-3 px-6 py-5 border-t border-white/10">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sage">
          <Icon name="lock" width={14} height={14} />
        </span>
        <p className="text-xs leading-5 text-paper/60">
          Autonomia, sigilo e responsabilidade clínica sempre com o psicólogo.
        </p>
      </div>
    </aside>
  )
}
