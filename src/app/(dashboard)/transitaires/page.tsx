import { prisma } from '@/lib/prisma'
import { PARTNERSHIP_STATUS, TRUST_LEVELS, formatDate } from '@/lib/utils'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import ForwarderRow from '@/components/forwarders/ForwarderRow'
import ForwarderCard from '@/components/forwarders/ForwarderCard'

export const dynamic = 'force-dynamic'

export default async function TransitairesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; trust?: string }>
}) {
  const params = await searchParams
  const statusFilter = params.status
  const searchQuery = params.search
  const trustFilter = params.trust

  const where: Record<string, unknown> = { deleted_at: null }
  if (statusFilter && statusFilter !== 'all') {
    where.partnership_status = statusFilter
  }
  if (trustFilter && trustFilter !== 'all') {
    where.trust_level = parseInt(trustFilter)
  }
  if (searchQuery) {
    where.OR = [
      { company_name: { contains: searchQuery, mode: 'insensitive' } },
      { contact_person: { contains: searchQuery, mode: 'insensitive' } },
      { phone: { contains: searchQuery, mode: 'insensitive' } },
    ]
  }

  const forwarders = await prisma.forwarders.findMany({
    where,
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      company_name: true,
      contact_person: true,
      phone: true,
      whatsapp: true,
      email: true,
      rccm: true,
      address_abidjan: true,
      description: true,
      partnership_status: true,
      trust_level: true,
      internal_recommendation: true,
      internal_notes: true,
      next_follow_up_date: true,
      created_at: true,
      forwarder_countries: {
        select: { countries: { select: { name: true, flag_emoji: true } } },
      },
    },
  })

  const hasFilters = !!(statusFilter && statusFilter !== 'all') || !!(trustFilter && trustFilter !== 'all') || !!searchQuery

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Transitaires
          <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-muted)' }}>
            ({forwarders.length})
          </span>
        </h1>
        {/* Bouton "Nouveau" visible sur desktop uniquement (FAB sur mobile) */}
        <Link href="/transitaires/nouveau" className="btn btn-primary hidden md:inline-flex text-sm">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nouveau transitaire
        </Link>
      </div>

      {/* Filtres */}
      <form method="GET" className="space-y-2">
        {/* Recherche */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            name="search"
            type="search"
            defaultValue={searchQuery}
            placeholder="Rechercher par nom, contact, téléphone..."
            className="pl-10 pr-4"
            autoComplete="off"
          />
        </div>

        {/* Filtres chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          {/* Filtre statut */}
          {Object.entries(PARTNERSHIP_STATUS).map(([key, { label }]) => (
            <Link
              key={key}
              href={`/transitaires?${new URLSearchParams({ ...(searchQuery ? { search: searchQuery } : {}), status: key, ...(trustFilter && trustFilter !== 'all' ? { trust: trustFilter } : {}) }).toString()}`}
              className="px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all"
              style={{
                background: statusFilter === key ? 'var(--accent)' : 'var(--bg-elevated)',
                color: statusFilter === key ? 'white' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: statusFilter === key ? 'var(--accent)' : 'var(--border-subtle)',
              }}
            >
              {label}
            </Link>
          ))}
          {hasFilters && (
            <Link
              href="/transitaires"
              className="px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all"
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger-text)',
                border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
              }}
            >
              ✕ Effacer
            </Link>
          )}
        </div>
      </form>

      {forwarders.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
            <Search className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {hasFilters ? 'Aucun résultat pour ces filtres' : 'Aucun transitaire enregistré'}
          </p>
          {!hasFilters && (
            <Link href="/transitaires/nouveau" className="btn btn-primary inline-flex">
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Ajouter le premier
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Vue CARTES — mobile */}
          <div className="space-y-3 md:hidden">
            {forwarders.map((f) => (
              <ForwarderCard
                key={f.id}
                forwarder={{
                  ...f,
                  countries: f.forwarder_countries.map(fc => fc.countries),
                }}
              />
            ))}
          </div>

          {/* Vue TABLEAU — desktop */}
          <div
            className="hidden md:block rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Entreprise', 'Contact', 'Statut', 'Confiance', 'Pays', 'Relance', 'Ajouté', ''].map((h, i) => (
                    <th
                      key={i}
                      className="text-left px-4 py-3 text-xs font-medium"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forwarders.map((f) => (
                  <ForwarderRow
                    key={f.id}
                    forwarder={f}
                    countries={f.forwarder_countries.map(fc => fc.countries)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
