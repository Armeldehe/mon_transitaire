-- ============================================================================
-- MON TRANSITAIRE — Migration 002 : Ajustements CRM
-- ============================================================================
-- Exécuter ce script dans l'éditeur SQL de Supabase AVANT de lancer le dev.
--
-- Changements :
--   1. Mise à jour des statuts de partenariat (5 → 8)
--   2. Ajout du champ recommandation interne
--   3. Ajout du champ next_follow_up_date
--   4. Extension des types de documents (photos terrain)
--   5. Création de la table forwarder_interactions
-- ============================================================================


-- ============================================================================
-- 1. MISE À JOUR DES STATUTS CRM
-- ============================================================================

ALTER TABLE forwarders DROP CONSTRAINT IF EXISTS chk_forwarders_partnership;

-- Mettre à jour les anciennes valeurs vers les nouveaux statuts AVANT d'appliquer la nouvelle contrainte
UPDATE forwarders SET partnership_status = 'in_discussion' WHERE partnership_status = 'negotiating';
UPDATE forwarders SET partnership_status = 'validated' WHERE partnership_status = 'partner';

ALTER TABLE forwarders ADD CONSTRAINT chk_forwarders_partnership CHECK (
    partnership_status IN (
        'prospect',        -- Identifié, pas encore contacté
        'contacted',       -- Premier contact effectué
        'rdv_planned',     -- Rendez-vous prévu
        'in_discussion',   -- En discussion active
        'testing',         -- Test en cours (envoi test)
        'validated',       -- Partenaire validé ✅
        'refused',         -- Refusé ✗
        'suspended'        -- Suspendu temporairement
    )
);


-- ============================================================================
-- 2. RECOMMANDATION INTERNE
-- ============================================================================
-- Permet à l'équipe de noter rapidement la qualité du partenaire.

ALTER TABLE forwarders ADD COLUMN IF NOT EXISTS internal_recommendation VARCHAR(30);

ALTER TABLE forwarders ADD CONSTRAINT chk_forwarders_recommendation CHECK (
    internal_recommendation IS NULL OR internal_recommendation IN (
        'highly_recommended',   -- Fortement recommandé ⭐⭐⭐
        'recommended',          -- Recommandé ⭐⭐
        'neutral',              -- Neutre ⭐
        'not_recommended'       -- Non recommandé ⛔
    )
);


-- ============================================================================
-- 3. DATE DE RELANCE
-- ============================================================================
-- Permet de planifier le prochain suivi commercial directement sur la fiche.

ALTER TABLE forwarders ADD COLUMN IF NOT EXISTS next_follow_up_date DATE;

CREATE INDEX IF NOT EXISTS idx_forwarders_followup 
ON forwarders (next_follow_up_date) 
WHERE next_follow_up_date IS NOT NULL AND deleted_at IS NULL;


-- ============================================================================
-- 4. TYPES DE DOCUMENTS — PHOTOS TERRAIN
-- ============================================================================

ALTER TABLE forwarder_documents DROP CONSTRAINT IF EXISTS chk_documents_type;

ALTER TABLE forwarder_documents ADD CONSTRAINT chk_documents_type CHECK (
    document_type IN (
        'rccm',                   -- Document RCCM
        'logo',                   -- Logo entreprise
        'business_card',          -- Carte de visite
        'partnership_contract',   -- Contrat de partenariat
        'photo',                  -- Photo générique
        'photo_office',           -- Photo bureau/local
        'photo_warehouse',        -- Photo entrepôt
        'photo_contact',          -- Photo du responsable
        'other'                   -- Autre document
    )
);


-- ============================================================================
-- 5. TABLE FORWARDER_INTERACTIONS — Historique CRM
-- ============================================================================

CREATE TABLE IF NOT EXISTS forwarder_interactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forwarder_id        UUID NOT NULL,
    user_id             UUID,
    interaction_type    VARCHAR(30) NOT NULL,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    interaction_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    next_follow_up_date DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_fi_forwarder 
        FOREIGN KEY (forwarder_id) REFERENCES forwarders(id) ON DELETE CASCADE,
    CONSTRAINT fk_fi_user 
        FOREIGN KEY (user_id) REFERENCES internal_users(id),
    CONSTRAINT chk_fi_type CHECK (
        interaction_type IN (
            'call',              -- Appel téléphonique
            'whatsapp',          -- Échange WhatsApp
            'meeting',           -- Rendez-vous physique
            'email',             -- Email envoyé/reçu
            'document_received', -- Document reçu
            'visit',             -- Visite entrepôt/bureau
            'negotiation',       -- Session de négociation
            'note',              -- Note interne
            'status_change',     -- Changement de statut
            'other'              -- Autre
        )
    )
);

-- Index
CREATE INDEX IF NOT EXISTS idx_fi_forwarder ON forwarder_interactions (forwarder_id);
CREATE INDEX IF NOT EXISTS idx_fi_date ON forwarder_interactions (forwarder_id, interaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_fi_followup ON forwarder_interactions (next_follow_up_date) 
    WHERE next_follow_up_date IS NOT NULL;

-- RLS
ALTER TABLE forwarder_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fi_read" ON forwarder_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM internal_users 
            WHERE auth_user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "fi_insert" ON forwarder_interactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM internal_users 
            WHERE auth_user_id = auth.uid() AND is_active = true 
              AND role IN ('admin', 'manager', 'operator')
        )
    );

CREATE POLICY "fi_delete" ON forwarder_interactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM internal_users 
            WHERE auth_user_id = auth.uid() AND is_active = true 
              AND role = 'admin'
        )
    );


-- ============================================================================
-- FIN DE LA MIGRATION 002
-- ============================================================================
