-- ============================================================================
-- MON TRANSITAIRE — Migration 004 : Politique RLS profil personnel
-- ============================================================================
-- Permet à chaque utilisateur interne de modifier SON PROPRE profil
-- (full_name, phone) sans être admin.
-- ============================================================================

-- Politique : un utilisateur peut mettre à jour son propre enregistrement
CREATE POLICY "iu_self_update" ON internal_users
    FOR UPDATE
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Ajout du trigger audit sur forwarder_interactions (manquant dans 001)
CREATE TRIGGER trg_forwarder_interactions_audit
    AFTER INSERT OR UPDATE OR DELETE ON forwarder_interactions
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();
