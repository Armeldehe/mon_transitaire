'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'

const INTERACTION_TYPES = [
  'call', 'whatsapp', 'meeting', 'email',
  'document_received', 'visit', 'negotiation',
  'note', 'status_change', 'other',
] as const

export async function addInteraction(forwarderId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized: Vous devez être connecté pour effectuer cette action.')

  const interactionType = formData.get('interaction_type') as string
  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || null
  const dateStr = formData.get('interaction_date') as string
  const nextFollowUp = formData.get('next_follow_up_date') as string

  if (!title || !interactionType) return

  // Validate type
  if (!INTERACTION_TYPES.includes(interactionType as typeof INTERACTION_TYPES[number])) return

  await prisma.forwarder_interactions.create({
    data: {
      forwarder_id: forwarderId,
      interaction_type: interactionType,
      title,
      description,
      interaction_date: dateStr ? new Date(dateStr) : new Date(),
      next_follow_up_date: nextFollowUp ? new Date(nextFollowUp) : null,
    },
  })

  // Also update last_contact_date and next_follow_up_date on the forwarder
  const updateData: Record<string, unknown> = {
    last_contact_date: dateStr ? new Date(dateStr) : new Date(),
  }
  if (nextFollowUp) {
    updateData.next_follow_up_date = new Date(nextFollowUp)
  }

  await prisma.forwarders.update({
    where: { id: forwarderId },
    data: updateData,
  })

  revalidatePath(`/transitaires/${forwarderId}`)
  revalidatePath('/')
}
