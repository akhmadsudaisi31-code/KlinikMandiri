-- Tabel Paket Sistem (Global)
CREATE TABLE IF NOT EXISTS system_plans (
    id TEXT PRIMARY KEY, -- e.g. 'lite', 'pro', 'premium'
    name TEXT NOT NULL,
    features_json TEXT NOT NULL, -- e.g. '{"anc": true, "kb": true, "inventory": false}'
    price_monthly REAL DEFAULT 0,
    price_yearly REAL DEFAULT 0,
    is_selectable INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Add-on Sistem (Global)
CREATE TABLE IF NOT EXISTS system_addons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    feature_key TEXT NOT NULL, -- e.g. 'dental', 'lab_simple'
    price_monthly REAL DEFAULT 0,
    price_yearly REAL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Add-on yang dimiliki Klinik (Per-Tenancy)
CREATE TABLE IF NOT EXISTS clinic_addons (
    id TEXT PRIMARY KEY,
    clinicId TEXT NOT NULL,
    addonId TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    purchasedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME,
    FOREIGN KEY (clinicId) REFERENCES clinics(id),
    FOREIGN KEY (addonId) REFERENCES system_addons(id)
);

-- Tambahkan index untuk pencarian add-on klinik
CREATE INDEX IF NOT EXISTS idx_clinic_addons_clinic ON clinic_addons(clinicId);

-- Default Data: Seeding Initial Plans
INSERT OR IGNORE INTO system_plans (id, name, features_json, price_monthly, price_yearly) VALUES 
('lite', 'Paket Lite', '{"anc": false, "kb": false, "immunization": false, "dental": false, "lab": false, "reports": true}', 50000, 500000),
('pro', 'Paket Pro', '{"anc": true, "kb": true, "immunization": true, "dental": false, "lab": true, "reports": true}', 75000, 750000),
('premium', 'Paket Premium', '{"anc": true, "kb": true, "immunization": true, "dental": true, "lab": true, "reports": true}', 150000, 1500000);

-- Default Data: Seeding Initial Add-ons
INSERT OR IGNORE INTO system_addons (id, name, feature_key, price_monthly, price_yearly) VALUES 
('addon_dental', 'Add-on Gigi (Odontogram)', 'dental', 25000, 250000),
('addon_lab', 'Add-on Laboratorium Lengkap', 'lab_advanced', 20000, 200000);
