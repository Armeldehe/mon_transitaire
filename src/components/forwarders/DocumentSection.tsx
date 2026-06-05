'use client'

import { useState } from 'react'
import { Upload, FileText, Image, Trash2, Download, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const DOCUMENT_TYPES: Record<string, string> = {
  rccm: 'RCCM',
  logo: 'Logo',
  business_card: 'Carte de visite',
  partnership_contract: 'Contrat partenariat',
  photo_office: 'Photo bureau',
  photo_warehouse: 'Photo entrepôt',
  photo_contact: 'Photo responsable',
  photo: 'Photo terrain',
  other: 'Autre',
}

type Document = {
  id: string
  document_type: string
  file_name: string
  file_path: string
  file_size_bytes: number | bigint | null
  mime_type: string | null
  description: string | null
  created_at: Date | string
}

export default function DocumentSection({
  forwarderId,
  documents,
}: {
  forwarderId: string
  documents: Document[]
}) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.append('forwarder_id', forwarderId)

    const file = formData.get('file') as File
    if (!file || file.size === 0) {
      setError('Sélectionne un fichier')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 10 MB)')
      return
    }

    setUploading(true)

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'upload')
        return
      }

      form.reset()
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(docId: string) {
    try {
      const res = await fetch(`/api/documents?id=${docId}`)
      const data = await res.json()

      if (res.ok && data.url) {
        window.open(data.url, '_blank')
      }
    } catch {
      // silent fail
    }
  }

  async function handleDelete(docId: string) {
    setDeletingId(docId)

    try {
      const res = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId }),
      })

      if (res.ok) {
        router.refresh()
      }
    } catch {
      // silent fail
    } finally {
      setDeletingId(null)
    }
  }

  function formatFileSize(bytes: number | bigint | null): string {
    if (!bytes) return '—'
    const n = Number(bytes)
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${(n / (1024 * 1024)).toFixed(1)} MB`
  }

  function isImage(mimeType: string | null): boolean {
    return !!mimeType?.startsWith('image/')
  }

  return (
    <section className="rounded-xl p-5"
             style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
      <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"
          style={{ color: 'var(--color-text-primary)' }}>
        <FileText className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
        Documents & Photos ({documents.length})
      </h2>

      {/* Upload form */}
      <form onSubmit={handleUpload} className="rounded-lg p-3 space-y-2 mb-4"
            style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px dashed var(--color-border)' }}>
        <p className="text-xs font-medium flex items-center gap-1"
           style={{ color: 'var(--color-text-secondary)' }}>
          <Upload className="w-3 h-3" /> Ajouter un document
        </p>

        <div className="grid grid-cols-2 gap-2">
          <select name="document_type" required className="text-xs">
            <option value="">Type de document...</option>
            {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <input name="file" type="file" required className="text-xs"
                 accept="image/*,.pdf,.doc,.docx" />
        </div>

        <input name="description" placeholder="Description (optionnel)" className="text-xs w-full" />

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <button type="submit" disabled={uploading}
                className="w-full py-1.5 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent)' }}>
          {uploading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Upload en cours...
            </>
          ) : (
            'Envoyer'
          )}
        </button>
      </form>

      {/* Document list */}
      {documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-lg"
                 style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isImage(doc.mime_type) ? (
                  <Image className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                ) : (
                  <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {doc.file_name}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    {DOCUMENT_TYPES[doc.document_type] || doc.document_type}
                    {' • '}
                    {formatFileSize(doc.file_size_bytes)}
                    {doc.description && ` • ${doc.description}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <button type="button"
                        className="p-1.5 rounded hover:bg-blue-500/10 text-blue-400 transition-colors"
                        title="Télécharger"
                        onClick={() => handleDownload(doc.id)}>
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button type="button"
                        className="p-1.5 rounded hover:bg-red-500/10 text-red-400 transition-colors disabled:opacity-50"
                        title="Supprimer"
                        disabled={deletingId === doc.id}
                        onClick={() => handleDelete(doc.id)}>
                  {deletingId === doc.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
          Aucun document enregistré
        </p>
      )}
    </section>
  )
}
