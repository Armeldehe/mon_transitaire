-- ============================================================================
-- MON TRANSITAIRE — Migration 005 : Synchronisation des utilisateurs
-- ============================================================================

-- 1. Fonction pour créer automatiquement un profil internal_users 
--    lorsqu'un utilisateur s'inscrit ou est créé dans Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.internal_users (auth_user_id, full_name, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'admin', -- Par défaut on met 'admin' (vous pourrez le changer via l'interface)
    true
  )
  ON CONFLICT (email) DO UPDATE SET auth_user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger sur la table system auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill : Créer les profils internal_users pour les utilisateurs déjà existants
INSERT INTO public.internal_users (auth_user_id, full_name, email, role, is_active)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    email,
    'admin',
    true
FROM auth.users
WHERE id NOT IN (SELECT auth_user_id FROM public.internal_users WHERE auth_user_id IS NOT NULL)
ON CONFLICT (email) DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id;
