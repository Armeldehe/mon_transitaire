'use client'

import { useState } from 'react'
import { updateProfile, changePassword } from '@/actions/profile-actions'
import { User, Lock, CheckCircle, AlertCircle, Save, Eye, EyeOff } from 'lucide-react'
import type { CurrentUser } from '@/lib/auth'

export default function ProfileForm({ user }: { user: CurrentUser }) {
  // Info form
  const [fullName, setFullName] = useState(user.fullName)
  const [phone, setPhone] = useState(user.phone || '')
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoMessage, setInfoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password form
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault()
    setInfoLoading(true)
    setInfoMessage(null)

    const formData = new FormData()
    formData.set('full_name', fullName)
    formData.set('phone', phone)

    const result = await updateProfile(formData)

    if (result.error) {
      setInfoMessage({ type: 'error', text: result.error })
    } else {
      setInfoMessage({ type: 'success', text: 'Informations mises à jour' })
    }
    setInfoLoading(false)
    setTimeout(() => setInfoMessage(null), 4000)
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwdLoading(true)
    setPwdMessage(null)

    if (newPassword.length < 6) {
      setPwdMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' })
      setPwdLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPwdMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
      setPwdLoading(false)
      return
    }

    const formData = new FormData()
    formData.set('new_password', newPassword)
    formData.set('confirm_password', confirmPassword)

    const result = await changePassword(formData)

    if (result.error) {
      setPwdMessage({ type: 'error', text: result.error })
    } else {
      setPwdMessage({ type: 'success', text: 'Mot de passe modifié avec succès' })
      setNewPassword('')
      setConfirmPassword('')
    }
    setPwdLoading(false)
    setTimeout(() => setPwdMessage(null), 4000)
  }

  return (
    <div className="space-y-6">
      {/* Section Informations personnelles */}
      <form onSubmit={handleInfoSubmit}
            className="rounded-xl p-6 space-y-5"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Informations personnelles
          </h2>
        </div>

        {infoMessage && (
          <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
            infoMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {infoMessage.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {infoMessage.text}
          </div>
        )}

        <div>
          <label htmlFor="profile-email" className="block text-sm font-medium mb-1.5"
                 style={{ color: 'var(--color-text-secondary)' }}>
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={user.email}
            disabled
            className="w-full opacity-60 cursor-not-allowed"
          />
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            L'email ne peut pas être modifié
          </p>
        </div>

        <div>
          <label htmlFor="profile-name" className="block text-sm font-medium mb-1.5"
                 style={{ color: 'var(--color-text-secondary)' }}>
            Nom complet
          </label>
          <input
            id="profile-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            minLength={2}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className="block text-sm font-medium mb-1.5"
                 style={{ color: 'var(--color-text-secondary)' }}>
            Téléphone
          </label>
          <input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+225 07 XX XX XX XX"
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={infoLoading}
          className="flex items-center gap-2 py-2.5 px-5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          {infoLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {infoLoading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>

      {/* Section Sécurité */}
      <form onSubmit={handlePasswordSubmit}
            className="rounded-xl p-6 space-y-5"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Sécurité
          </h2>
        </div>

        {pwdMessage && (
          <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
            pwdMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {pwdMessage.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {pwdMessage.text}
          </div>
        )}

        <div>
          <label htmlFor="profile-new-password" className="block text-sm font-medium mb-1.5"
                 style={{ color: 'var(--color-text-secondary)' }}>
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              id="profile-new-password"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              required
              minLength={6}
              className="w-full pr-10"
            />
            <button type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)' }}>
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="profile-confirm-password" className="block text-sm font-medium mb-1.5"
                 style={{ color: 'var(--color-text-secondary)' }}>
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <input
              id="profile-confirm-password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Répétez le mot de passe"
              required
              minLength={6}
              className="w-full pr-10"
            />
            <button type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)' }}>
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs mt-1 text-red-400">Les mots de passe ne correspondent pas</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pwdLoading || !newPassword || !confirmPassword}
          className="flex items-center gap-2 py-2.5 px-5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          {pwdLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          {pwdLoading ? 'Modification...' : 'Modifier le mot de passe'}
        </button>
      </form>
    </div>
  )
}
