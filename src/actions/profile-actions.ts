'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Non connecté' }

  const fullName = (formData.get('full_name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null

  if (!fullName || fullName.length < 2) {
    return { error: 'Le nom doit contenir au moins 2 caractères' }
  }

  await prisma.internal_users.update({
    where: { id: user.id },
    data: {
      full_name: fullName,
      phone: phone,
    },
  })

  revalidatePath('/profil')
  revalidatePath('/') // Rafraîchir le header partout
  return { success: true }
}

export async function changePassword(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Non connecté' }

  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!newPassword || newPassword.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caractères' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Les mots de passe ne correspondent pas' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: 'Erreur lors du changement de mot de passe' }
  }

  return { success: true }
}
