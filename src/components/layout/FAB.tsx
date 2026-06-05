'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Truck, X } from 'lucide-react'

const FAB_ACTIONS = [
  {
    href: '/transitaires/nouveau',
    label: 'Nouveau transitaire',
    icon: Truck,
    color: 'var(--accent)',
  },
]

export default function FAB() {
  const [open, setOpen] = useState(false)

  // Pour l'instant, une seule action → lien direct
  // Quand il y aura plus d'actions, on affiche un menu radial
  if (FAB_ACTIONS.length === 1) {
    return (
      <Link
        href={FAB_ACTIONS[0].href}
        className="fixed bottom-[76px] right-4 z-50 md:hidden flex items-center justify-center rounded-full shadow-xl active:scale-90 transition-transform duration-150"
        style={{
          width: '52px',
          height: '52px',
          background: 'var(--accent)',
          boxShadow: '0 4px 20px color-mix(in srgb, var(--accent) 50%, transparent)',
        }}
        aria-label="Nouveau transitaire"
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </Link>
    )
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Actions */}
      {open && (
        <div className="fixed bottom-[136px] right-4 z-50 flex flex-col gap-3 items-end animate-fade-in md:hidden">
          {FAB_ACTIONS.map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 rounded-full shadow-lg active:scale-95 transition-transform duration-150"
              style={{
                height: '44px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
              }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {label}
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: color }}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bouton principal */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-[76px] right-4 z-50 md:hidden flex items-center justify-center rounded-full shadow-xl transition-all duration-200 active:scale-90"
        style={{
          width: '52px',
          height: '52px',
          background: open ? 'var(--bg-overlay)' : 'var(--accent)',
          boxShadow: open
            ? 'none'
            : '0 4px 20px color-mix(in srgb, var(--accent) 50%, transparent)',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
        aria-label={open ? 'Fermer' : 'Actions rapides'}
      >
        {open
          ? <X className="w-6 h-6 text-white" strokeWidth={2.5} />
          : <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
        }
      </button>
    </>
  )
}
