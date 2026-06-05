import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// GET — Get a signed download URL for a document
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const docId = request.nextUrl.searchParams.get('id')
    if (!docId) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const doc = await prisma.forwarder_documents.findUnique({ where: { id: docId } })
    if (!doc) {
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    }

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.file_path, 3600) // 1 hour validity

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl, fileName: doc.file_name })
  } catch (err) {
    console.error('Document download error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE — Remove a document from storage and database
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const doc = await prisma.forwarder_documents.findUnique({ where: { id } })
    if (!doc) {
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    }

    // Remove from Storage
    await supabase.storage.from('documents').remove([doc.file_path])

    // Remove from database
    await prisma.forwarder_documents.delete({ where: { id } })

    revalidatePath(`/transitaires/${doc.forwarder_id}`)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Document delete error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
