-- ============================================================================
-- MON TRANSITAIRE — Migration Initiale V1
-- ============================================================================
-- Plateforme de référencement de transitaires ivoiriens
-- Base de données PostgreSQL hébergée sur Supabase
-- 
-- Structure :
--   1. Extensions
--   2. Fonctions utilitaires
--   3. Tables de référence (Référentiel)
--   4. Tables système (Utilisateurs internes)
--   5. Tables métier (Transitaires)
--   6. Tables de liaison
--   7. Tables de tarification
--   8. Tables d'audit
--   9. Tables V2 futures
--  10. Index de performance
--  11. Triggers
--  12. Row Level Security (RLS)
-- ============================================================================


-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- Recherche floue (trigrammes)
CREATE EXTENSION IF NOT EXISTS "unaccent";      -- Recherche sans accents


-- ============================================================================
-- 2. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction trigger pour empêcher la suppression physique (soft delete)
CREATE OR REPLACE FUNCTION trigger_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Au lieu de supprimer, on met à jour deleted_at
    EXECUTE format(
        'UPDATE %I.%I SET deleted_at = now() WHERE id = $1',
        TG_TABLE_SCHEMA, TG_TABLE_NAME
    ) USING OLD.id;
    RETURN NULL; -- Annule le DELETE original
END;
$$ LANGUAGE plpgsql;

-- Fonction trigger pour enregistrer les modifications dans audit_logs
CREATE OR REPLACE FUNCTION trigger_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_values JSONB;
    v_new_values JSONB;
    v_action VARCHAR(20);
    v_record_id UUID;
    v_user_id UUID;
BEGIN
    -- Déterminer l'utilisateur courant via le JWT Supabase
    BEGIN
        v_user_id := (
            SELECT iu.id FROM internal_users iu 
            WHERE iu.auth_user_id = auth.uid()
        );
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        v_record_id := NEW.id;
        v_old_values := NULL;
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_record_id := NEW.id;
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        -- Distinguer un soft delete d'une mise à jour normale
        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            v_action := 'SOFT_DELETE';
        ELSE
            v_action := 'UPDATE';
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_record_id := OLD.id;
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
    END IF;

    INSERT INTO audit_logs (
        user_id, table_name, record_id, action, old_values, new_values
    ) VALUES (
        v_user_id, TG_TABLE_NAME, v_record_id, v_action, v_old_values, v_new_values
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de recherche immutable pour index full-text
CREATE OR REPLACE FUNCTION forwarder_search_text(
    p_company_name VARCHAR,
    p_description TEXT,
    p_contact_person VARCHAR
) RETURNS tsvector AS $$
BEGIN
    RETURN (
        setweight(to_tsvector('french', COALESCE(p_company_name, '')), 'A') ||
        setweight(to_tsvector('french', COALESCE(p_contact_person, '')), 'B') ||
        setweight(to_tsvector('french', COALESCE(p_description, '')), 'C')
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction future : calcul automatique des tarifs (signature préparée)
CREATE OR REPLACE FUNCTION calculate_shipping_cost(
    p_forwarder_id UUID,
    p_country_id UUID,
    p_transport_mode_id UUID,
    p_weight_kg NUMERIC DEFAULT NULL,
    p_volume_cbm NUMERIC DEFAULT NULL
) RETURNS TABLE(
    pricing_type VARCHAR,
    applicable_tier_id UUID,
    unit_price NUMERIC,
    quantity NUMERIC,
    total_cost NUMERIC,
    currency CHAR(3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.pricing_type::VARCHAR,
        pt.id AS applicable_tier_id,
        pt.price_per_unit AS unit_price,
        CASE 
            WHEN pr.pricing_type = 'KG' THEN p_weight_kg
            WHEN pr.pricing_type = 'CBM' THEN p_volume_cbm
            ELSE NULL
        END AS quantity,
        CASE 
            WHEN pr.pricing_type = 'KG' THEN pt.price_per_unit * COALESCE(p_weight_kg, 0)
            WHEN pr.pricing_type = 'CBM' THEN pt.price_per_unit * COALESCE(p_volume_cbm, 0)
            ELSE NULL
        END AS total_cost,
        pr.currency
    FROM pricing_rules pr
    JOIN pricing_tiers pt ON pt.pricing_rule_id = pr.id
    WHERE pr.forwarder_id = p_forwarder_id
      AND pr.country_id = p_country_id
      AND pr.transport_mode_id = p_transport_mode_id
      AND pr.is_active = true
      AND pr.deleted_at IS NULL
      AND (
          (pr.pricing_type = 'KG' AND p_weight_kg IS NOT NULL 
           AND pt.min_value <= p_weight_kg 
           AND (pt.max_value IS NULL OR pt.max_value >= p_weight_kg))
          OR
          (pr.pricing_type = 'CBM' AND p_volume_cbm IS NOT NULL 
           AND pt.min_value <= p_volume_cbm 
           AND (pt.max_value IS NULL OR pt.max_value >= p_volume_cbm))
      )
    ORDER BY pr.pricing_type, pt.min_value
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================================
-- 3. TABLES DE RÉFÉRENCE
-- ============================================================================

-- -------------------------------------------------
-- countries : Pays du monde
-- -------------------------------------------------
-- Table de référence contenant les pays utilisés dans le système.
-- Normalisée avec codes ISO pour intégrations futures (APIs, cartes).
CREATE TABLE countries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    iso_code_2      CHAR(2) NOT NULL,
    iso_code_3      CHAR(3) NOT NULL,
    continent       VARCHAR(50) NOT NULL,
    phone_prefix    VARCHAR(10),
    currency_code   CHAR(3),
    flag_emoji       VARCHAR(10),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_countries_name UNIQUE (name),
    CONSTRAINT uq_countries_iso2 UNIQUE (iso_code_2),
    CONSTRAINT uq_countries_iso3 UNIQUE (iso_code_3)
);

COMMENT ON TABLE countries IS 'Table de référence des pays. Utilisée pour normaliser les couvertures géographiques, les entrepôts, et les grilles tarifaires.';
COMMENT ON COLUMN countries.iso_code_2 IS 'Code ISO 3166-1 alpha-2 (ex: CI, CN, FR)';
COMMENT ON COLUMN countries.flag_emoji IS 'Emoji du drapeau pour affichage frontend';

-- -------------------------------------------------
-- transport_modes : Modes de transport
-- -------------------------------------------------
-- Table de référence extensible (avion, bateau, route, train...).
CREATE TABLE transport_modes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(50) NOT NULL,
    code            VARCHAR(20) NOT NULL,
    description     TEXT,
    icon            VARCHAR(50),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_transport_modes_name UNIQUE (name),
    CONSTRAINT uq_transport_modes_code UNIQUE (code)
);

COMMENT ON TABLE transport_modes IS 'Modes de transport disponibles pour le transit international.';

-- -------------------------------------------------
-- product_categories : Catégories de marchandises
-- -------------------------------------------------
-- Classification des produits. Le champ requires_special_handling
-- identifie les catégories sensibles (batteries, liquides).
CREATE TABLE product_categories (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        VARCHAR(100) NOT NULL,
    slug                        VARCHAR(100) NOT NULL,
    description                 TEXT,
    icon                        VARCHAR(50),
    requires_special_handling   BOOLEAN NOT NULL DEFAULT false,
    is_active                   BOOLEAN NOT NULL DEFAULT true,
    sort_order                  INTEGER NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_product_categories_name UNIQUE (name),
    CONSTRAINT uq_product_categories_slug UNIQUE (slug)
);

COMMENT ON TABLE product_categories IS 'Catégories de produits acceptées par les transitaires. Certaines nécessitent une manutention spéciale.';
COMMENT ON COLUMN product_categories.slug IS 'Identifiant URL-safe pour le frontend (ex: electronique, batteries)';
COMMENT ON COLUMN product_categories.requires_special_handling IS 'True si la catégorie nécessite des précautions (batteries, liquides, produits chimiques)';


-- ============================================================================
-- 4. TABLES SYSTÈME
-- ============================================================================

-- -------------------------------------------------
-- internal_users : Utilisateurs internes de l'équipe
-- -------------------------------------------------
-- Membres de l'équipe MON TRANSITAIRE. Liés à Supabase Auth.
-- 4 rôles : admin, manager, operator, viewer.
CREATE TABLE internal_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id    UUID UNIQUE,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(30),
    role            VARCHAR(30) NOT NULL DEFAULT 'operator',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_internal_users_email UNIQUE (email),
    CONSTRAINT chk_internal_users_role CHECK (
        role IN ('admin', 'manager', 'operator', 'viewer')
    )
);

COMMENT ON TABLE internal_users IS 'Membres de l''équipe MON TRANSITAIRE. Liés aux utilisateurs Supabase Auth via auth_user_id.';
COMMENT ON COLUMN internal_users.role IS 'admin = accès total, manager = lecture/écriture, operator = saisie, viewer = lecture seule';

-- Référence vers auth.users (commentée car Supabase gère cette table)
-- La FK sera ajoutée manuellement si nécessaire :
-- ALTER TABLE internal_users 
--   ADD CONSTRAINT fk_internal_users_auth 
--   FOREIGN KEY (auth_user_id) REFERENCES auth.users(id);


-- ============================================================================
-- 5. TABLES MÉTIER — TRANSITAIRES
-- ============================================================================

-- -------------------------------------------------
-- forwarders : Transitaires partenaires
-- -------------------------------------------------
-- Table centrale du système. Contient l'identité, les contacts,
-- les informations CRM (recrutement) et le statut de chaque transitaire.
CREATE TABLE forwarders (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identité
    company_name            VARCHAR(200) NOT NULL,
    contact_person          VARCHAR(150) NOT NULL,
    phone                   VARCHAR(30) NOT NULL,
    whatsapp                VARCHAR(30),
    email                   VARCHAR(255),
    address_abidjan         TEXT,
    rccm                    VARCHAR(50),
    description             TEXT,

    -- Statut opérationnel
    status                  VARCHAR(20) NOT NULL DEFAULT 'active',

    -- CRM — Gestion du recrutement et suivi commercial
    partnership_status      VARCHAR(30) NOT NULL DEFAULT 'prospect',
    trust_level             SMALLINT,
    first_contact_date      DATE,
    last_contact_date       DATE,
    assigned_commercial_id  UUID,
    internal_notes          TEXT,

    -- Médias & liens
    logo_url                TEXT,
    website                 VARCHAR(255),
    social_links            JSONB DEFAULT '{}'::jsonb,

    -- Traçabilité
    onboarded_by            UUID,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ,

    -- Contraintes
    CONSTRAINT uq_forwarders_rccm UNIQUE (rccm),
    CONSTRAINT chk_forwarders_status CHECK (
        status IN ('active', 'inactive', 'suspended', 'pending')
    ),
    CONSTRAINT chk_forwarders_partnership CHECK (
        partnership_status IN ('prospect', 'contacted', 'negotiating', 'partner', 'suspended')
    ),
    CONSTRAINT chk_forwarders_trust CHECK (
        trust_level IS NULL OR (trust_level >= 1 AND trust_level <= 5)
    ),
    CONSTRAINT chk_forwarders_contact_dates CHECK (
        last_contact_date IS NULL 
        OR first_contact_date IS NULL 
        OR last_contact_date >= first_contact_date
    ),
    CONSTRAINT fk_forwarders_commercial 
        FOREIGN KEY (assigned_commercial_id) REFERENCES internal_users(id),
    CONSTRAINT fk_forwarders_onboarded 
        FOREIGN KEY (onboarded_by) REFERENCES internal_users(id)
);

COMMENT ON TABLE forwarders IS 'Table centrale : transitaires partenaires référencés par l''équipe MON TRANSITAIRE.';
COMMENT ON COLUMN forwarders.partnership_status IS 'Statut CRM du recrutement : prospect → contacted → negotiating → partner | suspended';
COMMENT ON COLUMN forwarders.trust_level IS 'Niveau de confiance interne (1=faible, 5=très élevé). Évalué par le commercial.';
COMMENT ON COLUMN forwarders.rccm IS 'Numéro du Registre du Commerce et du Crédit Mobilier de Côte d''Ivoire';
COMMENT ON COLUMN forwarders.social_links IS 'JSON : {"facebook": "url", "instagram": "url", "linkedin": "url"}';
COMMENT ON COLUMN forwarders.deleted_at IS 'Soft delete : non NULL = enregistrement supprimé logiquement';

-- -------------------------------------------------
-- forwarder_documents : Documents des transitaires
-- -------------------------------------------------
-- Stocke les métadonnées des fichiers uploadés vers Supabase Storage.
-- Les fichiers physiques sont dans le bucket 'forwarder-documents'.
CREATE TABLE forwarder_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forwarder_id    UUID NOT NULL,
    document_type   VARCHAR(30) NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_path       TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type       VARCHAR(100),
    description     TEXT,
    uploaded_by     UUID,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_documents_forwarder 
        FOREIGN KEY (forwarder_id) REFERENCES forwarders(id) ON DELETE CASCADE,
    CONSTRAINT fk_documents_uploaded_by 
        FOREIGN KEY (uploaded_by) REFERENCES internal_users(id),
    CONSTRAINT chk_documents_type CHECK (
        document_type IN (
            'rccm', 'logo', 'business_card', 
            'partnership_contract', 'photo', 'other'
        )
    )
);

COMMENT ON TABLE forwarder_documents IS 'Métadonnées des documents uploadés vers Supabase Storage pour chaque transitaire.';
COMMENT ON COLUMN forwarder_documents.file_path IS 'Chemin dans Supabase Storage : forwarder-documents/{forwarder_id}/{file_name}';
COMMENT ON COLUMN forwarder_documents.document_type IS 'Type : rccm, logo, business_card, partnership_contract, photo, other';

-- -------------------------------------------------
-- warehouses : Entrepôts des transitaires
-- -------------------------------------------------
-- Adresses physiques de réception des marchandises.
-- Chaque entrepôt appartient à un transitaire et est situé dans un pays.
-- Géolocalisation optionnelle pour future carte interactive.
CREATE TABLE warehouses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forwarder_id    UUID NOT NULL,
    country_id      UUID NOT NULL,
    city            VARCHAR(100) NOT NULL,
    full_address    TEXT NOT NULL,
    postal_code     VARCHAR(20),
    latitude        NUMERIC(10, 7),
    longitude       NUMERIC(10, 7),
    phone           VARCHAR(30),
    contact_name    VARCHAR(150),
    contact_phone   VARCHAR(30),
    contact_email   VARCHAR(255),
    notes           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,

    CONSTRAINT fk_warehouses_forwarder 
        FOREIGN KEY (forwarder_id) REFERENCES forwarders(id) ON DELETE CASCADE,
    CONSTRAINT fk_warehouses_country 
        FOREIGN KEY (country_id) REFERENCES countries(id),
    CONSTRAINT chk_warehouses_latitude CHECK (
        latitude IS NULL OR (latitude >= -90 AND latitude <= 90)
    ),
    CONSTRAINT chk_warehouses_longitude CHECK (
        longitude IS NULL OR (longitude >= -180 AND longitude <= 180)
    )
);

COMMENT ON TABLE warehouses IS 'Entrepôts des transitaires dans les pays d''origine. Un transitaire possède N entrepôts.';
COMMENT ON COLUMN warehouses.latitude IS 'Latitude GPS (optionnel). Précision : 7 décimales ≈ 1cm.';
COMMENT ON COLUMN warehouses.longitude IS 'Longitude GPS (optionnel). Précision : 7 décimales ≈ 1cm.';


-- ============================================================================
-- 6. TABLES DE LIAISON (JUNCTION TABLES)
-- ============================================================================

-- -------------------------------------------------
-- forwarder_countries : Couverture géographique
-- -------------------------------------------------
-- Relation M:N entre transitaires et pays couverts.
CREATE TABLE forwarder_countries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forwarder_id    UUID NOT NULL,
    country_id      UUID NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_fc_forwarder 
        FOREIGN KEY (forwarder_id) REFERENCES forwarders(id) ON DELETE CASCADE,
    CONSTRAINT fk_fc_country 
        FOREIGN KEY (country_id) REFERENCES countries(id),
    CONSTRAINT uq_forwarder_countries 
        UNIQUE (forwarder_id, country_id)
);

COMMENT ON TABLE forwarder_countries IS 'Pays couverts par chaque transitaire. Relation M:N.';

-- -------------------------------------------------
-- forwarder_transport_modes : Modes proposés
-- -------------------------------------------------
-- Relation M:N entre transitaires et modes de transport.
CREATE TABLE forwarder_transport_modes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forwarder_id        UUID NOT NULL,
    transport_mode_id   UUID NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_ftm_forwarder 
        FOREIGN KEY (forwarder_id) REFERENCES forwarders(id) ON DELETE CASCADE,
    CONSTRAINT fk_ftm_transport_mode 
        FOREIGN KEY (transport_mode_id) REFERENCES transport_modes(id),
    CONSTRAINT uq_forwarder_transport_modes 
        UNIQUE (forwarder_id, transport_mode_id)
);

COMMENT ON TABLE forwarder_transport_modes IS 'Modes de transport proposés par chaque transitaire. Relation M:N.';

-- -------------------------------------------------
-- forwarder_categories : Catégories acceptées
-- -------------------------------------------------
-- Relation M:N entre transitaires et catégories de produits.
-- is_accepted = false permet de marquer explicitement les catégories refusées.
CREATE TABLE forwarder_categories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forwarder_id        UUID NOT NULL,
    category_id         UUID NOT NULL,
    is_accepted         BOOLEAN NOT NULL DEFAULT true,
    restriction_notes   TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_fcat_forwarder 
        FOREIGN KEY (forwarder_id) REFERENCES forwarders(id) ON DELETE CASCADE,
    CONSTRAINT fk_fcat_category 
        FOREIGN KEY (category_id) REFERENCES product_categories(id),
    CONSTRAINT uq_forwarder_categories 
        UNIQUE (forwarder_id, category_id)
);

COMMENT ON TABLE forwarder_categories IS 'Catégories de produits acceptées/refusées par chaque transitaire.';
COMMENT ON COLUMN forwarder_categories.is_accepted IS 'true = catégorie acceptée, false = catégorie explicitement refusée';
COMMENT ON COLUMN forwarder_categories.restriction_notes IS 'Conditions d''acceptation (ex: "batteries lithium < 100Wh uniquement")';


-- ============================================================================
-- 7. TABLES DE TARIFICATION & RÈGLES MÉTIER
-- ============================================================================

-- -------------------------------------------------
-- pricing_rules : Grilles tarifaires
-- -------------------------------------------------
-- Définit une grille pour un transitaire + pays + mode + type (KG/CBM).
-- Les tranches dégressives sont dans pricing_tiers.
CREATE TABLE pricing_rules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forwarder_id        UUID NOT NULL,
    country_id          UUID NOT NULL,
    transport_mode_id   UUID NOT NULL,
    pricing_type        VARCHAR(10) NOT NULL,
    currency            CHAR(3) NOT NULL DEFAULT 'XOF',
    is_negotiable       BOOLEAN NOT NULL DEFAULT false,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    valid_from          DATE,
    valid_until         DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT fk_pr_forwarder 
        FOREIGN KEY (forwarder_id) REFERENCES forwarders(id) ON DELETE CASCADE,
    CONSTRAINT fk_pr_country 
        FOREIGN KEY (country_id) REFERENCES countries(id),
    CONSTRAINT fk_pr_transport_mode 
        FOREIGN KEY (transport_mode_id) REFERENCES transport_modes(id),
    CONSTRAINT chk_pr_pricing_type CHECK (
        pricing_type IN ('KG', 'CBM')
    ),
    CONSTRAINT chk_pr_dates CHECK (
        valid_until IS NULL 
        OR valid_from IS NULL 
        OR valid_until >= valid_from
    )
);

-- Index unique partiel : une seule règle active par combinaison
CREATE UNIQUE INDEX idx_pricing_rules_unique_active
ON pricing_rules (forwarder_id, country_id, transport_mode_id, pricing_type)
WHERE deleted_at IS NULL AND is_active = true;

COMMENT ON TABLE pricing_rules IS 'Grilles tarifaires des transitaires. Chaque règle définit un tarif par (transitaire, pays, mode, type KG/CBM).';
COMMENT ON COLUMN pricing_rules.pricing_type IS 'KG = tarification au kilogramme, CBM = tarification au mètre cube';
COMMENT ON COLUMN pricing_rules.currency IS 'Code devise ISO 4217. XOF = Franc CFA (BCEAO)';

-- -------------------------------------------------
-- pricing_tiers : Tranches tarifaires
-- -------------------------------------------------
-- Tranches de poids ou volume pour tarifs dégressifs.
-- max_value = NULL signifie "et plus" (tranche ouverte).
CREATE TABLE pricing_tiers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricing_rule_id     UUID NOT NULL,
    min_value           NUMERIC(10, 2) NOT NULL,
    max_value           NUMERIC(10, 2),
    price_per_unit      NUMERIC(12, 2) NOT NULL,
    unit                VARCHAR(10) NOT NULL DEFAULT 'KG',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_pt_pricing_rule 
        FOREIGN KEY (pricing_rule_id) REFERENCES pricing_rules(id) ON DELETE CASCADE,
    CONSTRAINT chk_pt_min_value CHECK (min_value >= 0),
    CONSTRAINT chk_pt_max_value CHECK (
        max_value IS NULL OR max_value > min_value
    ),
    CONSTRAINT chk_pt_price CHECK (price_per_unit > 0),
    CONSTRAINT chk_pt_unit CHECK (unit IN ('KG', 'CBM'))
);

COMMENT ON TABLE pricing_tiers IS 'Tranches tarifaires dégressives. Ex: 0-10kg = 10000 FCFA/kg, 10-50kg = 8000 FCFA/kg.';
COMMENT ON COLUMN pricing_tiers.max_value IS 'NULL = tranche ouverte ("50kg et plus")';

-- -------------------------------------------------
-- forwarder_restrictions : Restrictions produits
-- -------------------------------------------------
-- Contraintes sur certains produits/routes/modes.
-- Peut être conditionnelle (surcharge) ou absolue (interdiction).
CREATE TABLE forwarder_restrictions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forwarder_id        UUID NOT NULL,
    category_id         UUID,
    country_id          UUID,
    transport_mode_id   UUID,
    restriction_type    VARCHAR(30) NOT NULL,
    description         TEXT NOT NULL,
    max_weight_kg       NUMERIC(10, 2),
    max_volume_cbm      NUMERIC(10, 4),
    surcharge_amount    NUMERIC(12, 2),
    surcharge_currency  CHAR(3) DEFAULT 'XOF',
    is_absolute         BOOLEAN NOT NULL DEFAULT true,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_fr_forwarder 
        FOREIGN KEY (forwarder_id) REFERENCES forwarders(id) ON DELETE CASCADE,
    CONSTRAINT fk_fr_category 
        FOREIGN KEY (category_id) REFERENCES product_categories(id),
    CONSTRAINT fk_fr_country 
        FOREIGN KEY (country_id) REFERENCES countries(id),
    CONSTRAINT fk_fr_transport_mode 
        FOREIGN KEY (transport_mode_id) REFERENCES transport_modes(id),
    CONSTRAINT chk_fr_restriction_type CHECK (
        restriction_type IN (
            'forbidden', 'weight_limit', 'size_limit', 
            'requires_declaration', 'surcharge', 'conditional'
        )
    )
);

COMMENT ON TABLE forwarder_restrictions IS 'Restrictions sur produits/routes. Ex: batteries interdites en avion, liquides limités à 5L.';
COMMENT ON COLUMN forwarder_restrictions.is_absolute IS 'true = interdiction totale, false = autorisé sous conditions';
COMMENT ON COLUMN forwarder_restrictions.category_id IS 'NULL = restriction applicable à toutes les catégories';
COMMENT ON COLUMN forwarder_restrictions.country_id IS 'NULL = restriction applicable à tous les pays';

-- -------------------------------------------------
-- delivery_estimates : Délais de livraison
-- -------------------------------------------------
-- Temps de transit estimé par route (transitaire + pays + mode).
CREATE TABLE delivery_estimates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forwarder_id        UUID NOT NULL,
    country_id          UUID NOT NULL,
    transport_mode_id   UUID NOT NULL,
    min_days            INTEGER NOT NULL,
    max_days            INTEGER NOT NULL,
    notes               TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_de_forwarder 
        FOREIGN KEY (forwarder_id) REFERENCES forwarders(id) ON DELETE CASCADE,
    CONSTRAINT fk_de_country 
        FOREIGN KEY (country_id) REFERENCES countries(id),
    CONSTRAINT fk_de_transport_mode 
        FOREIGN KEY (transport_mode_id) REFERENCES transport_modes(id),
    CONSTRAINT uq_delivery_estimates 
        UNIQUE (forwarder_id, country_id, transport_mode_id),
    CONSTRAINT chk_de_min_days CHECK (min_days > 0),
    CONSTRAINT chk_de_max_days CHECK (max_days >= min_days)
);

COMMENT ON TABLE delivery_estimates IS 'Délais de livraison estimés par route (transitaire + pays + mode de transport).';
COMMENT ON COLUMN delivery_estimates.notes IS 'Précisions : "hors dédouanement", "en période normale", etc.';


-- ============================================================================
-- 8. TABLE D'AUDIT
-- ============================================================================

-- -------------------------------------------------
-- audit_logs : Journal d'audit
-- -------------------------------------------------
-- Trace automatique de toutes les modifications via triggers.
-- Table append-only : jamais modifiée ni supprimée.
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID,
    table_name      VARCHAR(100) NOT NULL,
    record_id       UUID NOT NULL,
    action          VARCHAR(20) NOT NULL,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_al_user 
        FOREIGN KEY (user_id) REFERENCES internal_users(id),
    CONSTRAINT chk_al_action CHECK (
        action IN ('INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE')
    )
);

COMMENT ON TABLE audit_logs IS 'Journal d''audit automatique. Toutes les modifications sont tracées. Table append-only.';


-- ============================================================================
-- 9. TABLES V2 FUTURES (créées vides, prêtes pour l'évolution)
-- ============================================================================

-- -------------------------------------------------
-- customers : Clients finaux (V2)
-- -------------------------------------------------
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id    UUID UNIQUE,
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(30) NOT NULL,
    whatsapp        VARCHAR(30),
    email           VARCHAR(255),
    city            VARCHAR(100),
    address         TEXT,
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    preferred_language VARCHAR(5) DEFAULT 'fr',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE customers IS '[V2] Clients finaux de la plateforme. Non utilisé en V1.';

-- -------------------------------------------------
-- shipment_requests : Demandes de transit (V2)
-- -------------------------------------------------
CREATE TABLE shipment_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number    VARCHAR(30) NOT NULL,
    customer_id         UUID NOT NULL,
    origin_country_id   UUID NOT NULL,
    category_id         UUID,
    transport_mode_id   UUID,
    estimated_weight_kg NUMERIC(10, 2),
    estimated_volume_cbm NUMERIC(10, 4),
    description         TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'draft',
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_shipment_requests_ref UNIQUE (reference_number),
    CONSTRAINT fk_sr_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_sr_country 
        FOREIGN KEY (origin_country_id) REFERENCES countries(id),
    CONSTRAINT fk_sr_category 
        FOREIGN KEY (category_id) REFERENCES product_categories(id),
    CONSTRAINT fk_sr_transport_mode 
        FOREIGN KEY (transport_mode_id) REFERENCES transport_modes(id),
    CONSTRAINT chk_sr_status CHECK (
        status IN (
            'draft', 'submitted', 'quoted', 'accepted', 
            'in_progress', 'completed', 'cancelled'
        )
    )
);

COMMENT ON TABLE shipment_requests IS '[V2] Demandes de transit créées par les clients.';

-- -------------------------------------------------
-- shipments : Expéditions (V2)
-- -------------------------------------------------
CREATE TABLE shipments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number     VARCHAR(50) NOT NULL,
    request_id          UUID,
    forwarder_id        UUID NOT NULL,
    customer_id         UUID NOT NULL,
    warehouse_id        UUID,
    origin_country_id   UUID,
    transport_mode_id   UUID,
    status              VARCHAR(30) NOT NULL DEFAULT 'pending',
    actual_weight_kg    NUMERIC(10, 2),
    actual_volume_cbm   NUMERIC(10, 4),
    total_cost          NUMERIC(14, 2),
    currency            CHAR(3) DEFAULT 'XOF',
    estimated_delivery  DATE,
    actual_delivery     DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_shipments_tracking UNIQUE (tracking_number),
    CONSTRAINT fk_sh_request 
        FOREIGN KEY (request_id) REFERENCES shipment_requests(id),
    CONSTRAINT fk_sh_forwarder 
        FOREIGN KEY (forwarder_id) REFERENCES forwarders(id),
    CONSTRAINT fk_sh_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_sh_warehouse 
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_sh_country 
        FOREIGN KEY (origin_country_id) REFERENCES countries(id),
    CONSTRAINT fk_sh_transport_mode 
        FOREIGN KEY (transport_mode_id) REFERENCES transport_modes(id),
    CONSTRAINT chk_sh_status CHECK (
        status IN (
            'pending', 'received_at_warehouse', 'measured', 
            'shipped', 'in_transit', 'arrived', 'customs', 
            'ready_for_pickup', 'delivered', 'cancelled'
        )
    )
);

COMMENT ON TABLE shipments IS '[V2] Expéditions en cours et terminées. Non utilisé en V1.';

-- -------------------------------------------------
-- tracking_events : Événements de suivi (V2)
-- -------------------------------------------------
CREATE TABLE tracking_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id     UUID NOT NULL,
    status          VARCHAR(30) NOT NULL,
    location        VARCHAR(200),
    description     TEXT,
    event_date      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_te_shipment 
        FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    CONSTRAINT fk_te_created_by 
        FOREIGN KEY (created_by) REFERENCES internal_users(id)
);

COMMENT ON TABLE tracking_events IS '[V2] Historique des événements de suivi d''une expédition.';

-- -------------------------------------------------
-- reviews : Avis clients (V2)
-- -------------------------------------------------
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID NOT NULL,
    forwarder_id    UUID NOT NULL,
    shipment_id     UUID,
    rating          SMALLINT NOT NULL,
    comment         TEXT,
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    is_published    BOOLEAN NOT NULL DEFAULT false,
    moderated_by    UUID,
    moderated_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_rv_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_rv_forwarder 
        FOREIGN KEY (forwarder_id) REFERENCES forwarders(id),
    CONSTRAINT fk_rv_shipment 
        FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    CONSTRAINT fk_rv_moderated_by 
        FOREIGN KEY (moderated_by) REFERENCES internal_users(id),
    CONSTRAINT chk_rv_rating CHECK (rating BETWEEN 1 AND 5)
);

COMMENT ON TABLE reviews IS '[V2] Avis et notations des transitaires par les clients.';

-- -------------------------------------------------
-- notifications : Système de notifications (V2)
-- -------------------------------------------------
CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type      VARCHAR(20) NOT NULL,
    recipient_id        UUID NOT NULL,
    title               VARCHAR(200) NOT NULL,
    body                TEXT,
    notification_type   VARCHAR(50) NOT NULL,
    channel             VARCHAR(20) NOT NULL DEFAULT 'in_app',
    is_read             BOOLEAN NOT NULL DEFAULT false,
    read_at             TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_notif_recipient_type CHECK (
        recipient_type IN ('internal_user', 'customer')
    ),
    CONSTRAINT chk_notif_channel CHECK (
        channel IN ('in_app', 'email', 'sms', 'whatsapp', 'push')
    )
);

COMMENT ON TABLE notifications IS '[V2] Notifications multi-canal pour utilisateurs internes et clients.';


-- ============================================================================
-- 10. INDEX DE PERFORMANCE
-- ============================================================================

-- ---------- countries ----------
CREATE INDEX idx_countries_continent ON countries (continent);
CREATE INDEX idx_countries_active ON countries (is_active) WHERE is_active = true;

-- ---------- product_categories ----------
CREATE INDEX idx_categories_slug ON product_categories (slug);
CREATE INDEX idx_categories_sort ON product_categories (sort_order);

-- ---------- internal_users ----------
CREATE INDEX idx_iu_auth_user ON internal_users (auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_iu_role ON internal_users (role);

-- ---------- forwarders ----------
CREATE INDEX idx_forwarders_company ON forwarders (company_name);
CREATE INDEX idx_forwarders_status ON forwarders (status);
CREATE INDEX idx_forwarders_partnership ON forwarders (partnership_status);
CREATE INDEX idx_forwarders_rccm ON forwarders (rccm) WHERE rccm IS NOT NULL;
CREATE INDEX idx_forwarders_commercial ON forwarders (assigned_commercial_id) 
    WHERE assigned_commercial_id IS NOT NULL;
CREATE INDEX idx_forwarders_active ON forwarders (status, partnership_status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_forwarders_trust ON forwarders (trust_level) 
    WHERE trust_level IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_forwarders_last_contact ON forwarders (last_contact_date DESC) 
    WHERE deleted_at IS NULL;

-- Index full-text pour recherche de transitaires (français)
CREATE INDEX idx_forwarders_search ON forwarders 
    USING GIN (
        to_tsvector('french', 
            COALESCE(company_name, '') || ' ' || 
            COALESCE(contact_person, '') || ' ' || 
            COALESCE(description, '')
        )
    );

-- Index trigramme pour recherche floue
CREATE INDEX idx_forwarders_trgm_name ON forwarders 
    USING GIN (company_name gin_trgm_ops);

-- ---------- forwarder_documents ----------
CREATE INDEX idx_fd_forwarder ON forwarder_documents (forwarder_id);
CREATE INDEX idx_fd_type ON forwarder_documents (forwarder_id, document_type);

-- ---------- warehouses ----------
CREATE INDEX idx_warehouses_forwarder ON warehouses (forwarder_id);
CREATE INDEX idx_warehouses_country ON warehouses (country_id);
CREATE INDEX idx_warehouses_city ON warehouses (city);
CREATE INDEX idx_warehouses_active ON warehouses (forwarder_id, is_active) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_geo ON warehouses (latitude, longitude) 
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ---------- forwarder_countries ----------
CREATE INDEX idx_fc_forwarder ON forwarder_countries (forwarder_id);
CREATE INDEX idx_fc_country ON forwarder_countries (country_id);

-- ---------- forwarder_transport_modes ----------
CREATE INDEX idx_ftm_forwarder ON forwarder_transport_modes (forwarder_id);
CREATE INDEX idx_ftm_transport ON forwarder_transport_modes (transport_mode_id);

-- ---------- forwarder_categories ----------
CREATE INDEX idx_fcat_forwarder ON forwarder_categories (forwarder_id);
CREATE INDEX idx_fcat_category ON forwarder_categories (category_id);

-- ---------- pricing_rules ----------
CREATE INDEX idx_pr_forwarder ON pricing_rules (forwarder_id);
CREATE INDEX idx_pr_country ON pricing_rules (country_id);
CREATE INDEX idx_pr_transport ON pricing_rules (transport_mode_id);
CREATE INDEX idx_pr_composite ON pricing_rules (forwarder_id, country_id, transport_mode_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_pr_active ON pricing_rules (is_active) 
    WHERE deleted_at IS NULL AND is_active = true;

-- ---------- pricing_tiers ----------
CREATE INDEX idx_pt_rule ON pricing_tiers (pricing_rule_id);
CREATE INDEX idx_pt_range ON pricing_tiers (pricing_rule_id, min_value, max_value);

-- ---------- forwarder_restrictions ----------
CREATE INDEX idx_fr_forwarder ON forwarder_restrictions (forwarder_id);
CREATE INDEX idx_fr_category ON forwarder_restrictions (category_id);
CREATE INDEX idx_fr_composite ON forwarder_restrictions 
    (forwarder_id, category_id, country_id, transport_mode_id);

-- ---------- delivery_estimates ----------
CREATE INDEX idx_de_forwarder ON delivery_estimates (forwarder_id);
CREATE INDEX idx_de_route ON delivery_estimates (country_id, transport_mode_id);

-- ---------- audit_logs ----------
CREATE INDEX idx_al_table ON audit_logs (table_name);
CREATE INDEX idx_al_record ON audit_logs (record_id);
CREATE INDEX idx_al_user ON audit_logs (user_id);
CREATE INDEX idx_al_created ON audit_logs (created_at DESC);
CREATE INDEX idx_al_composite ON audit_logs (table_name, record_id, created_at DESC);

-- ---------- V2 : tracking_events ----------
CREATE INDEX idx_te_shipment ON tracking_events (shipment_id);
CREATE INDEX idx_te_date ON tracking_events (shipment_id, event_date DESC);

-- ---------- V2 : reviews ----------
CREATE INDEX idx_rv_forwarder ON reviews (forwarder_id);
CREATE INDEX idx_rv_customer ON reviews (customer_id);
CREATE INDEX idx_rv_rating ON reviews (forwarder_id, rating);

-- ---------- V2 : notifications ----------
CREATE INDEX idx_notif_recipient ON notifications (recipient_type, recipient_id);
CREATE INDEX idx_notif_unread ON notifications (recipient_type, recipient_id, is_read) 
    WHERE is_read = false;


-- ============================================================================
-- 11. TRIGGERS
-- ============================================================================

-- ---------- updated_at automatique ----------
-- Appliqué à toutes les tables qui ont une colonne updated_at

CREATE TRIGGER trg_internal_users_updated_at
    BEFORE UPDATE ON internal_users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_forwarders_updated_at
    BEFORE UPDATE ON forwarders
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_forwarder_documents_updated_at
    BEFORE UPDATE ON forwarder_documents
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_warehouses_updated_at
    BEFORE UPDATE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_pricing_rules_updated_at
    BEFORE UPDATE ON pricing_rules
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_forwarder_restrictions_updated_at
    BEFORE UPDATE ON forwarder_restrictions
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_delivery_estimates_updated_at
    BEFORE UPDATE ON delivery_estimates
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_shipment_requests_updated_at
    BEFORE UPDATE ON shipment_requests
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ---------- Soft delete (empêche la suppression physique) ----------

CREATE TRIGGER trg_forwarders_soft_delete
    BEFORE DELETE ON forwarders
    FOR EACH ROW EXECUTE FUNCTION trigger_soft_delete();

CREATE TRIGGER trg_warehouses_soft_delete
    BEFORE DELETE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION trigger_soft_delete();

CREATE TRIGGER trg_pricing_rules_soft_delete
    BEFORE DELETE ON pricing_rules
    FOR EACH ROW EXECUTE FUNCTION trigger_soft_delete();

-- ---------- Audit logging ----------
-- Appliqué aux tables métier principales

CREATE TRIGGER trg_forwarders_audit
    AFTER INSERT OR UPDATE OR DELETE ON forwarders
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

CREATE TRIGGER trg_warehouses_audit
    AFTER INSERT OR UPDATE OR DELETE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

CREATE TRIGGER trg_pricing_rules_audit
    AFTER INSERT OR UPDATE OR DELETE ON pricing_rules
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

CREATE TRIGGER trg_pricing_tiers_audit
    AFTER INSERT OR UPDATE OR DELETE ON pricing_tiers
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

CREATE TRIGGER trg_forwarder_documents_audit
    AFTER INSERT OR UPDATE OR DELETE ON forwarder_documents
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();


-- ============================================================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE forwarders ENABLE ROW LEVEL SECURITY;
ALTER TABLE forwarder_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE forwarder_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE forwarder_transport_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forwarder_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE forwarder_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ---------- Fonction helper : vérifier si l'utilisateur est interne ----------
CREATE OR REPLACE FUNCTION is_internal_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM internal_users 
        WHERE auth_user_id = auth.uid() 
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction helper : obtenir le rôle de l'utilisateur interne
CREATE OR REPLACE FUNCTION get_internal_role()
RETURNS VARCHAR AS $$
BEGIN
    RETURN (
        SELECT role FROM internal_users 
        WHERE auth_user_id = auth.uid() 
          AND is_active = true
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction helper : vérifier si l'utilisateur a un rôle minimum
CREATE OR REPLACE FUNCTION has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM internal_users 
        WHERE auth_user_id = auth.uid() 
          AND is_active = true
          AND role = ANY(required_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ===== POLITIQUES DE LECTURE (V1 : tout le monde interne peut lire) =====

-- Tables de référence : lisibles par tous les internes
CREATE POLICY "ref_read_internal" ON countries
    FOR SELECT USING (is_internal_user());
CREATE POLICY "ref_read_internal" ON transport_modes
    FOR SELECT USING (is_internal_user());
CREATE POLICY "ref_read_internal" ON product_categories
    FOR SELECT USING (is_internal_user());

-- Tables métier : lisibles par tous les internes
CREATE POLICY "forwarders_read" ON forwarders
    FOR SELECT USING (is_internal_user());
CREATE POLICY "documents_read" ON forwarder_documents
    FOR SELECT USING (is_internal_user());
CREATE POLICY "warehouses_read" ON warehouses
    FOR SELECT USING (is_internal_user());
CREATE POLICY "fc_read" ON forwarder_countries
    FOR SELECT USING (is_internal_user());
CREATE POLICY "ftm_read" ON forwarder_transport_modes
    FOR SELECT USING (is_internal_user());
CREATE POLICY "fcat_read" ON forwarder_categories
    FOR SELECT USING (is_internal_user());
CREATE POLICY "pr_read" ON pricing_rules
    FOR SELECT USING (is_internal_user());
CREATE POLICY "pt_read" ON pricing_tiers
    FOR SELECT USING (is_internal_user());
CREATE POLICY "fr_read" ON forwarder_restrictions
    FOR SELECT USING (is_internal_user());
CREATE POLICY "de_read" ON delivery_estimates
    FOR SELECT USING (is_internal_user());

-- Audit : lisible uniquement par admin et manager
CREATE POLICY "audit_read" ON audit_logs
    FOR SELECT USING (has_role(ARRAY['admin', 'manager']));

-- Internal users : lecture par tous les internes (pour afficher les noms)
CREATE POLICY "iu_read" ON internal_users
    FOR SELECT USING (is_internal_user());

-- ===== POLITIQUES D'ÉCRITURE =====

-- Tables de référence : modifiables par admin uniquement
CREATE POLICY "ref_write_admin" ON countries
    FOR ALL USING (has_role(ARRAY['admin']));
CREATE POLICY "ref_write_admin" ON transport_modes
    FOR ALL USING (has_role(ARRAY['admin']));
CREATE POLICY "ref_write_admin" ON product_categories
    FOR ALL USING (has_role(ARRAY['admin']));

-- Transitaires : création par operator+, modification par manager+, suppression par admin
CREATE POLICY "forwarders_insert" ON forwarders
    FOR INSERT WITH CHECK (has_role(ARRAY['admin', 'manager', 'operator']));
CREATE POLICY "forwarders_update" ON forwarders
    FOR UPDATE USING (has_role(ARRAY['admin', 'manager']));
CREATE POLICY "forwarders_delete" ON forwarders
    FOR DELETE USING (has_role(ARRAY['admin']));

-- Documents : gérés par operator+
CREATE POLICY "documents_insert" ON forwarder_documents
    FOR INSERT WITH CHECK (has_role(ARRAY['admin', 'manager', 'operator']));
CREATE POLICY "documents_update" ON forwarder_documents
    FOR UPDATE USING (has_role(ARRAY['admin', 'manager']));
CREATE POLICY "documents_delete" ON forwarder_documents
    FOR DELETE USING (has_role(ARRAY['admin']));

-- Entrepôts : gérés par operator+
CREATE POLICY "warehouses_insert" ON warehouses
    FOR INSERT WITH CHECK (has_role(ARRAY['admin', 'manager', 'operator']));
CREATE POLICY "warehouses_update" ON warehouses
    FOR UPDATE USING (has_role(ARRAY['admin', 'manager']));
CREATE POLICY "warehouses_delete" ON warehouses
    FOR DELETE USING (has_role(ARRAY['admin']));

-- Liaisons : gérées par operator+
CREATE POLICY "fc_write" ON forwarder_countries
    FOR ALL USING (has_role(ARRAY['admin', 'manager', 'operator']));
CREATE POLICY "ftm_write" ON forwarder_transport_modes
    FOR ALL USING (has_role(ARRAY['admin', 'manager', 'operator']));
CREATE POLICY "fcat_write" ON forwarder_categories
    FOR ALL USING (has_role(ARRAY['admin', 'manager', 'operator']));

-- Tarification : gérée par manager+
CREATE POLICY "pr_write" ON pricing_rules
    FOR ALL USING (has_role(ARRAY['admin', 'manager']));
CREATE POLICY "pt_write" ON pricing_tiers
    FOR ALL USING (has_role(ARRAY['admin', 'manager']));

-- Restrictions et délais : gérés par manager+
CREATE POLICY "fr_write" ON forwarder_restrictions
    FOR ALL USING (has_role(ARRAY['admin', 'manager']));
CREATE POLICY "de_write" ON delivery_estimates
    FOR ALL USING (has_role(ARRAY['admin', 'manager']));

-- Audit : insertion uniquement (via triggers), jamais de modification
CREATE POLICY "audit_insert_only" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Internal users : gérés par admin uniquement
CREATE POLICY "iu_write" ON internal_users
    FOR ALL USING (has_role(ARRAY['admin']));


-- ============================================================================
-- FIN DE LA MIGRATION INITIALE
-- ============================================================================
