-- ============================================================
-- DIAGNOSA: Pasien RM-0001 s.d. RM-0100 Hilang
-- Jalankan query ini di Cloudflare D1 Console
-- Dashboard: https://dash.cloudflare.com -> D1 -> klinik-db
-- ============================================================

-- STEP 1: Hitung total pasien semua klinik
SELECT clinicId, COUNT(*) as total_pasien 
FROM patients 
GROUP BY clinicId 
ORDER BY total_pasien DESC;

-- ============================================================
-- STEP 2: Cari apakah pasien RM-0001 s.d. RM-0100 masih ada
-- Ganti 'CLINIC_ID_ANDA' dengan ID klinik yang bermasalah
-- ============================================================
SELECT id, rm, name, poli, createdAt, updatedAt
FROM patients 
WHERE clinicId = 'CLINIC_ID_ANDA'
  AND (
    rm LIKE 'RM-000%' 
    OR rm LIKE 'RM-001%'
    OR rm LIKE 'RM-002%'
    OR rm LIKE 'RM-003%'
    OR rm LIKE 'RM-004%'
    OR rm LIKE 'RM-005%'
    OR rm LIKE 'RM-006%'
    OR rm LIKE 'RM-007%'
    OR rm LIKE 'RM-008%'
    OR rm LIKE 'RM-009%'
    OR rm LIKE 'RM-010%'
  )
ORDER BY rm ASC;

-- ============================================================
-- STEP 3: Cek rentang RM yang ada di database
-- ============================================================
SELECT 
  MIN(rm) as rm_terkecil, 
  MAX(rm) as rm_terbesar,
  COUNT(*) as total_pasien,
  MIN(createdAt) as pasien_pertama_daftar,
  MAX(createdAt) as pasien_terakhir_daftar
FROM patients 
WHERE clinicId = 'CLINIC_ID_ANDA';

-- ============================================================
-- STEP 4: Lihat distribusi RM - cek apakah ada gap (nomor hilang)
-- ============================================================
SELECT rm, name, createdAt 
FROM patients 
WHERE clinicId = 'CLINIC_ID_ANDA'
ORDER BY CAST(REPLACE(rm, 'RM-', '') AS INTEGER) ASC
LIMIT 150; -- Tampilkan 150 RM pertama

-- ============================================================
-- STEP 5: Cek apakah pasien masih ada di examinations 
-- (mungkin pasien dihapus tapi data pemeriksaannya masih ada)
-- ============================================================
SELECT 
  e.patientRm as rm, 
  e.patientName as nama,
  COUNT(*) as jumlah_pemeriksaan,
  MAX(e.createdAt) as pemeriksaan_terakhir
FROM examinations e
WHERE e.clinicId = 'CLINIC_ID_ANDA'
  AND (
    e.patientRm LIKE 'RM-000%' 
    OR e.patientRm LIKE 'RM-001%'
    OR e.patientRm LIKE 'RM-002%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM patients p 
    WHERE p.clinicId = e.clinicId AND p.rm = e.patientRm
  )
GROUP BY e.patientRm, e.patientName
ORDER BY e.patientRm;
-- Jika query ini mengembalikan data -> pasien dihapus tapi record pemeriksaan masih ada (DATA BISA DIPULIHKAN sebagian)
