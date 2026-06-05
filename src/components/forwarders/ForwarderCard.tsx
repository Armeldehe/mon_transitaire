'use client'

import Link from 'next/link'
import { Phone, MessageCircle, MapPin, CalendarClock, Globe } from 'lucide-react'
import { PARTNERSHIP_STATUS, TRUST_LEVELS } from '@/lib/utils'

type ForwarderCardData = {
  id: string
  company_name: string
  contact_person: string
  phone: string
  whatsapp?: string | null
  address_abidjan?: string | null
  partnership_status: string
  trust_level?: number | null
  next_follow_up_date?: Date | string | null
  countries?: { name: string; flag_emoji: string | null }[]
}

interface Props {
  forwarder: ForwarderCardData
}

export default function ForwarderCard({ forwarder }: Props) {
  const status = PARTNERSHIP_STATUS[forwarder.partnership_status as keyof typeof PARTNERSHIP_STATUS]
  const trust = forwarder.trust_level
    ? TRUST_LEVELS[forwarder.trust_level as keyof typeof TRUST_LEVELS]
    : null

  const initials = forwarder.company_name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  const isOverdue = forwarder.next_follow_up_date
    ? new Date(forwarder.next_follow_up_date) < new Date()
    : false

  const daysUntilFollowUp = forwarder.next_follow_up_date
    ? Math.ceil((new Date(forwarder.next_follow_up_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const phoneClean = forwarder.phone.replace(/\s/g, '')
  const waPhone = (forwarder.whatsapp || forwarder.phone).replace(/[\s+]/g, '')

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-150 active:scale-[0.99]"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Corps principal — lien vers détail */}
      <Link href={`/transitaires/${forwarder.id}`} className="block p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{
              background: 'var(--accent-subtle)',
              color: 'var(--accent-text)',
              border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
            }}
          >
            {initials}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                {forwarder.company_name}
              </h3>
              {status && (
                <span
                  className="badge flex-shrink-0"
                  style={{
                    background: `color-mix(in srgb, var(--accent) 15%, transparent)`,
                    color: 'var(--accent-text)',
                  }}
                >
                  {status.label}
                </span>
              )}
            </div>

            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
              {forwarder.contact_person}
            </p>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {/* Pays */}
              {forwarder.countries && forwarder.countries.length > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Globe className="w-3 h-3" />
                  {forwarder.countries.slice(0, 3).map(c => c.flag_emoji).join(' ')}
                  {forwarder.countries.length > 3 && ` +${forwarder.countries.length - 3}`}
                </span>
              )}

              {/* Trust */}
              {trust && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {['', '★', '★★', '★★★', '★★★★'][forwarder.trust_level ?? 0]}
                </span>
              )}

              {/* Relance */}
              {daysUntilFollowUp !== null && (
                <span
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: isOverdue ? 'var(--danger-text)' : 'var(--warning-text)' }}
                >
                  <CalendarClock className="w-3 h-3" />
                  {isOverdue
                    ? `En retard ${Math.abs(daysUntilFollowUp)}j`
                    : daysUntilFollowUp === 0
                    ? "Aujourd'hui"
                    : `J+${daysUntilFollowUp}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Actions rapides terrain */}
      <div
        className="flex border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <a
          href={`tel:${phoneClean}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all active:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--success-text)' }}
          onClick={e => e.stopPropagation()}
        >
          <Phone className="w-3.5 h-3.5" />
          Appeler
        </a>
        <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
        <a
          href={`https://wa.me/${waPhone}`}
          target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all active:bg-[var(--bg-elevated)]"
          style={{ color: '#22c55e' }}
          onClick={e => e.stopPropagation()}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </a>
        {forwarder.address_abidjan && (
          <>
            <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(forwarder.address_abidjan + ', Abidjan')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all active:bg-[var(--bg-elevated)]"
              style={{ color: 'var(--info-text)' }}
              onClick={e => e.stopPropagation()}
            >
              <MapPin className="w-3.5 h-3.5" />
              Localiser
            </a>
          </>
        )}
      </div>
    </div>
  )
}
