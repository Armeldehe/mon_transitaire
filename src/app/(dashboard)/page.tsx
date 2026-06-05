import { prisma } from '@/lib/prisma'
import { PARTNERSHIP_STATUS, TRUST_LEVELS, formatRelativeDate } from '@/lib/utils'
import { Users, Globe, Warehouse, TrendingUp, ChevronRight, CalendarClock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getStats() {
  const [
    totalForwarders,
    validatedPartners,
    totalWarehouses,
    totalCountries,
    recentForwarders,
    statusCounts,
    followUps,
  ] = await Promise.all([
    prisma.forwarders.count({ where: { deleted_at: null } }),
    prisma.forwarders.count({ where: { deleted_at: null, partnership_status: 'validated' } }),
    prisma.warehouses.count({ where: { deleted_at: null } }),
    prisma.forwarder_countries.findMany({ select: { country_id: true }, distinct: ['country_id'] }).then(r => r.length),
    prisma.forwarders.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: 8,
      select: {
        id: true,
        company_name: true,
        partnership_status: true,
        trust_level: true,
        contact_person: true,
        phone: true,
        created_at: true,
        next_follow_up_date: true,
      },
    }),
    prisma.forwarders.groupBy({
      by: ['partnership_status'],
      where: { deleted_at: null },
      _count: true,
    }),
    prisma.forwarders.findMany({
      where: {
        deleted_at: null,
        next_follow_up_date: { not: null, lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { next_follow_up_date: 'asc' },
      take: 5,
      select: {
        id: true,
        company_name: true,
        next_follow_up_date: true,
        partnership_status: true,
      },
    }),
  ])

  return { totalForwarders, validatedPartners, totalWarehouses, totalCountries, recentForwarders, statusCounts, followUps }
}

export default async function DashboardPage() {
  let stats
  try {
    stats = await getStats()
  } catch {
    // If some columns don't exist yet (migration not run), show fallback
    stats = null
  }

  if (!stats) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Dashboard
        </h1>
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Exécute la migration <code className="text-sm px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>002_crm_updates.sql</code> dans Supabase, puis relance la page.
          </p>
        </div>
      </div>
    )
  }

  const { totalForwarders, validatedPartners, totalWarehouses, totalCountries, recentForwarders, statusCounts, followUps } = stats

  const statCards = [
    { label: 'Transitaires', value: totalForwarders, icon: Users, color: '#6366f1' },
    { label: 'Partenaires validés', value: validatedPartners, icon: TrendingUp, color: '#10b981' },
    { label: 'Entrepôts', value: totalWarehouses, icon: Warehouse, color: '#f59e0b' },
    { label: 'Pays couverts', value: totalCountries, icon: Globe, color: '#06b6d4' },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        Dashboard
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label}
                 className="rounded-xl p-5"
                 style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {stat.label}
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ backgroundColor: stat.color + '20' }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {stat.value}
              </p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline CRM */}
        <div className="rounded-xl p-5"
             style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Pipeline CRM
          </h2>
          <div className="space-y-1">
            {Object.entries(PARTNERSHIP_STATUS).map(([key, { label, color }]) => {
              const count = statusCounts.find(s => s.partnership_status === key)?._count ?? 0
              return (
                <Link key={key} href={`/transitaires?status=${key}`} 
                      className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg transition-colors hover:bg-[var(--color-bg-hover)]">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${color}`}>
                    {label}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {count}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Derniers transitaires */}
        <div className="lg:col-span-2 rounded-xl p-5"
             style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Derniers transitaires ajoutés
            </h2>
            <Link href="/transitaires" className="text-xs flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
              Voir tout <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {recentForwarders.map((f) => {
              const status = PARTNERSHIP_STATUS[f.partnership_status as keyof typeof PARTNERSHIP_STATUS]
              const trust = f.trust_level ? TRUST_LEVELS[f.trust_level as keyof typeof TRUST_LEVELS] : null
              return (
                <Link key={f.id} href={`/transitaires/${f.id}`}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors hover:bg-[var(--color-bg-hover)]">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {f.company_name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {f.contact_person} • {f.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {trust && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${trust.color}`}>
                        {trust.label}
                      </span>
                    )}
                    {status && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      {formatRelativeDate(f.created_at)}
                    </span>
                  </div>
                </Link>
              )
            })}
            {recentForwarders.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                Aucun transitaire enregistré
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Relances à venir */}
      {followUps.length > 0 && (
        <div className="rounded-xl p-5"
             style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <CalendarClock className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            Relances à venir (7 prochains jours)
          </h2>
          <div className="space-y-2">
            {followUps.map((f) => {
              const status = PARTNERSHIP_STATUS[f.partnership_status as keyof typeof PARTNERSHIP_STATUS]
              const isOverdue = f.next_follow_up_date && new Date(f.next_follow_up_date) < new Date()
              return (
                <Link key={f.id} href={`/transitaires/${f.id}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg"
                      style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {f.company_name}
                  </span>
                  <div className="flex items-center gap-2">
                    {status && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    )}
                    <span className={`text-xs font-medium ${isOverdue ? 'text-red-400' : ''}`}
                          style={isOverdue ? {} : { color: 'var(--color-text-secondary)' }}>
                      {isOverdue ? '⚠️ ' : ''}{new Date(f.next_follow_up_date!).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
