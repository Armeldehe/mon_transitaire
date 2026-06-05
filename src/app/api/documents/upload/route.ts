import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const forwarderId = formData.get('forwarder_id') as string
    const documentType = formData.get('document_type') as string

    if (!file || !forwarderId || !documentType) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Generate a unique file path
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${forwarderId}/${documentType}/${timestamp}_${safeName}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: `Erreur upload: ${uploadError.message}` }, { status: 500 })
    }

    // Save reference in database
    await prisma.forwarder_documents.create({
      data: {
        forwarder_id: forwarderId,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size_bytes: file.size,
        mime_type: file.type,
        description: (formData.get('description') as string) || null,
        uploaded_by: null, // Could look up internal_users by auth_user_id
      },
    })

    revalidatePath(`/transitaires/${forwarderId}`)

    return NextResponse.json({ success: true, path: filePath })
  } catch (err) {
    console.error('Document upload error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
