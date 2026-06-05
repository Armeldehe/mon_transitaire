'use client'

import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LogOut, CircleUser, ChevronDown, Search, Sun, Moon } from 'lucide-react'

interface HeaderProps {
  userName?: string | null
  userRole?: string | null
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  operator: 'Opérateur',
  viewer: 'Lecteur',
}

export default function Header({ userName, userRole }: HeaderProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const menuRef = useRef<HTMLDivElement>(null)

  // Lire la préférence thème
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (saved) {
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])

  // Fermer le menu au clic extérieur
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 h-14 sticky top-0 z-30"
      style={{
        background: 'color-mix(in srgb, var(--bg-surface) 85%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo (mobile uniquement) */}
      <div className="flex items-center gap-2 md:hidden">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--accent)' }}
        >
          <span className="text-white text-xs font-black">MT</span>
        </div>
        <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          MON TRANSITAIRE
        </span>
      </div>

      {/* Recherche globale — desktop */}
      <div className="hidden md:flex flex-1 max-w-sm">
        <Link
          href="/transitaires?focus=search"
          className="flex items-center gap-2 w-full px-3 rounded-lg transition-all"
          style={{
            height: '36px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Rechercher un transitaire...</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono"
               style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>
            ⌘K
          </kbd>
        </Link>
      </div>

      {/* Actions droite */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          aria-label="Changer le thème"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />
          }
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            id="header-user-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all"
            style={{
              color: 'var(--text-secondary)',
              background: menuOpen ? 'var(--bg-elevated)' : 'transparent',
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
                {userName ?? 'Agent'}
              </p>
              {userRole && (
                <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                  {ROLE_LABELS[userRole] || userRole}
                </p>
              )}
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform hidden sm:block ${menuOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--text-muted)' }}
            />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 w-52 rounded-xl py-1.5 shadow-xl animate-scale-in z-50"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div className="px-4 py-2.5 mb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {userName ?? 'Agent'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {ROLE_LABELS[userRole ?? ''] || userRole}
                </p>
              </div>
              <Link
                href="/profil"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <CircleUser className="w-4 h-4" />
                Mon profil
              </Link>
              <div className="mx-3 my-1" style={{ borderTop: '1px solid var(--border-subtle)' }} />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-red-400"
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
