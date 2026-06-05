-- ============================================================================
-- MON TRANSITAIRE — Données de Référence (Seed)
-- ============================================================================
-- Ce fichier contient :
--   1. Pays de référence (focus Afrique de l'Ouest + pays sources principaux)
--   2. Modes de transport
--   3. Catégories de produits
--   4. Utilisateur admin initial
--   5. Transitaires fictifs de test (avec données complètes)
-- ============================================================================


-- ============================================================================
-- 1. PAYS DE RÉFÉRENCE
-- ============================================================================
-- Focus : pays sources (Chine, France, Turquie, Dubai, USA, Inde, Allemagne)
-- + pays d'Afrique de l'Ouest

INSERT INTO countries (name, iso_code_2, iso_code_3, continent, phone_prefix, currency_code, flag_emoji) VALUES

-- Afrique de l'Ouest
('Côte d''Ivoire', 'CI', 'CIV', 'Afrique', '+225', 'XOF', '🇨🇮'),
('Sénégal', 'SN', 'SEN', 'Afrique', '+221', 'XOF', '🇸🇳'),
('Mali', 'ML', 'MLI', 'Afrique', '+223', 'XOF', '🇲🇱'),
('Burkina Faso', 'BF', 'BFA', 'Afrique', '+226', 'XOF', '🇧🇫'),
('Guinée', 'GN', 'GIN', 'Afrique', '+224', 'GNF', '🇬🇳'),
('Bénin', 'BJ', 'BEN', 'Afrique', '+229', 'XOF', '🇧🇯'),
('Togo', 'TG', 'TGO', 'Afrique', '+228', 'XOF', '🇹🇬'),
('Niger', 'NE', 'NER', 'Afrique', '+227', 'XOF', '🇳🇪'),
('Ghana', 'GH', 'GHA', 'Afrique', '+233', 'GHS', '🇬🇭'),
('Nigeria', 'NG', 'NGA', 'Afrique', '+234', 'NGN', '🇳🇬'),
('Cameroun', 'CM', 'CMR', 'Afrique', '+237', 'XAF', '🇨🇲'),
('Gabon', 'GA', 'GAB', 'Afrique', '+241', 'XAF', '🇬🇦'),
('Congo', 'CG', 'COG', 'Afrique', '+242', 'XAF', '🇨🇬'),
('RD Congo', 'CD', 'COD', 'Afrique', '+243', 'CDF', '🇨🇩'),
('Maroc', 'MA', 'MAR', 'Afrique', '+212', 'MAD', '🇲🇦'),

-- Asie (sources principales)
('Chine', 'CN', 'CHN', 'Asie', '+86', 'CNY', '🇨🇳'),
('Inde', 'IN', 'IND', 'Asie', '+91', 'INR', '🇮🇳'),
('Japon', 'JP', 'JPN', 'Asie', '+81', 'JPY', '🇯🇵'),
('Corée du Sud', 'KR', 'KOR', 'Asie', '+82', 'KRW', '🇰🇷'),
('Thaïlande', 'TH', 'THA', 'Asie', '+66', 'THB', '🇹🇭'),
('Malaisie', 'MY', 'MYS', 'Asie', '+60', 'MYR', '🇲🇾'),
('Vietnam', 'VN', 'VNM', 'Asie', '+84', 'VND', '🇻🇳'),
('Indonésie', 'ID', 'IDN', 'Asie', '+62', 'IDR', '🇮🇩'),

-- Europe
('France', 'FR', 'FRA', 'Europe', '+33', 'EUR', '🇫🇷'),
('Allemagne', 'DE', 'DEU', 'Europe', '+49', 'EUR', '🇩🇪'),
('Belgique', 'BE', 'BEL', 'Europe', '+32', 'EUR', '🇧🇪'),
('Italie', 'IT', 'ITA', 'Europe', '+39', 'EUR', '🇮🇹'),
('Espagne', 'ES', 'ESP', 'Europe', '+34', 'EUR', '🇪🇸'),
('Royaume-Uni', 'GB', 'GBR', 'Europe', '+44', 'GBP', '🇬🇧'),
('Pays-Bas', 'NL', 'NLD', 'Europe', '+31', 'EUR', '🇳🇱'),
('Portugal', 'PT', 'PRT', 'Europe', '+351', 'EUR', '🇵🇹'),

-- Moyen-Orient
('Turquie', 'TR', 'TUR', 'Asie', '+90', 'TRY', '🇹🇷'),
('Émirats Arabes Unis', 'AE', 'ARE', 'Asie', '+971', 'AED', '🇦🇪'),
('Arabie Saoudite', 'SA', 'SAU', 'Asie', '+966', 'SAR', '🇸🇦'),

-- Amériques
('États-Unis', 'US', 'USA', 'Amérique', '+1', 'USD', '🇺🇸'),
('Canada', 'CA', 'CAN', 'Amérique', '+1', 'CAD', '🇨🇦'),
('Brésil', 'BR', 'BRA', 'Amérique', '+55', 'BRL', '🇧🇷');


-- ============================================================================
-- 2. MODES DE TRANSPORT
-- ============================================================================

INSERT INTO transport_modes (name, code, description, icon) VALUES
('Avion', 'AIR', 'Transport aérien — rapide mais coûteux. Idéal pour les petits volumes et les envois urgents.', 'plane'),
('Bateau', 'SEA', 'Transport maritime — économique pour les gros volumes. Délais plus longs (30-60 jours).', 'ship'),
('Route', 'ROAD', 'Transport routier — pour les trajets terrestres régionaux (Afrique de l''Ouest).', 'truck'),
('Train', 'RAIL', 'Transport ferroviaire — alternative économique pour certaines routes Chine-Europe.', 'train'),
('Express', 'EXPRESS', 'Courrier express international (DHL, FedEx, UPS). Porte-à-porte rapide.', 'zap');


-- ============================================================================
-- 3. CATÉGORIES DE PRODUITS
-- ============================================================================

INSERT INTO product_categories (name, slug, description, icon, requires_special_handling, sort_order) VALUES
('Vêtements', 'vetements', 'Textiles, habits, tissus, mercerie', 'shirt', false, 1),
('Chaussures', 'chaussures', 'Chaussures, sandales, bottes', 'footprints', false, 2),
('Électronique', 'electronique', 'Téléphones, ordinateurs, tablettes, accessoires électroniques', 'smartphone', false, 3),
('Batteries', 'batteries', 'Batteries lithium, piles, accumulateurs — produit réglementé', 'battery-charging', true, 4),
('Cosmétiques', 'cosmetiques', 'Produits de beauté, soins, parfums', 'sparkles', false, 5),
('Liquides', 'liquides', 'Huiles, boissons, produits chimiques liquides — manutention spéciale', 'droplets', true, 6),
('Meubles', 'meubles', 'Mobilier, décoration, ameublement — volumes importants', 'armchair', false, 7),
('Machines', 'machines', 'Équipements industriels, machines-outils, générateurs', 'cog', false, 8),
('Pièces Auto', 'pieces-auto', 'Pièces détachées automobiles, moteurs, pneus', 'car', false, 9),
('Alimentaire', 'alimentaire', 'Produits alimentaires secs, conserves, épices — contrôle sanitaire', 'utensils', true, 10),
('Matériaux Construction', 'materiaux-construction', 'Carrelage, sanitaire, quincaillerie, matériaux de construction', 'hard-hat', false, 11),
('Jouets', 'jouets', 'Jouets pour enfants, jeux, articles de loisirs', 'gamepad-2', false, 12),
('Textile Maison', 'textile-maison', 'Draps, rideaux, tapis, serviettes', 'bed', false, 13),
('Médical', 'medical', 'Équipements médicaux, produits pharmaceutiques — réglementation stricte', 'heart-pulse', true, 14),
('Produits Chimiques', 'produits-chimiques', 'Produits chimiques industriels — matières dangereuses', 'flask-conical', true, 15),
('Autres', 'autres', 'Tout produit ne rentrant pas dans les catégories précédentes', 'package', false, 99);


-- ============================================================================
-- 4. UTILISATEUR ADMIN INITIAL
-- ============================================================================
-- Note : auth_user_id sera mis à jour après création du compte dans Supabase Auth

INSERT INTO internal_users (full_name, email, role, is_active) VALUES
('Administrateur MON TRANSITAIRE', 'admin@montransitaire.ci', 'admin', true);


-- ============================================================================
-- 5. TRANSITAIRES FICTIFS DE TEST
-- ============================================================================
-- Ces données permettent de tester l'interface dès le déploiement.
-- À supprimer avant la mise en production.
-- 
-- IMPORTANT : On désactive temporairement le trigger soft_delete pour 
-- permettre un nettoyage réel des données de test (idempotent).

-- Désactiver les triggers soft_delete pour le nettoyage
ALTER TABLE forwarders DISABLE TRIGGER trg_forwarders_soft_delete;
ALTER TABLE warehouses DISABLE TRIGGER trg_warehouses_soft_delete;
ALTER TABLE pricing_rules DISABLE TRIGGER trg_pricing_rules_soft_delete;

-- Désactiver les triggers d'audit pour éviter du bruit pendant le seed
ALTER TABLE forwarders DISABLE TRIGGER trg_forwarders_audit;
ALTER TABLE warehouses DISABLE TRIGGER trg_warehouses_audit;
ALTER TABLE pricing_rules DISABLE TRIGGER trg_pricing_rules_audit;
ALTER TABLE pricing_tiers DISABLE TRIGGER trg_pricing_tiers_audit;
ALTER TABLE forwarder_documents DISABLE TRIGGER trg_forwarder_documents_audit;

-- Supprimer les données de test précédentes si elles existent (idempotent)
DELETE FROM pricing_tiers WHERE pricing_rule_id IN (SELECT id FROM pricing_rules WHERE forwarder_id IN (SELECT id FROM forwarders WHERE company_name IN ('Golden Bridge Logistics', 'Trans-Sahel Express', 'EuroFret International')));
DELETE FROM pricing_rules WHERE forwarder_id IN (SELECT id FROM forwarders WHERE company_name IN ('Golden Bridge Logistics', 'Trans-Sahel Express', 'EuroFret International'));
DELETE FROM delivery_estimates WHERE forwarder_id IN (SELECT id FROM forwarders WHERE company_name IN ('Golden Bridge Logistics', 'Trans-Sahel Express', 'EuroFret International'));
DELETE FROM forwarder_restrictions WHERE forwarder_id IN (SELECT id FROM forwarders WHERE company_name IN ('Golden Bridge Logistics', 'Trans-Sahel Express', 'EuroFret International'));
DELETE FROM forwarder_categories WHERE forwarder_id IN (SELECT id FROM forwarders WHERE company_name IN ('Golden Bridge Logistics', 'Trans-Sahel Express', 'EuroFret International'));
DELETE FROM forwarder_transport_modes WHERE forwarder_id IN (SELECT id FROM forwarders WHERE company_name IN ('Golden Bridge Logistics', 'Trans-Sahel Express', 'EuroFret International'));
DELETE FROM forwarder_countries WHERE forwarder_id IN (SELECT id FROM forwarders WHERE company_name IN ('Golden Bridge Logistics', 'Trans-Sahel Express', 'EuroFret International'));
DELETE FROM warehouses WHERE forwarder_id IN (SELECT id FROM forwarders WHERE company_name IN ('Golden Bridge Logistics', 'Trans-Sahel Express', 'EuroFret International'));
DELETE FROM forwarders WHERE company_name IN ('Golden Bridge Logistics', 'Trans-Sahel Express', 'EuroFret International');

-- ===================================================================
-- TRANSITAIRE A : GOLDEN BRIDGE LOGISTICS
-- ===================================================================
INSERT INTO forwarders (
    id, company_name, contact_person, phone, whatsapp, email,
    address_abidjan, rccm, description, status,
    partnership_status, trust_level, first_contact_date, last_contact_date,
    internal_notes
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Golden Bridge Logistics',
    'M. KONÉ Ibrahim',
    '+225 07 08 09 10 11',
    '+225 07 08 09 10 11',
    'contact@goldenbridgeci.com',
    'Cocody, Riviera Palmeraie, Rue des Jardins, Immeuble Les Palmiers, 2ème étage',
    'CI-ABJ-2021-B-12345',
    'Transitaire spécialisé dans le fret Chine → Côte d''Ivoire depuis 2015. Reconnu pour sa fiabilité et ses tarifs compétitifs.',
    'active',
    'partner', 5, '2024-01-15', '2025-06-01',
    'Excellent partenaire. Tarifs renégociés en janvier 2025.'
);

-- Entrepôts Golden Bridge
INSERT INTO warehouses (forwarder_id, country_id, city, full_address, phone, contact_name, contact_phone, latitude, longitude) VALUES
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM countries WHERE iso_code_2 = 'CN'), 'Guangzhou', '广州市白云区太和镇北太路168号, Warehouse 12B', '+86 136 0000 1111', 'Wang Wei', '+86 136 0000 1111', 23.1291000, 113.2644000),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM countries WHERE iso_code_2 = 'CN'), 'Yiwu', '义乌市国际商贸城二期F区2楼', '+86 139 0000 2222', 'Li Ming', '+86 139 0000 2222', 29.3069000, 120.0753000);

-- Couverture pays
INSERT INTO forwarder_countries (forwarder_id, country_id) VALUES
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM countries WHERE iso_code_2 = 'CN')),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM countries WHERE iso_code_2 = 'TR'));

-- Modes
INSERT INTO forwarder_transport_modes (forwarder_id, transport_mode_id) VALUES
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM transport_modes WHERE code = 'AIR')),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM transport_modes WHERE code = 'SEA'));

-- Catégories
INSERT INTO forwarder_categories (forwarder_id, category_id, is_accepted, restriction_notes) VALUES
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM product_categories WHERE slug = 'vetements'), true, NULL),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM product_categories WHERE slug = 'chaussures'), true, NULL),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM product_categories WHERE slug = 'electronique'), true, 'Emballage renforcé requis'),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM product_categories WHERE slug = 'batteries'), false, 'Interdites par avion. Par bateau si < 100Wh.'),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM product_categories WHERE slug = 'cosmetiques'), true, NULL),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM product_categories WHERE slug = 'liquides'), false, 'Non acceptés par avion. Max 20L par bateau.'),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM product_categories WHERE slug = 'meubles'), true, 'Par bateau uniquement. CBM min 1m³.'),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM product_categories WHERE slug = 'machines'), true, 'Sur devis pour > 500kg');

-- Tarifs CHINE AVION KG (dégressif)
INSERT INTO pricing_rules (id, forwarder_id, country_id, transport_mode_id, pricing_type, currency, is_negotiable, valid_from, notes) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', (SELECT id FROM countries WHERE iso_code_2 = 'CN'), (SELECT id FROM transport_modes WHERE code = 'AIR'), 'KG', 'XOF', true, '2025-01-01', 'Tarifs négociés janv. 2025');

INSERT INTO pricing_tiers (pricing_rule_id, min_value, max_value, price_per_unit, unit) VALUES
('b0000000-0000-0000-0000-000000000001', 0, 10, 10000, 'KG'),
('b0000000-0000-0000-0000-000000000001', 10, 50, 8000, 'KG'),
('b0000000-0000-0000-0000-000000000001', 50, NULL, 7000, 'KG');

-- Tarifs CHINE BATEAU CBM (prix unique)
INSERT INTO pricing_rules (id, forwarder_id, country_id, transport_mode_id, pricing_type, currency, is_negotiable, valid_from, notes) VALUES
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', (SELECT id FROM countries WHERE iso_code_2 = 'CN'), (SELECT id FROM transport_modes WHERE code = 'SEA'), 'CBM', 'XOF', false, '2025-01-01', 'Prix fixe par CBM');

INSERT INTO pricing_tiers (pricing_rule_id, min_value, max_value, price_per_unit, unit) VALUES
('b0000000-0000-0000-0000-000000000002', 0, NULL, 250000, 'CBM');

-- Restrictions
INSERT INTO forwarder_restrictions (forwarder_id, category_id, transport_mode_id, restriction_type, description, is_absolute) VALUES
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM product_categories WHERE slug = 'batteries'), (SELECT id FROM transport_modes WHERE code = 'AIR'), 'forbidden', 'Batteries lithium strictement interdites par avion (réglementation IATA)', true),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM product_categories WHERE slug = 'liquides'), (SELECT id FROM transport_modes WHERE code = 'AIR'), 'forbidden', 'Liquides interdits par fret aérien', true);

-- Délais
INSERT INTO delivery_estimates (forwarder_id, country_id, transport_mode_id, min_days, max_days, notes) VALUES
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM countries WHERE iso_code_2 = 'CN'), (SELECT id FROM transport_modes WHERE code = 'AIR'), 7, 15, 'Hors dédouanement. Guangzhou → Abidjan.'),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM countries WHERE iso_code_2 = 'CN'), (SELECT id FROM transport_modes WHERE code = 'SEA'), 35, 55, 'Port de Guangzhou → Port d''Abidjan. Dédouanement 3-7 jours en sus.');


-- ===================================================================
-- TRANSITAIRE B : TRANS-SAHEL EXPRESS
-- ===================================================================
INSERT INTO forwarders (
    id, company_name, contact_person, phone, whatsapp, email,
    address_abidjan, rccm, description, status,
    partnership_status, trust_level, first_contact_date, last_contact_date,
    internal_notes
) VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'Trans-Sahel Express',
    'Mme DIALLO Aminata',
    '+225 05 06 07 08 09',
    '+225 05 06 07 08 09',
    'aminata@transsahel.ci',
    'Plateau, Avenue Franchet d''Espérey, Immeuble CCIA, 5ème étage',
    'CI-ABJ-2019-A-67890',
    'Transitaire multi-routes spécialisé dans le fret aérien depuis la Turquie, la France et Dubai. Service premium avec suivi personnalisé.',
    'active',
    'partner', 4, '2024-03-20', '2025-05-15',
    'Bon service client. Spécialisée fret aérien. Tarifs un peu élevés mais service fiable.'
);

-- Entrepôts Trans-Sahel
INSERT INTO warehouses (forwarder_id, country_id, city, full_address, phone, contact_name, contact_phone, latitude, longitude) VALUES
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM countries WHERE iso_code_2 = 'TR'), 'Istanbul', 'Atatürk Havalimanı Kargo Terminali, Yeşilköy Mh., Bakırköy', '+90 212 000 1111', 'Mehmet Yılmaz', '+90 532 000 1111', 41.0082000, 28.9784000),
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM countries WHERE iso_code_2 = 'FR'), 'Paris', 'Zone Fret 4, Aéroport Charles de Gaulle, 95700 Roissy-en-France', '+33 1 00 00 11 11', 'Jean-Pierre Dupont', '+33 6 00 00 11 11', 49.0097000, 2.5479000),
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM countries WHERE iso_code_2 = 'AE'), 'Dubai', 'Jebel Ali Free Zone, Warehouse 45, Dubai', '+971 4 000 1111', 'Ahmed Al-Rashid', '+971 50 000 1111', 25.0073000, 55.0848000);

-- Couverture pays
INSERT INTO forwarder_countries (forwarder_id, country_id) VALUES
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM countries WHERE iso_code_2 = 'TR')),
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM countries WHERE iso_code_2 = 'FR')),
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM countries WHERE iso_code_2 = 'AE'));

-- Modes
INSERT INTO forwarder_transport_modes (forwarder_id, transport_mode_id) VALUES
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM transport_modes WHERE code = 'AIR'));

-- Catégories
INSERT INTO forwarder_categories (forwarder_id, category_id, is_accepted) VALUES
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM product_categories WHERE slug = 'vetements'), true),
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM product_categories WHERE slug = 'chaussures'), true),
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM product_categories WHERE slug = 'electronique'), true),
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM product_categories WHERE slug = 'cosmetiques'), true);

-- Tarifs TURQUIE AVION KG
INSERT INTO pricing_rules (id, forwarder_id, country_id, transport_mode_id, pricing_type, currency, valid_from, notes) VALUES
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', (SELECT id FROM countries WHERE iso_code_2 = 'TR'), (SELECT id FROM transport_modes WHERE code = 'AIR'), 'KG', 'XOF', '2025-01-01', 'Tarif unique par kg');

INSERT INTO pricing_tiers (pricing_rule_id, min_value, max_value, price_per_unit, unit) VALUES
('b0000000-0000-0000-0000-000000000003', 0, NULL, 9000, 'KG');

-- Tarifs FRANCE AVION KG
INSERT INTO pricing_rules (id, forwarder_id, country_id, transport_mode_id, pricing_type, currency, valid_from, notes) VALUES
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', (SELECT id FROM countries WHERE iso_code_2 = 'FR'), (SELECT id FROM transport_modes WHERE code = 'AIR'), 'KG', 'XOF', '2025-01-01', 'Tarif unique par kg');

INSERT INTO pricing_tiers (pricing_rule_id, min_value, max_value, price_per_unit, unit) VALUES
('b0000000-0000-0000-0000-000000000004', 0, NULL, 12000, 'KG');

-- Tarifs DUBAI AVION KG (dégressif)
INSERT INTO pricing_rules (id, forwarder_id, country_id, transport_mode_id, pricing_type, currency, valid_from, notes) VALUES
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', (SELECT id FROM countries WHERE iso_code_2 = 'AE'), (SELECT id FROM transport_modes WHERE code = 'AIR'), 'KG', 'XOF', '2025-01-01', 'Tarif dégressif par kg');

INSERT INTO pricing_tiers (pricing_rule_id, min_value, max_value, price_per_unit, unit) VALUES
('b0000000-0000-0000-0000-000000000005', 0, 20, 11000, 'KG'),
('b0000000-0000-0000-0000-000000000005', 20, NULL, 9500, 'KG');

-- Délais
INSERT INTO delivery_estimates (forwarder_id, country_id, transport_mode_id, min_days, max_days, notes) VALUES
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM countries WHERE iso_code_2 = 'TR'), (SELECT id FROM transport_modes WHERE code = 'AIR'), 5, 10, 'Istanbul → Abidjan via vol direct ou escale.'),
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM countries WHERE iso_code_2 = 'FR'), (SELECT id FROM transport_modes WHERE code = 'AIR'), 3, 7, 'Paris CDG → Abidjan. Vol direct fréquent.'),
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM countries WHERE iso_code_2 = 'AE'), (SELECT id FROM transport_modes WHERE code = 'AIR'), 5, 12, 'Dubai → Abidjan via Ethiopian ou Emirates.');


-- ===================================================================
-- TRANSITAIRE C : EUROFRET INTERNATIONAL (prospect)
-- ===================================================================
INSERT INTO forwarders (
    id, company_name, contact_person, phone, whatsapp, email,
    address_abidjan, description, status,
    partnership_status, trust_level, first_contact_date,
    internal_notes
) VALUES (
    'a0000000-0000-0000-0000-000000000003',
    'EuroFret International',
    'M. TOURÉ Moussa',
    '+225 01 02 03 04 05',
    '+225 01 02 03 04 05',
    'info@eurofretci.com',
    'Marcory, Zone 4, près du marché',
    'Nouveau transitaire en cours d''évaluation. Spécialisé dans le fret maritime depuis l''Inde.',
    'pending',
    'negotiating', 3, '2025-05-20',
    'Rencontré au salon du commerce international d''Abidjan. Prix intéressants sur l''Inde. À vérifier : fiabilité et assurance.'
);

-- Couverture pays (en négociation)
INSERT INTO forwarder_countries (forwarder_id, country_id, is_active) VALUES
('a0000000-0000-0000-0000-000000000003', (SELECT id FROM countries WHERE iso_code_2 = 'IN'), true),
('a0000000-0000-0000-0000-000000000003', (SELECT id FROM countries WHERE iso_code_2 = 'CN'), false);

-- Modes
INSERT INTO forwarder_transport_modes (forwarder_id, transport_mode_id) VALUES
('a0000000-0000-0000-0000-000000000003', (SELECT id FROM transport_modes WHERE code = 'SEA'));


-- ============================================================================
-- RÉACTIVER LES TRIGGERS
-- ============================================================================
-- Les triggers sont réactivés après l'insertion des données de test.

ALTER TABLE forwarders ENABLE TRIGGER trg_forwarders_soft_delete;
ALTER TABLE warehouses ENABLE TRIGGER trg_warehouses_soft_delete;
ALTER TABLE pricing_rules ENABLE TRIGGER trg_pricing_rules_soft_delete;

ALTER TABLE forwarders ENABLE TRIGGER trg_forwarders_audit;
ALTER TABLE warehouses ENABLE TRIGGER trg_warehouses_audit;
ALTER TABLE pricing_rules ENABLE TRIGGER trg_pricing_rules_audit;
ALTER TABLE pricing_tiers ENABLE TRIGGER trg_pricing_tiers_audit;
ALTER TABLE forwarder_documents ENABLE TRIGGER trg_forwarder_documents_audit;

-- ============================================================================
-- FIN DU SEED
-- ============================================================================
