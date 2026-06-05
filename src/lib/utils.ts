import { clsx, type ClassValue } from 'clsx'

// Simple cn utility without tailwind-merge (avoiding extra dependency)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Format a date to French locale
export function formatDate(date: string | Date | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Format a date relative (e.g., "il y a 3 jours")
export function formatRelativeDate(date: string | Date | null): string {
  if (!date) return '—'
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`
  return formatDate(date)
}

// Partnership status labels and colors
export const PARTNERSHIP_STATUS = {
  prospect: { label: 'Prospect', color: 'bg-gray-500/20 text-gray-300' },
  contacted: { label: 'Contacté', color: 'bg-blue-500/20 text-blue-300' },
  rdv_planned: { label: 'RDV prévu', color: 'bg-cyan-500/20 text-cyan-300' },
  in_discussion: { label: 'En discussion', color: 'bg-yellow-500/20 text-yellow-300' },
  testing: { label: 'Test en cours', color: 'bg-orange-500/20 text-orange-300' },
  validated: { label: 'Partenaire validé', color: 'bg-emerald-500/20 text-emerald-300' },
  refused: { label: 'Refusé', color: 'bg-red-500/20 text-red-300' },
  suspended: { label: 'Suspendu', color: 'bg-rose-500/20 text-rose-300' },
} as const

// Trust level labels
export const TRUST_LEVELS = {
  1: { label: 'Faible', color: 'bg-red-500/20 text-red-300' },
  2: { label: 'Moyen', color: 'bg-yellow-500/20 text-yellow-300' },
  3: { label: 'Élevé', color: 'bg-blue-500/20 text-blue-300' },
  4: { label: 'Premium', color: 'bg-emerald-500/20 text-emerald-300' },
} as const

// Recommendation labels
export const RECOMMENDATIONS = {
  highly_recommended: { label: 'Fortement recommandé', color: 'bg-emerald-500/20 text-emerald-300', icon: '⭐⭐⭐' },
  recommended: { label: 'Recommandé', color: 'bg-blue-500/20 text-blue-300', icon: '⭐⭐' },
  neutral: { label: 'Neutre', color: 'bg-gray-500/20 text-gray-300', icon: '⭐' },
  not_recommended: { label: 'Non recommandé', color: 'bg-red-500/20 text-red-300', icon: '⛔' },
} as const

// Interaction type labels
export const INTERACTION_TYPES = {
  call: { label: 'Appel', icon: 'Phone' },
  whatsapp: { label: 'WhatsApp', icon: 'MessageCircle' },
  meeting: { label: 'Rendez-vous', icon: 'Users' },
  email: { label: 'Email', icon: 'Mail' },
  document_received: { label: 'Document reçu', icon: 'FileCheck' },
  visit: { label: 'Visite', icon: 'MapPin' },
  negotiation: { label: 'Négociation', icon: 'Handshake' },
  note: { label: 'Note', icon: 'StickyNote' },
  status_change: { label: 'Changement statut', icon: 'ArrowRightLeft' },
  other: { label: 'Autre', icon: 'MoreHorizontal' },
} as const

// Document type labels
export const DOCUMENT_TYPES = {
  rccm: { label: 'RCCM' },
  logo: { label: 'Logo' },
  business_card: { label: 'Carte de visite' },
  partnership_contract: { label: 'Contrat partenariat' },
  photo: { label: 'Photo' },
  photo_office: { label: 'Photo bureau' },
  photo_warehouse: { label: 'Photo entrepôt' },
  photo_contact: { label: 'Photo responsable' },
  other: { label: 'Autre' },
} as const
