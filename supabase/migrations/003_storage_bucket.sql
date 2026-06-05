-- ============================================================================
-- 003 — SUPABASE STORAGE : Bucket documents
-- ============================================================================
-- Exécuter ce script dans l'éditeur SQL de Supabase pour créer le bucket
-- de stockage des documents (RCCM, contrats, photos terrain).
-- ============================================================================

-- 1. Créer le bucket (public = false, fichiers privés)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10 MB max
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS : Lecture — tout utilisateur authentifié interne peut lire
CREATE POLICY "documents_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

-- 3. RLS : Upload — tout utilisateur authentifié interne peut uploader
CREATE POLICY "documents_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

-- 4. RLS : Suppression — tout utilisateur authentifié interne peut supprimer
CREATE POLICY "documents_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );
