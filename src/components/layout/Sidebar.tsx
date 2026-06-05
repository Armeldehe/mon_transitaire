'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid, Truck, MessageSquare, FolderOpen, CircleUser,
  Plus, Warehouse, DollarSign, Settings2
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',             label: 'Accueil',      icon: LayoutGrid },
  { href: '/transitaires', label: 'Transitaires', icon: Truck },
  { href: '/interactions', label: 'Interactions', icon: MessageSquare },
  { href: '/documents',    label: 'Documents',    icon: FolderOpen },
]

const SECONDARY_ITEMS = [
  { href: '/profil', label: 'Mon profil', icon: CircleUser },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <aside
      className="hidden md:flex w-56 fixed left-0 top-0 bottom-0 flex-col z-30"
      style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-14 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent)' }}
        >
          <span className="text-white text-xs font-black">MT</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
            MON TRANSITAIRE
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>CRM Terrain</p>
        </div>
      </div>

      {/* Nouveau bouton */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/transitaires/nouveau"
          className="btn btn-primary w-full text-sm"
          style={{ minHeight: '36px', borderRadius: '8px' }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nouveau transitaire
        </Link>
      </div>

      {/* Nav principale */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
        <p className="section-title px-3 pt-3">Navigation</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                height: '36px',
                background: active ? 'var(--accent-subtle)' : 'transparent',
                color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-elevated)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.5 : 1.75} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Nav bas */}
      <div className="px-2 py-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {SECONDARY_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                height: '36px',
                background: active ? 'var(--accent-subtle)' : 'transparent',
                color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-elevated)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.5 : 1.75} />
              {label}
            </Link>
          )
        })}
        <p className="text-[10px] px-3 pt-2" style={{ color: 'var(--text-muted)' }}>v2.0 — MVP Terrain</p>
      </div>
    </aside>
  )
}
