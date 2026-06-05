'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export async function createForwarder(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized: Vous devez être connecté pour effectuer cette action.')

  const data = {
    company_name: formData.get('company_name') as string,
    contact_person: formData.get('contact_person') as string,
    phone: formData.get('phone') as string,
    whatsapp: (formData.get('whatsapp') as string) || null,
    email: (formData.get('email') as string) || null,
    address_abidjan: (formData.get('address_abidjan') as string) || null,
    rccm: (formData.get('rccm') as string) || null,
    description: (formData.get('description') as string) || null,
    status: 'active' as const,
    partnership_status: (formData.get('partnership_status') as string) || 'prospect',
    trust_level: formData.get('trust_level') ? parseInt(formData.get('trust_level') as string) : null,
    internal_recommendation: (formData.get('internal_recommendation') as string) || null,
    internal_notes: (formData.get('internal_notes') as string) || null,
    next_follow_up_date: formData.get('next_follow_up_date') 
      ? new Date(formData.get('next_follow_up_date') as string) 
      : null,
    first_contact_date: formData.get('first_contact_date')
      ? new Date(formData.get('first_contact_date') as string)
      : new Date(),
  }

  const forwarder = await prisma.forwarders.create({ data })

  revalidatePath('/')
  revalidatePath('/transitaires')
  redirect(`/transitaires/${forwarder.id}`)
}

export async function updateForwarder(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized: Vous devez être connecté pour effectuer cette action.')

  const data: Record<string, unknown> = {}

  // Only update fields that were submitted
  const fields = [
    'company_name', 'contact_person', 'phone', 'whatsapp', 'email',
    'address_abidjan', 'rccm', 'description', 'partnership_status',
    'internal_recommendation', 'internal_notes', 'website',
  ]

  for (const field of fields) {
    const value = formData.get(field)
    if (value !== null) {
      data[field] = (value as string) || null
    }
  }

  // Handle special fields
  if (formData.get('trust_level')) {
    data.trust_level = parseInt(formData.get('trust_level') as string)
  }
  if (formData.has('next_follow_up_date')) {
    const dateStr = formData.get('next_follow_up_date') as string
    data.next_follow_up_date = dateStr ? new Date(dateStr) : null
  }
  if (formData.has('last_contact_date')) {
    const dateStr = formData.get('last_contact_date') as string
    data.last_contact_date = dateStr ? new Date(dateStr) : null
  }

  await prisma.forwarders.update({
    where: { id },
    data,
  })

  revalidatePath('/')
  revalidatePath('/transitaires')
  revalidatePath(`/transitaires/${id}`)
}

export async function deleteForwarder(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized: Vous devez être connecté pour effectuer cette action.')

  // Soft delete via direct update (trigger may interfere)
  await prisma.forwarders.update({
    where: { id },
    data: { deleted_at: new Date() },
  })

  revalidatePath('/')
  revalidatePath('/transitaires')
  redirect('/transitaires')
}
