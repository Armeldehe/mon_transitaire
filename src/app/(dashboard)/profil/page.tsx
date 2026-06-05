import { getCurrentUser } from '@/lib/auth'
import ProfileForm from './ProfileForm'
import { User, Shield, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrateur', color: 'bg-purple-500/20 text-purple-300' },
  manager: { label: 'Manager', color: 'bg-blue-500/20 text-blue-300' },
  operator: { label: 'Opérateur', color: 'bg-emerald-500/20 text-emerald-300' },
  viewer: { label: 'Lecteur', color: 'bg-gray-500/20 text-gray-300' },
}

export default async function ProfilPage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Mon Profil
        </h1>
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Impossible de charger votre profil. Veuillez vous reconnecter.
          </p>
        </div>
      </div>
    )
  }

  const role = ROLE_LABELS[user.role] || ROLE_LABELS.viewer

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        Mon Profil
      </h1>

      {/* Carte résumé */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold"
               style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
            {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {user.fullName}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {user.email}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${role.color}`}>
                <Shield className="w-3 h-3 inline-block mr-1" />
                {role.label}
              </span>
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                <Calendar className="w-3 h-3" />
                Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire client interactif */}
      <ProfileForm user={user} />
    </div>
  )
}
