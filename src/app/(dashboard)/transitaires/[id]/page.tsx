import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PARTNERSHIP_STATUS, TRUST_LEVELS, RECOMMENDATIONS, formatDate, formatRelativeDate } from '@/lib/utils'
import { updateForwarder, deleteForwarder } from '@/actions/forwarders'
import { addInteraction } from '@/actions/interactions'
import {
  addCountry, removeCountry,
  addTransportMode, removeTransportMode,
  addCategory, removeCategory,
  addWarehouse, removeWarehouse,
  addPricingRule, removePricingRule,
} from '@/actions/relations'
import { ArrowLeft, Save, Trash2, Building2, Phone, Mail, MapPin, Globe, FileText, StickyNote, CalendarClock, Star, Plus, X, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import DocumentSection from '@/components/forwarders/DocumentSection'

export const dynamic = 'force-dynamic'

export default async function ForwarderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [forwarder, allCountries, allTransportModes, allCategories] = await Promise.all([
    prisma.forwarders.findUnique({
      where: { id },
      include: {
        forwarder_countries: {
          include: { countries: true },
        },
        forwarder_transport_modes: {
          include: { transport_modes: true },
        },
        forwarder_categories: {
          include: { product_categories: true },
        },
        warehouses: {
          where: { deleted_at: null },
          include: { countries: true },
        },
        pricing_rules: {
          where: { deleted_at: null },
          include: {
            countries: true,
            transport_modes: true,
            pricing_tiers: true,
          },
        },
        delivery_estimates: {
          include: {
            countries: true,
            transport_modes: true,
          },
        },
        forwarder_interactions: {
          orderBy: { interaction_date: 'desc' },
          take: 10,
        },
        forwarder_documents: {
          where: { is_active: true },
          orderBy: { created_at: 'desc' },
        },
        internal_users_forwarders_assigned_commercial_idTointernal_users: true,
      },
    }),
    prisma.countries.findMany({ where: { is_active: true }, orderBy: { name: 'asc' } }),
    prisma.transport_modes.findMany({ where: { is_active: true }, orderBy: { name: 'asc' } }),
    prisma.product_categories.findMany({ where: { is_active: true }, orderBy: { sort_order: 'asc' } }),
  ])

  if (!forwarder || forwarder.deleted_at) {
    notFound()
  }

  const updateAction = updateForwarder.bind(null, id)
  const deleteAction = async () => {
    'use server'
    await deleteForwarder(id)
  }

  // Bind server actions with forwarder ID
  const addCountryAction = addCountry.bind(null, id)
  const addTransportModeAction = addTransportMode.bind(null, id)
  const addCategoryAction = addCategory.bind(null, id)
  const addWarehouseAction = addWarehouse.bind(null, id)
  const addPricingAction = addPricingRule.bind(null, id)
  const addInteractionAction = addInteraction.bind(null, id)

  const status = PARTNERSHIP_STATUS[forwarder.partnership_status as keyof typeof PARTNERSHIP_STATUS]
  const trust = forwarder.trust_level ? TRUST_LEVELS[forwarder.trust_level as keyof typeof TRUST_LEVELS] : null
  const recommendation = forwarder.internal_recommendation
    ? RECOMMENDATIONS[forwarder.internal_recommendation as keyof typeof RECOMMENDATIONS]
    : null

  // IDs already linked (to exclude from dropdowns)
  const linkedCountryIds = new Set(forwarder.forwarder_countries.map(fc => fc.country_id))
  const linkedTransportIds = new Set(forwarder.forwarder_transport_modes.map(ftm => ftm.transport_mode_id))
  const linkedCategoryIds = new Set(forwarder.forwarder_categories.map(fc => fc.category_id))

  const availableCountries = allCountries.filter(c => !linkedCountryIds.has(c.id))
  const availableTransportModes = allTransportModes.filter(tm => !linkedTransportIds.has(tm.id))
  const availableCategories = allCategories.filter(cat => !linkedCategoryIds.has(cat.id))

  return (
    <div className="animate-fade-in max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/transitaires"
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {forwarder.company_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {status && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                  {status.label}
                </span>
              )}
              {trust && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${trust.color}`}>
                  {trust.label}
                </span>
              )}
              {recommendation && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${recommendation.color}`}>
                  {recommendation.icon} {recommendation.label}
                </span>
              )}
            </div>
          </div>
        </div>
        <form action={deleteAction}>
          <button type="submit"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
            Supprimer
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===================== COLONNE GAUCHE ===================== */}
        <div className="lg:col-span-2 space-y-6">

          {/* --- Informations éditables --- */}
          <form action={updateAction}>
            <section className="rounded-xl p-5 space-y-4"
                     style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  <Building2 className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                  Informations
                </h2>
                <button type="submit"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                        style={{ backgroundColor: 'var(--color-accent)' }}>
                  <Save className="w-3 h-3" />
                  Sauvegarder
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Entreprise</label>
                  <input name="company_name" defaultValue={forwarder.company_name} className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Contact</label>
                  <input name="contact_person" defaultValue={forwarder.contact_person} className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    <Phone className="w-3 h-3 inline mr-1" />Téléphone
                  </label>
                  <input name="phone" defaultValue={forwarder.phone} className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>WhatsApp</label>
                  <input name="whatsapp" defaultValue={forwarder.whatsapp || ''} className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    <Mail className="w-3 h-3 inline mr-1" />Email
                  </label>
                  <input name="email" type="email" defaultValue={forwarder.email || ''} className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    <FileText className="w-3 h-3 inline mr-1" />RCCM
                  </label>
                  <input name="rccm" defaultValue={forwarder.rccm || ''} className="w-full text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  <MapPin className="w-3 h-3 inline mr-1" />Adresse Abidjan
                </label>
                <input name="address_abidjan" defaultValue={forwarder.address_abidjan || ''} className="w-full text-sm" />
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Description</label>
                <textarea name="description" defaultValue={forwarder.description || ''} rows={2} className="w-full text-sm" />
              </div>

              {/* CRM inline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3"
                   style={{ borderTop: '1px solid var(--color-border)' }}>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Statut CRM</label>
                  <select name="partnership_status" defaultValue={forwarder.partnership_status} className="w-full text-sm">
                    {Object.entries(PARTNERSHIP_STATUS).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Confiance</label>
                  <select name="trust_level" defaultValue={forwarder.trust_level?.toString() || ''} className="w-full text-sm">
                    <option value="">Non évalué</option>
                    {Object.entries(TRUST_LEVELS).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    <Star className="w-3 h-3 inline mr-1" />Recommandation
                  </label>
                  <select name="internal_recommendation" defaultValue={forwarder.internal_recommendation || ''} className="w-full text-sm">
                    <option value="">Non évalué</option>
                    {Object.entries(RECOMMENDATIONS).map(([key, { label, icon }]) => (
                      <option key={key} value={key}>{icon} {label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    <CalendarClock className="w-3 h-3 inline mr-1" />Prochaine relance
                  </label>
                  <input name="next_follow_up_date" type="date" className="w-full text-sm"
                         defaultValue={forwarder.next_follow_up_date ? new Date(forwarder.next_follow_up_date).toISOString().split('T')[0] : ''} />
                </div>
              </div>

              {/* Notes */}
              <div className="pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  <StickyNote className="w-3 h-3 inline mr-1" />Notes internes
                </label>
                <textarea name="internal_notes" defaultValue={forwarder.internal_notes || ''} rows={3} className="w-full text-sm"
                          placeholder="Observations terrain, remarques, expérience..." />
              </div>
            </section>
          </form>

          {/* --- SECTION ENTREPÔTS --- */}
          <section className="rounded-xl p-5"
                   style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              🏭 Entrepôts ({forwarder.warehouses.length})
            </h2>

            {/* Liste existante */}
            {forwarder.warehouses.length > 0 && (
              <div className="space-y-2 mb-4">
                {forwarder.warehouses.map(w => {
                  const removeAction = async () => {
                    'use server'
                    await removeWarehouse(w.id, id)
                  }
                  return (
                    <div key={w.id} className="flex items-start justify-between p-3 rounded-lg"
                         style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                      <div className="text-xs">
                        <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {w.countries.flag_emoji} {w.city}
                        </p>
                        <p style={{ color: 'var(--color-text-muted)' }}>{w.full_address}</p>
                        {w.contact_name && (
                          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                            📞 {w.contact_name} — {w.contact_phone}
                          </p>
                        )}
                      </div>
                      <form action={removeAction}>
                        <button type="submit" className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Formulaire d'ajout */}
            <form action={addWarehouseAction} className="rounded-lg p-3 space-y-2"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px dashed var(--color-border)' }}>
              <p className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                <Plus className="w-3 h-3" /> Ajouter un entrepôt
              </p>
              <div className="grid grid-cols-2 gap-2">
                <select name="country_id" required className="text-xs">
                  <option value="">Pays...</option>
                  {allCountries.map(c => (
                    <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>
                  ))}
                </select>
                <input name="city" placeholder="Ville" required className="text-xs" />
              </div>
              <input name="full_address" placeholder="Adresse complète" required className="text-xs w-full" />
              <div className="grid grid-cols-2 gap-2">
                <input name="contact_name" placeholder="Nom contact (optionnel)" className="text-xs" />
                <input name="contact_phone" placeholder="Tél. contact (optionnel)" className="text-xs" />
              </div>
              <button type="submit"
                      className="w-full py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ backgroundColor: 'var(--color-accent)' }}>
                Ajouter
              </button>
            </form>
          </section>

          {/* --- SECTION TARIFS --- */}
          <section className="rounded-xl p-5"
                   style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              💰 Tarifs ({forwarder.pricing_rules.length})
            </h2>

            {/* Liste existante */}
            {forwarder.pricing_rules.length > 0 && (
              <div className="space-y-3 mb-4">
                {forwarder.pricing_rules.map(rule => {
                  const removeAction = async () => {
                    'use server'
                    await removePricingRule(rule.id, id)
                  }
                  return (
                    <div key={rule.id} className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{rule.countries.flag_emoji} {rule.countries.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded"
                                style={{ backgroundColor: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)' }}>
                            {rule.transport_modes.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded"
                                style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: 'var(--color-accent)' }}>
                            {rule.pricing_type}/{rule.currency}
                          </span>
                        </div>
                        <form action={removeAction}>
                          <button type="submit" className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {rule.pricing_tiers.map(tier => (
                          <div key={tier.id} className="text-xs p-2 rounded"
                               style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              {tier.min_value.toString()}—{tier.max_value?.toString() ?? '∞'} {tier.unit}
                            </span>
                            <br />
                            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                              {Number(tier.price_per_unit.toString()).toLocaleString('fr-FR')} {rule.currency}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Formulaire d'ajout */}
            <form action={addPricingAction} className="rounded-lg p-3 space-y-2"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px dashed var(--color-border)' }}>
              <p className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                <Plus className="w-3 h-3" /> Ajouter un tarif
              </p>
              <div className="grid grid-cols-2 gap-2">
                <select name="country_id" required className="text-xs">
                  <option value="">Pays...</option>
                  {allCountries.map(c => (
                    <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>
                  ))}
                </select>
                <select name="transport_mode_id" required className="text-xs">
                  <option value="">Mode...</option>
                  {allTransportModes.map(tm => (
                    <option key={tm.id} value={tm.id}>{tm.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <input name="min_value" type="number" step="0.01" placeholder="Min" className="text-xs" defaultValue="0" />
                <input name="max_value" type="number" step="0.01" placeholder="Max (vide=∞)" className="text-xs" />
                <input name="price_per_unit" type="number" step="1" placeholder="Prix/unité" required className="text-xs" />
                <select name="unit" className="text-xs">
                  <option value="KG">KG</option>
                  <option value="CBM">CBM</option>
                  <option value="UNIT">Unité</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select name="currency" className="text-xs">
                  <option value="XOF">XOF (FCFA)</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="CNY">CNY (Yuan)</option>
                </select>
              </div>
              <button type="submit"
                      className="w-full py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ backgroundColor: 'var(--color-accent)' }}>
                Ajouter le tarif
              </button>
            </form>
          </section>

          {/* --- SECTION INTERACTIONS (TIMELINE) --- */}
          <section className="rounded-xl p-5"
                   style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <MessageSquare className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              Historique des interactions ({forwarder.forwarder_interactions.length})
            </h2>

            {/* Formulaire d'ajout */}
            <form action={addInteractionAction} className="rounded-lg p-3 space-y-2 mb-4"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px dashed var(--color-border)' }}>
              <p className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                <Plus className="w-3 h-3" /> Ajouter une interaction
              </p>
              <div className="grid grid-cols-2 gap-2">
                <select name="interaction_type" required className="text-xs">
                  <option value="">Type...</option>
                  <option value="call">📞 Appel</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="meeting">🤝 Rendez-vous</option>
                  <option value="email">📧 Email</option>
                  <option value="visit">🏭 Visite entrepôt</option>
                  <option value="document_received">📄 Document reçu</option>
                  <option value="negotiation">💼 Négociation</option>
                  <option value="note">📝 Note</option>
                  <option value="other">Autre</option>
                </select>
                <input name="interaction_date" type="date" className="text-xs"
                       defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <input name="title" placeholder="Titre (ex: RDV au bureau)" required className="text-xs w-full" />
              <textarea name="description" placeholder="Détails, remarques..." rows={2} className="text-xs w-full" />
              <div>
                <label className="block text-[10px] mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  📅 Prochaine relance (optionnel)
                </label>
                <input name="next_follow_up_date" type="date" className="text-xs w-full" />
              </div>
              <button type="submit"
                      className="w-full py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ backgroundColor: 'var(--color-accent)' }}>
                Enregistrer l&apos;interaction
              </button>
            </form>

            {/* Timeline */}
            {forwarder.forwarder_interactions.length > 0 ? (
              <div className="relative pl-4" style={{ borderLeft: '2px solid var(--color-border)' }}>
                {forwarder.forwarder_interactions.map((inter) => {
                  const typeIcons: Record<string, string> = {
                    call: '📞', whatsapp: '💬', meeting: '🤝', email: '📧',
                    visit: '🏭', document_received: '📄', negotiation: '💼',
                    note: '📝', status_change: '🔄', other: '📌',
                  }
                  const icon = typeIcons[inter.interaction_type] || '📌'
                  return (
                    <div key={inter.id} className="relative mb-4 last:mb-0">
                      <div className="absolute -left-[calc(1rem+5px)] top-1 w-2 h-2 rounded-full"
                           style={{ backgroundColor: 'var(--color-accent)' }} />
                      <div className="text-xs">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span>{icon}</span>
                          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {inter.title}
                          </span>
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            {formatRelativeDate(inter.interaction_date)}
                          </span>
                        </div>
                        {inter.description && (
                          <p className="ml-5" style={{ color: 'var(--color-text-secondary)' }}>
                            {inter.description}
                          </p>
                        )}
                        {inter.next_follow_up_date && (
                          <p className="ml-5 mt-0.5" style={{ color: 'var(--color-accent)' }}>
                            📅 Relance : {formatDate(inter.next_follow_up_date)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                Aucune interaction enregistrée
              </p>
            )}
          </section>

          {/* --- SECTION DOCUMENTS --- */}
          <DocumentSection forwarderId={id} documents={forwarder.forwarder_documents} />
        </div>

        {/* ===================== COLONNE DROITE ===================== */}
        <div className="space-y-6">

          {/* Infos rapides */}
          <section className="rounded-xl p-5"
                   style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Résumé
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Premier contact</span>
                <p style={{ color: 'var(--color-text-primary)' }}>{formatDate(forwarder.first_contact_date)}</p>
              </div>
              <div>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Dernier contact</span>
                <p style={{ color: 'var(--color-text-primary)' }}>{formatDate(forwarder.last_contact_date)}</p>
              </div>
              <div>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Créé le</span>
                <p style={{ color: 'var(--color-text-primary)' }}>{formatDate(forwarder.created_at)}</p>
              </div>
              {forwarder.internal_users_forwarders_assigned_commercial_idTointernal_users && (
                <div>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Commercial</span>
                  <p style={{ color: 'var(--color-text-primary)' }}>
                    {forwarder.internal_users_forwarders_assigned_commercial_idTointernal_users.full_name}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* --- PAYS COUVERTS --- */}
          <section className="rounded-xl p-5"
                   style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Globe className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              Pays couverts ({forwarder.forwarder_countries.length})
            </h2>

            {forwarder.forwarder_countries.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {forwarder.forwarder_countries.map(fc => {
                  const removeAction = async () => {
                    'use server'
                    await removeCountry(fc.id, id)
                  }
                  return (
                    <div key={fc.id} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg"
                         style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
                      {fc.countries.flag_emoji} {fc.countries.name}
                      <form action={removeAction} className="inline">
                        <button type="submit" className="ml-1 text-red-400 hover:text-red-300">
                          <X className="w-3 h-3" />
                        </button>
                      </form>
                    </div>
                  )
                })}
              </div>
            )}

            {availableCountries.length > 0 && (
              <form action={addCountryAction} className="flex gap-2">
                <select name="country_id" required className="flex-1 text-xs">
                  <option value="">Ajouter un pays...</option>
                  {availableCountries.map(c => (
                    <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>
                  ))}
                </select>
                <button type="submit"
                        className="px-2 py-1 rounded-lg text-white"
                        style={{ backgroundColor: 'var(--color-accent)' }}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </section>

          {/* --- MODES DE TRANSPORT --- */}
          <section className="rounded-xl p-5"
                   style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              🚚 Modes de transport ({forwarder.forwarder_transport_modes.length})
            </h2>

            {forwarder.forwarder_transport_modes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {forwarder.forwarder_transport_modes.map(ftm => {
                  const removeAction = async () => {
                    'use server'
                    await removeTransportMode(ftm.id, id)
                  }
                  return (
                    <div key={ftm.id} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg"
                         style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
                      {ftm.transport_modes.name}
                      <form action={removeAction} className="inline">
                        <button type="submit" className="ml-1 text-red-400 hover:text-red-300">
                          <X className="w-3 h-3" />
                        </button>
                      </form>
                    </div>
                  )
                })}
              </div>
            )}

            {availableTransportModes.length > 0 && (
              <form action={addTransportModeAction} className="flex gap-2">
                <select name="transport_mode_id" required className="flex-1 text-xs">
                  <option value="">Ajouter un mode...</option>
                  {availableTransportModes.map(tm => (
                    <option key={tm.id} value={tm.id}>{tm.name}</option>
                  ))}
                </select>
                <button type="submit"
                        className="px-2 py-1 rounded-lg text-white"
                        style={{ backgroundColor: 'var(--color-accent)' }}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </section>

          {/* --- CATÉGORIES --- */}
          <section className="rounded-xl p-5"
                   style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              📦 Catégories ({forwarder.forwarder_categories.length})
            </h2>

            {forwarder.forwarder_categories.length > 0 && (
              <div className="space-y-1 mb-3">
                {forwarder.forwarder_categories.map(fc => {
                  const removeAction = async () => {
                    'use server'
                    await removeCategory(fc.id, id)
                  }
                  return (
                    <div key={fc.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg"
                         style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                      <span style={{ color: 'var(--color-text-primary)' }}>
                        {fc.product_categories.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          fc.is_accepted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {fc.is_accepted ? '✓ Accepté' : '✗ Refusé'}
                        </span>
                        <form action={removeAction} className="inline">
                          <button type="submit" className="text-red-400 hover:text-red-300">
                            <X className="w-3 h-3" />
                          </button>
                        </form>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {availableCategories.length > 0 && (
              <form action={addCategoryAction} className="flex gap-2">
                <select name="category_id" required className="flex-1 text-xs">
                  <option value="">Ajouter une catégorie...</option>
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <select name="is_accepted" className="text-xs" style={{ width: '90px' }}>
                  <option value="true">✓ Accepté</option>
                  <option value="false">✗ Refusé</option>
                </select>
                <button type="submit"
                        className="px-2 py-1 rounded-lg text-white"
                        style={{ backgroundColor: 'var(--color-accent)' }}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
