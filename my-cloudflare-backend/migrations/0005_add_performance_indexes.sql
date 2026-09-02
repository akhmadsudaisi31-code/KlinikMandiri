-- Migration: Tambah index untuk query hot-path yang paling sering dipanggil oleh polling
-- Tujuan: Hindari full table scan pada tabel besar, kurangi rows read D1 per query
-- Tanggal: 2026-09-02

-- Index untuk GET /patients?activeDate (dipakai polling ExaminationList setiap 30 detik)
-- Query: WHERE clinicId = ? AND (poli = 'Pemeriksaan' OR id IN (SELECT patientId FROM examinations ...))
CREATE INDEX IF NOT EXISTS idx_patients_clinic_poli 
ON patients(clinicId, poli);

-- Index untuk GET /patients?search (server-side search di PatientList)
-- Query: WHERE clinicId = ? AND LOWER(name) LIKE ?
CREATE INDEX IF NOT EXISTS idx_patients_clinic_created 
ON patients(clinicId, createdAt DESC);

-- Index untuk GET /examinations?startDate&endDate (polling ExaminationList setiap 30 detik)
-- Query: WHERE examinations.clinicId = ? AND createdAt >= ? AND createdAt <= ?
CREATE INDEX IF NOT EXISTS idx_examinations_clinic_date 
ON examinations(clinicId, createdAt DESC);

-- Index untuk GET /notifications?toRole (polling Header setiap 30 detik)
-- Query: WHERE clinicId = ? AND isRead = 0 AND toRole = ?
CREATE INDEX IF NOT EXISTS idx_notifications_clinic_read_role 
ON notifications(clinicId, isRead, toRole, createdAt DESC);

-- Index untuk idempotency check di POST /examinations
-- Query: WHERE clinicId = ? AND patientId = ? AND createdAt > ?
CREATE INDEX IF NOT EXISTS idx_examinations_clinic_patient_date 
ON examinations(clinicId, patientId, createdAt DESC);
