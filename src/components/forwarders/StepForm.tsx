'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createForwarder } from '@/actions/forwarders'
import {
  ArrowLeft, ArrowRight, Check, Building2,
  Phone, Mail, MapPin, Star, StickyNote, Camera,
  MessageCircle, Navigation
} from 'lucide-react'
import { PARTNERSHIP_STATUS, TRUST_LEVELS, RECOMMENDATIONS } from '@/lib/utils'
import Link from 'next/link'

// ────────── Types ──────────
type FormData = {
  // Étape 1
  company_name: string
  contact_person: string
  rccm: string
  description: string
  // Étape 2
  phone: string
  whatsapp: string
  email: string
  address_abidjan: string
  // Étape 3
  partnership_status: string
  trust_level: string
  internal_recommendation: string
  next_follow_up_date: string
  first_contact_date: string
  internal_notes: string
}

const INITIAL: FormData = {
  company_name: '', contact_person: '', rccm: '', description: '',
  phone: '', whatsapp: '', email: '', address_abidjan: '',
  partnership_status: 'prospect', trust_level: '', internal_recommendation: '',
  next_follow_up_date: '', first_contact_date: new Date().toISOString().split('T')[0],
  internal_notes: '',
}

const STEPS = [
  { label: 'Identité',   icon: Building2 },
  { label: 'Contacts',   icon: Phone },
  { label: 'Suivi CRM',  icon: Star },
  { label: 'Notes',      icon: StickyNote },
]

const LS_KEY = 'mt_draft_forwarder'

// ────────── Composants de champ ──────────
function Field({
  label, required, children,
}: {
  label: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

// ────────── Stepper ──────────
function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        const Icon = step.icon
        return (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0 transition-all duration-300"
              style={{
                width: '28px',
                height: '28px',
                background: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--bg-elevated)',
                border: active ? '2px solid var(--accent-hover)' : 'none',
              }}
            >
              {done
                ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                : <Icon className="w-3.5 h-3.5" style={{ color: active ? 'white' : 'var(--text-muted)' }} />
              }
            </div>
            {i < total - 1 && (
              <div
                className="flex-1 h-0.5 rounded-full transition-all duration-300"
                style={{ background: done ? 'var(--success)' : 'var(--border-subtle)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ────────── Étapes ──────────
function Step1({ data, onChange }: { data: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-4 animate-slide-right">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Identité</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Informations de base de l'entreprise</p>
      </div>
      <Field label="Nom de l'entreprise" required>
        <input
          value={data.company_name}
          onChange={e => onChange('company_name', e.target.value)}
          placeholder="Ex: Golden Bridge Logistics"
          autoFocus
          autoCapitalize="words"
        />
      </Field>
      <Field label="Personne de contact" required>
        <input
          value={data.contact_person}
          onChange={e => onChange('contact_person', e.target.value)}
          placeholder="Ex: M. KONÉ Ibrahim"
          autoCapitalize="words"
        />
      </Field>
      <Field label="RCCM">
        <input
          value={data.rccm}
          onChange={e => onChange('rccm', e.target.value)}
          placeholder="CI-ABJ-2021-B-12345"
          autoCapitalize="characters"
        />
      </Field>
      <Field label="Description courte">
        <textarea
          value={data.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Spécialiste fret Chine → Côte d'Ivoire..."
          rows={3}
        />
      </Field>
    </div>
  )
}

function Step2({ data, onChange }: { data: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-4 animate-slide-right">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Coordonnées</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Comment joindre ce transitaire ?</p>
      </div>
      <Field label="Téléphone" required>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="tel"
            value={data.phone}
            onChange={e => onChange('phone', e.target.value)}
            placeholder="+225 07 00 00 00 00"
            className="pl-10"
          />
        </div>
      </Field>

      {/* Actions rapides si numéro rempli */}
      {data.phone && (
        <div className="flex gap-2">
          <a
            href={`tel:${data.phone.replace(/\s/g, '')}`}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all active:scale-95"
            style={{ height: '40px', background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)' }}
          >
            <Phone className="w-4 h-4" /> Appeler
          </a>
          <a
            href={`https://wa.me/${data.phone.replace(/[\s+]/g, '')}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all active:scale-95"
            style={{ height: '40px', background: '#05140a', color: '#22c55e', border: '1px solid #166534' }}
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        </div>
      )}

      <Field label="WhatsApp (si différent)">
        <div className="relative">
          <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="tel"
            value={data.whatsapp}
            onChange={e => onChange('whatsapp', e.target.value)}
            placeholder="+225 07 00 00 00 00"
            className="pl-10"
          />
        </div>
      </Field>
      <Field label="Email">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="email"
            value={data.email}
            onChange={e => onChange('email', e.target.value)}
            placeholder="contact@entreprise.com"
            className="pl-10"
            autoCapitalize="none"
            inputMode="email"
          />
        </div>
      </Field>
      <Field label="Adresse à Abidjan">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            value={data.address_abidjan}
            onChange={e => onChange('address_abidjan', e.target.value)}
            placeholder="Treichville, Zone 4..."
            className="pl-10"
            autoCapitalize="words"
          />
        </div>
      </Field>
      {/* Localiser */}
      {data.address_abidjan && (
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(data.address_abidjan + ', Abidjan')}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-lg text-sm font-medium transition-all active:scale-95"
          style={{ height: '40px', background: 'var(--info-bg)', color: 'var(--info-text)', border: '1px solid color-mix(in srgb, var(--info) 30%, transparent)' }}
        >
          <Navigation className="w-4 h-4" /> Localiser sur la carte
        </a>
      )}
    </div>
  )
}

function Step3({ data, onChange }: { data: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-4 animate-slide-right">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Suivi CRM</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Où en est votre relation avec ce transitaire ?</p>
      </div>

      <Field label="Statut de la relation">
        <select value={data.partnership_status} onChange={e => onChange('partnership_status', e.target.value)}>
          {Object.entries(PARTNERSHIP_STATUS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </Field>

      <Field label="Niveau de confiance">
        <div className="grid grid-cols-2 gap-2">
          {[['', 'Non évalué'], ...Object.entries(TRUST_LEVELS).map(([k, v]) => [k, v.label])].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange('trust_level', key as string)}
              className="py-2.5 px-3 rounded-lg text-sm font-medium transition-all border text-left"
              style={{
                background: data.trust_level === key ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                borderColor: data.trust_level === key ? 'var(--accent)' : 'var(--border-subtle)',
                color: data.trust_level === key ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Recommandation interne">
        <select value={data.internal_recommendation} onChange={e => onChange('internal_recommendation', e.target.value)}>
          <option value="">Non évalué</option>
          {Object.entries(RECOMMENDATIONS).map(([key, { label, icon }]) => (
            <option key={key} value={key}>{icon} {label}</option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Premier contact">
          <input
            type="date"
            value={data.first_contact_date}
            onChange={e => onChange('first_contact_date', e.target.value)}
          />
        </Field>
        <Field label="Prochaine relance">
          <input
            type="date"
            value={data.next_follow_up_date}
            onChange={e => onChange('next_follow_up_date', e.target.value)}
          />
        </Field>
      </div>
    </div>
  )
}

function Step4({ data, onChange }: { data: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-4 animate-slide-right">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Notes terrain</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Vos observations sur le terrain</p>
      </div>

      <Field label="Notes internes">
        <textarea
          value={data.internal_notes}
          onChange={e => onChange('internal_notes', e.target.value)}
          placeholder="Sérieux, ponctuel, spécialisé fret aérien, bureau propre..."
          rows={5}
          autoFocus
        />
      </Field>

      {/* Photos — à ajouter après création */}
      <div
        className="rounded-xl p-4 text-center space-y-2"
        style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border)' }}
      >
        <Camera className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Photos disponibles après création
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Vous pourrez ajouter des photos du bureau, entrepôt et contact depuis la fiche du transitaire.
        </p>
      </div>

      {/* Résumé */}
      <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Récapitulatif</p>
        {[
          ['Entreprise', data.company_name],
          ['Contact', data.contact_person],
          ['Téléphone', data.phone],
          ['Statut', PARTNERSHIP_STATUS[data.partnership_status as keyof typeof PARTNERSHIP_STATUS]?.label],
        ].map(([label, value]) => value && (
          <div key={label} className="flex items-start justify-between gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span className="text-xs font-medium text-right" style={{ color: 'var(--text-secondary)' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ────────── Formulaire principal ──────────
export default function NouveauTransitaireStepForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const draft = localStorage.getItem(LS_KEY)
        if (draft) return { ...INITIAL, ...JSON.parse(draft) }
      } catch {}
    }
    return INITIAL
  })
  const [submitting, setSubmitting] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)

  // Vérifier le brouillon au mount
  useEffect(() => {
    const draft = localStorage.getItem(LS_KEY)
    if (draft) setHasDraft(true)
  }, [])

  // Sauvegarder brouillon automatiquement
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  }, [data])

  function onChange(key: keyof FormData, value: string) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  function validateStep(): boolean {
    if (step === 0) return !!data.company_name.trim() && !!data.contact_person.trim()
    if (step === 1) return !!data.phone.trim()
    return true
  }

  function next() {
    if (validateStep()) setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  function prev() {
    setStep(s => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v) })
      await createForwarder(fd)
      localStorage.removeItem(LS_KEY)
    } catch {
      setSubmitting(false)
    }
  }

  function clearDraft() {
    localStorage.removeItem(LS_KEY)
    setData(INITIAL)
    setHasDraft(false)
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/transitaires"
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            Nouveau transitaire
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Étape {step + 1} sur {STEPS.length}
          </p>
        </div>
      </div>

      {/* Brouillon sauvegardé */}
      {hasDraft && step === 0 && (
        <div
          className="flex items-center justify-between gap-3 p-3 rounded-xl mb-4 animate-fade-in"
          style={{ background: 'var(--warning-bg)', border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--warning-text)' }}>
            📝 Brouillon récupéré
          </p>
          <button onClick={clearDraft} className="text-xs underline" style={{ color: 'var(--warning-text)' }}>
            Effacer
          </button>
        </div>
      )}

      {/* Stepper */}
      <Stepper current={step} total={STEPS.length} />

      {/* Contenu étape */}
      <div className="min-h-[320px]">
        {step === 0 && <Step1 data={data} onChange={onChange} />}
        {step === 1 && <Step2 data={data} onChange={onChange} />}
        {step === 2 && <Step3 data={data} onChange={onChange} />}
        {step === 3 && <Step4 data={data} onChange={onChange} />}
      </div>

      {/* Erreur de validation */}
      {!validateStep() && (
        <p className="text-sm mt-3 text-center" style={{ color: 'var(--danger)' }}>
          Remplissez les champs obligatoires pour continuer
        </p>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button
            type="button"
            onClick={prev}
            className="btn btn-secondary"
            style={{ minWidth: '100px' }}
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        )}

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="btn btn-primary flex-1"
            disabled={!validateStep()}
          >
            Suivant <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary flex-1"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enregistrement...
              </span>
            ) : (
              <><Check className="w-4 h-4" strokeWidth={3} /> Créer le transitaire</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
