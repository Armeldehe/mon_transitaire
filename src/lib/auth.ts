'use server'

import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export type CurrentUser = {
  id: string
  authUserId: string
  fullName: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Récupère l'utilisateur connecté (Supabase Auth + internal_users).
 * Retourne null si non connecté ou si pas d'entrée internal_users.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const internalUser = await prisma.internal_users.findUnique({
      where: { auth_user_id: user.id },
    })

    if (!internalUser || !internalUser.is_active) return null

    return {
      id: internalUser.id,
      authUserId: user.id,
      fullName: internalUser.full_name,
      email: internalUser.email,
      phone: internalUser.phone,
      role: internalUser.role,
      isActive: internalUser.is_active,
      createdAt: internalUser.created_at,
      updatedAt: internalUser.updated_at,
    }
  } catch {
    return null
  }
}
