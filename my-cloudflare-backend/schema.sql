-- Tabel Klinik (Tenants)
CREATE TABLE IF NOT EXISTS clinics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    subscriptionPlan TEXT,
    status TEXT DEFAULT 'pending', -- pending, active, inactive, rejected
    isAdmin INTEGER DEFAULT 0, -- 1 for system admin
    clinicType TEXT DEFAULT 'Bidan', -- Bidan, Perawat, Dokter
    validUntil DATETIME, -- The expiration date of the clinic's active subscription
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pasien
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    clinicId TEXT NOT NULL,
    rm TEXT,
    name TEXT NOT NULL,
    namaSuami TEXT,
    gender TEXT,
    category TEXT,
    address TEXT,
    dob TEXT,
    ageYears INTEGER,
    ageMonths INTEGER,
    ageDisplay TEXT,
    poli TEXT DEFAULT 'Umum',
    allergies TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdBy TEXT,
    FOREIGN KEY (clinicId) REFERENCES clinics(id)
);

-- Tabel Obat
CREATE TABLE IF NOT EXISTS medicines (
    id TEXT PRIMARY KEY,
    clinicId TEXT NOT NULL,
    name TEXT NOT NULL,
    unit TEXT,
    price REAL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdBy TEXT,
    FOREIGN KEY (clinicId) REFERENCES clinics(id)
);

-- Tabel Pemeriksaan (Examination - SOAP Standar Indonesia)
CREATE TABLE IF NOT EXISTS examinations (
    id TEXT PRIMARY KEY,
    clinicId TEXT NOT NULL,
    patientId TEXT NOT NULL,
    patientName TEXT,
    patientRm TEXT,
    
    -- S: Subjective
    keluhanUtama TEXT NOT NULL,
    riwayatPenyakitSekarang TEXT,
    
    -- O: Objective
    tensi TEXT,
    nadi INTEGER,
    suhu REAL,
    respirasi INTEGER,
    bb REAL,
    tb REAL,
    spo2 INTEGER,
    pemeriksaanFisik TEXT,
    
    -- A: Assessment
    diagnosa TEXT NOT NULL,
    icd10 TEXT,
    
    -- P: Plan
    medicines_json TEXT, -- Obat dalam format JSON string
    tindakan TEXT,
    edukasi TEXT,
    rencanaTindakLanjut TEXT,

    biaya REAL DEFAULT 0,
    extendedData_json TEXT, -- Data spesifik kategori (Bumil, Anak, dll)
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdBy TEXT,
    FOREIGN KEY (clinicId) REFERENCES clinics(id),
    FOREIGN KEY (patientId) REFERENCES patients(id)
);

-- Tabel Kunjungan (Visit)
CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY,
    clinicId TEXT NOT NULL,
    patientId TEXT NOT NULL,
    patientName TEXT,
    patientRm TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    diagnosis TEXT,
    therapy TEXT,
    notes TEXT,
    cost REAL DEFAULT 0,
    createdBy TEXT,
    FOREIGN KEY (clinicId) REFERENCES clinics(id),
    FOREIGN KEY (patientId) REFERENCES patients(id)
);

-- Tabel Notifikasi
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    clinicId TEXT NOT NULL,
    type TEXT NOT NULL,
    patientId TEXT,
    patientName TEXT,
    message TEXT,
    isRead INTEGER DEFAULT 0,
    toRole TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinicId) REFERENCES clinics(id)
);

-- ============================================================================
-- INDEXES UNTUK OPTIMASI PERFORMA CLOUDFLARE D1 (Menghindari Full Table Scan)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_patients_clinicId ON patients(clinicId);
CREATE INDEX IF NOT EXISTS idx_medicines_clinicId ON medicines(clinicId);
CREATE INDEX IF NOT EXISTS idx_examinations_clinicId ON examinations(clinicId);
CREATE INDEX IF NOT EXISTS idx_examinations_patientId ON examinations(patientId);
CREATE INDEX IF NOT EXISTS idx_examinations_date ON examinations(clinicId, date); -- Optimasi: query 'hari ini'
CREATE INDEX IF NOT EXISTS idx_visits_clinicId ON visits(clinicId);
CREATE INDEX IF NOT EXISTS idx_visits_patientId ON visits(patientId);
CREATE INDEX IF NOT EXISTS idx_notifications_clinicId ON notifications(clinicId);
