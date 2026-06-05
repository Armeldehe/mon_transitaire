'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Truck, MessageSquare, FolderOpen, CircleUser } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',              label: 'Accueil',      icon: LayoutGrid },
  { href: '/transitaires',  label: 'Transitaires', icon: Truck },
  { href: '/interactions',  label: 'Interactions', icon: MessageSquare },
  { href: '/documents',     label: 'Documents',    icon: FolderOpen },
  { href: '/profil',        label: 'Profil',       icon: CircleUser },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-bottom"
      style={{
        background: 'linear-gradient(to top, var(--bg-surface), color-mix(in srgb, var(--bg-surface) 95%, transparent))',
        borderTop: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-stretch h-[60px]">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-150 active:scale-90"
              style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              {/* Point actif */}
              {isActive && (
                <span
                  className="absolute top-1.5 w-1 h-1 rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}

              <Icon
                className="transition-all duration-150"
                style={{
                  width: isActive ? '22px' : '20px',
                  height: isActive ? '22px' : '20px',
                  strokeWidth: isActive ? 2.5 : 1.75,
                }}
              />
              <span
                className="text-[10px] font-medium tracking-tight leading-none"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
