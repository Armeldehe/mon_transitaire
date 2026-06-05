import { FolderOpen, Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function DocumentsPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Documents
        </h1>
      </div>

      <div className="text-center py-20 space-y-4">
        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <FolderOpen className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Base documentaire globale
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Cette section est en cours de développement.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            En attendant, les documents sont accessibles depuis chaque fiche transitaire.
          </p>
        </div>
        <Link href="/transitaires" className="btn btn-secondary inline-flex text-sm">
          Voir les transitaires
        </Link>
      </div>
    </div>
  )
}
