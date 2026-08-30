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
