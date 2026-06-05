'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'

async function checkAuth() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized: Vous devez être connecté pour effectuer cette action.')
}

// --- PAYS COUVERTS ---
export async function addCountry(forwarderId: string, formData: FormData) {
  await checkAuth()
  const countryId = formData.get('country_id') as string
  if (!countryId) return

  await prisma.forwarder_countries.create({
    data: {
      forwarder_id: forwarderId,
      country_id: countryId,
    },
  })
  revalidatePath(`/transitaires/${forwarderId}`)
}

export async function removeCountry(id: string, forwarderId: string) {
  await checkAuth()
  await prisma.forwarder_countries.delete({ where: { id } })
  revalidatePath(`/transitaires/${forwarderId}`)
}

// --- MODES DE TRANSPORT ---
export async function addTransportMode(forwarderId: string, formData: FormData) {
  await checkAuth()
  const transportModeId = formData.get('transport_mode_id') as string
  if (!transportModeId) return

  await prisma.forwarder_transport_modes.create({
    data: {
      forwarder_id: forwarderId,
      transport_mode_id: transportModeId,
    },
  })
  revalidatePath(`/transitaires/${forwarderId}`)
}

export async function removeTransportMode(id: string, forwarderId: string) {
  await checkAuth()
  await prisma.forwarder_transport_modes.delete({ where: { id } })
  revalidatePath(`/transitaires/${forwarderId}`)
}

// --- CATÉGORIES ACCEPTÉES/REFUSÉES ---
export async function addCategory(forwarderId: string, formData: FormData) {
  await checkAuth()
  const categoryId = formData.get('category_id') as string
  const isAccepted = formData.get('is_accepted') === 'true'
  if (!categoryId) return

  await prisma.forwarder_categories.create({
    data: {
      forwarder_id: forwarderId,
      category_id: categoryId,
      is_accepted: isAccepted,
    },
  })
  revalidatePath(`/transitaires/${forwarderId}`)
}

export async function removeCategory(id: string, forwarderId: string) {
  await checkAuth()
  await prisma.forwarder_categories.delete({ where: { id } })
  revalidatePath(`/transitaires/${forwarderId}`)
}

// --- ENTREPÔTS ---
export async function addWarehouse(forwarderId: string, formData: FormData) {
  await checkAuth()
  const countryId = formData.get('country_id') as string
  const city = formData.get('city') as string
  const address = formData.get('full_address') as string
  const contactName = formData.get('contact_name') as string
  const contactPhone = formData.get('contact_phone') as string
  
  if (!countryId || !city || !address) return

  await prisma.warehouses.create({
    data: {
      forwarder_id: forwarderId,
      country_id: countryId,
      city: city,
      full_address: address,
      contact_name: contactName || null,
      contact_phone: contactPhone || null,
    },
  })
  revalidatePath(`/transitaires/${forwarderId}`)
}

export async function removeWarehouse(id: string, forwarderId: string) {
  await checkAuth()
  await prisma.warehouses.update({
    where: { id },
    data: { deleted_at: new Date() },
  })
  revalidatePath(`/transitaires/${forwarderId}`)
}

// --- TARIFS ---
export async function addPricingRule(forwarderId: string, formData: FormData) {
  await checkAuth()
  const countryId = formData.get('country_id') as string
  const transportModeId = formData.get('transport_mode_id') as string
  const currency = formData.get('currency') as string || 'XOF'
  const notes = formData.get('notes') as string
  const pricingType = formData.get('pricing_type') as string || 'kg'

  if (!countryId || !transportModeId) return

  await prisma.pricing_rules.create({
    data: {
      forwarder_id: forwarderId,
      country_id: countryId,
      transport_mode_id: transportModeId,
      pricing_type: pricingType,
      currency,
      notes: notes || null,
    },
  })
  revalidatePath(`/transitaires/${forwarderId}`)
}

export async function removePricingRule(id: string, forwarderId: string) {
  await checkAuth()
  await prisma.pricing_rules.update({
    where: { id },
    data: { deleted_at: new Date() },
  })
  revalidatePath(`/transitaires/${forwarderId}`)
}
