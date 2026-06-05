'use client'

import Link from 'next/link'
import { Edit2 } from 'lucide-react'
import { PARTNERSHIP_STATUS, TRUST_LEVELS, formatDate } from '@/lib/utils'

// Types adaptés de prisma (on pourrait aussi utiliser le type généré)
type Forwarder = any

interface Props {
  forwarder: Forwarder
  countries: { name: string; flag_emoji: string | null }[]
}

export default function ForwarderRow({ forwarder, countries }: Props) {
  const status = PARTNERSHIP_STATUS[forwarder.partnership_status as keyof typeof PARTNERSHIP_STATUS]
  const trust = forwarder.trust_level ? TRUST_LEVELS[forwarder.trust_level as keyof typeof TRUST_LEVELS] : null

  return (
    <>
      <tr className="transition-colors group hover:bg-[var(--color-bg-hover)]"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
        <td className="px-4 py-3">
          <Link href={`/transitaires/${forwarder.id}`}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--color-text-primary)' }}>
            {forwarder.company_name}
          </Link>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{forwarder.contact_person}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{forwarder.phone}</p>
        </td>
        <td className="px-4 py-3">
          {status && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
              {status.label}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          {trust && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${trust.color}`}>
              {trust.label}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1">
            {countries.slice(0, 3).map((c, i) => (
              <span key={i} className="text-sm" title={c.name}>
                {c.flag_emoji}
              </span>
            ))}
            {countries.length > 3 && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                +{countries.length - 3}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          {forwarder.next_follow_up_date ? (
            <span className={`text-xs ${new Date(forwarder.next_follow_up_date) < new Date() ? 'text-red-400 font-medium' : ''}`}
                  style={new Date(forwarder.next_follow_up_date) >= new Date() ? { color: 'var(--color-text-secondary)' } : {}}>
              {formatDate(forwarder.next_follow_up_date)}
            </span>
          ) : (
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {formatDate(forwarder.created_at)}
          </span>
        </td>
        {/* Colonne Action (Édition) */}
        <td className="px-4 py-3 text-right">
          <Link
            href={`/transitaires/${forwarder.id}`}
            className="inline-flex p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Modifier le transitaire (page complète)"
          >
            <Edit2 className="w-4 h-4" />
          </Link>
        </td>
      </tr>
    </>
  )
}
