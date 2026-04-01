DELETE FROM notifications WHERE clinicId IN (
  'demo-bidan-clinic',
  'demo-perawat-clinic',
  'demo-dokter-clinic',
  'demo-dokter-gigi-clinic'
);

DELETE FROM examinations WHERE clinicId IN (
  'demo-bidan-clinic',
  'demo-perawat-clinic',
  'demo-dokter-clinic',
  'demo-dokter-gigi-clinic'
);

DELETE FROM visits WHERE clinicId IN (
  'demo-bidan-clinic',
  'demo-perawat-clinic',
  'demo-dokter-clinic',
  'demo-dokter-gigi-clinic'
);

DELETE FROM medicines WHERE clinicId IN (
  'demo-bidan-clinic',
  'demo-perawat-clinic',
  'demo-dokter-clinic',
  'demo-dokter-gigi-clinic'
);

DELETE FROM patients WHERE clinicId IN (
  'demo-bidan-clinic',
  'demo-perawat-clinic',
  'demo-dokter-clinic',
  'demo-dokter-gigi-clinic'
);

DELETE FROM clinics WHERE id IN (
  'demo-bidan-clinic',
  'demo-perawat-clinic',
  'demo-dokter-clinic',
  'demo-dokter-gigi-clinic'
);

INSERT INTO clinics (id, name, email, password, phone, subscriptionPlan, status, isAdmin, clinicType, validUntil)
VALUES
  ('demo-bidan-clinic', 'Demo Bidan', 'demo.bidan@klinikmandiri.app', 'demo12345', '081200000101', 'DEMO', 'active', 0, 'Bidan', '2099-12-31 23:59:59'),
  ('demo-perawat-clinic', 'Demo Perawat', 'demo.perawat@klinikmandiri.app', 'demo12345', '081200000102', 'DEMO', 'active', 0, 'Perawat', '2099-12-31 23:59:59'),
  ('demo-dokter-clinic', 'Demo Dokter', 'demo.dokter@klinikmandiri.app', 'demo12345', '081200000103', 'DEMO', 'active', 0, 'Dokter', '2099-12-31 23:59:59'),
  ('demo-dokter-gigi-clinic', 'Demo Dokter Gigi', 'demo.drg@klinikmandiri.app', 'demo12345', '081200000104', 'DEMO', 'active', 0, 'Dokter Gigi', '2099-12-31 23:59:59');

INSERT INTO patients (id, clinicId, rm, name, namaSuami, gender, category, address, dob, ageYears, ageMonths, ageDisplay, poli, allergies, createdBy)
VALUES
  ('demo-bidan-p1', 'demo-bidan-clinic', 'RM-0001', 'Ny. Sinta Hapsari', 'Bpk. Arif', 'Perempuan', 'Nyonya', 'Jl. Melati No. 8', '1995-05-12', 29, 0, '29 Tahun', 'Pemeriksaan', 'Tidak ada', 'demo-bidan-clinic'),
  ('demo-bidan-p2', 'demo-bidan-clinic', 'RM-0002', 'Ny. Diah Lestari', 'Bpk. Roni', 'Perempuan', 'Nyonya', 'Jl. Kenanga No. 3', '1998-08-20', 26, 0, '26 Tahun', 'Pendaftaran', 'Seafood', 'demo-bidan-clinic'),
  ('demo-perawat-p1', 'demo-perawat-clinic', 'RM-0001', 'Tn. Bayu Pratama', NULL, 'Laki-laki', 'Tuan', 'Jl. Mawar No. 10', '1989-03-09', 35, 0, '35 Tahun', 'Pemeriksaan', 'Tidak ada', 'demo-perawat-clinic'),
  ('demo-perawat-p2', 'demo-perawat-clinic', 'RM-0002', 'Ny. Anita Puspita', NULL, 'Perempuan', 'Nyonya', 'Jl. Flamboyan No. 15', '1991-12-01', 33, 0, '33 Tahun', 'Pendaftaran', 'Debu', 'demo-perawat-clinic'),
  ('demo-dokter-p1', 'demo-dokter-clinic', 'RM-0001', 'Tn. Raka Mahendra', NULL, 'Laki-laki', 'Tuan', 'Jl. Cemara No. 21', '1986-02-14', 39, 0, '39 Tahun', 'Pemeriksaan', 'Penicillin', 'demo-dokter-clinic'),
  ('demo-dokter-p2', 'demo-dokter-clinic', 'RM-0002', 'An. Nabila Putri', NULL, 'Perempuan', 'Anak', 'Jl. Anggrek No. 6', '2016-09-07', 8, 0, '8 Tahun', 'Pendaftaran', 'Tidak ada', 'demo-dokter-clinic'),
  ('demo-drg-p1', 'demo-dokter-gigi-clinic', 'RM-0001', 'Tn. Aditya Saputra', NULL, 'Laki-laki', 'Tuan', 'Jl. Wijaya No. 2', '1992-01-11', 33, 0, '33 Tahun', 'Pemeriksaan', 'Tidak ada', 'demo-dokter-gigi-clinic'),
  ('demo-drg-p2', 'demo-dokter-gigi-clinic', 'RM-0002', 'Ny. Putri Maharani', NULL, 'Perempuan', 'Nyonya', 'Jl. Teratai No. 14', '1994-07-18', 30, 0, '30 Tahun', 'Pendaftaran', 'Tidak ada', 'demo-dokter-gigi-clinic');

INSERT INTO medicines (id, clinicId, name, unit, price, createdBy)
VALUES
  ('demo-bidan-m1', 'demo-bidan-clinic', 'Tablet Fe', 'Tablet', 1500, 'demo-bidan-clinic'),
  ('demo-bidan-m2', 'demo-bidan-clinic', 'Asam Folat', 'Tablet', 2000, 'demo-bidan-clinic'),
  ('demo-perawat-m1', 'demo-perawat-clinic', 'Paracetamol', 'Tablet', 1000, 'demo-perawat-clinic'),
  ('demo-perawat-m2', 'demo-perawat-clinic', 'Oralit', 'Sachet', 2500, 'demo-perawat-clinic'),
  ('demo-dokter-m1', 'demo-dokter-clinic', 'Amoxicillin', 'Kapsul', 3500, 'demo-dokter-clinic'),
  ('demo-dokter-m2', 'demo-dokter-clinic', 'Cetirizine', 'Tablet', 2000, 'demo-dokter-clinic'),
  ('demo-drg-m1', 'demo-dokter-gigi-clinic', 'Mefenamic Acid', 'Tablet', 2500, 'demo-dokter-gigi-clinic'),
  ('demo-drg-m2', 'demo-dokter-gigi-clinic', 'Chlorhexidine', 'Botol', 18000, 'demo-dokter-gigi-clinic');

INSERT INTO examinations (
  id, clinicId, patientId, patientName, patientRm, keluhanUtama, riwayatPenyakitSekarang,
  tensi, nadi, suhu, respirasi, bb, tb, spo2, pemeriksaanFisik, diagnosa, icd10,
  medicines_json, tindakan, edukasi, rencanaTindakLanjut, biaya, extendedData_json, createdBy, date
)
VALUES
  (
    'demo-bidan-e1', 'demo-bidan-clinic', 'demo-bidan-p1', 'Ny. Sinta Hapsari', 'RM-0001',
    'Kontrol kehamilan rutin trimester kedua', 'Gerak janin aktif, tidak ada perdarahan.',
    '110/70', 82, 36.7, 20, 58, 158, 99, 'Keadaan umum baik, tidak ada edema.',
    'Kehamilan normal trimester kedua', 'Z34.8',
    '[{"medicineId":"demo-bidan-m1","medicineName":"Tablet Fe","quantity":30,"unit":"Tablet"}]',
    'ANC rutin', 'Lanjut konsumsi tablet Fe dan istirahat cukup.', 'Kontrol 2 minggu lagi', 75000,
    '{"category":"Bumil","hamilKe":"1","usiaKehamilan":"24 minggu","hpht":"2025-10-10","hpl":"2026-07-17","statusTT":"TT2","lila":"26 cm","usg":"Sesuai usia kehamilan"}',
    'demo-bidan-clinic', datetime('now')
  ),
  (
    'demo-perawat-e1', 'demo-perawat-clinic', 'demo-perawat-p1', 'Tn. Bayu Pratama', 'RM-0001',
    'Batuk pilek sejak 3 hari', 'Demam ringan, nafsu makan menurun.',
    '120/80', 88, 37.5, 20, 67, 170, 98, 'Faring hiperemis ringan, ronchi negatif.',
    'ISPA ringan', 'J06.9',
    '[{"medicineId":"demo-perawat-m1","medicineName":"Paracetamol","quantity":10,"unit":"Tablet"}]',
    'Observasi dan terapi simptomatik', 'Perbanyak minum hangat dan istirahat.', 'Kontrol bila demam berlanjut', 50000,
    '{"category":"Umum"}',
    'demo-perawat-clinic', datetime('now')
  ),
  (
    'demo-dokter-e1', 'demo-dokter-clinic', 'demo-dokter-p1', 'Tn. Raka Mahendra', 'RM-0001',
    'Demam, batuk, dan pilek', 'Keluhan sejak 3 hari, tidak sesak.',
    '125/82', 86, 37.8, 19, 72, 172, 99, 'Faring hiperemis, paru vesikuler, abdomen tenang.',
    'Infeksi saluran napas atas akut', 'J06.9',
    '[{"medicineId":"demo-dokter-m2","medicineName":"Cetirizine","quantity":10,"unit":"Tablet"}]',
    'Pemeriksaan umum', 'Minum obat sesuai aturan dan istirahat cukup.', 'Kontrol 3 hari jika belum membaik', 85000,
    '{"category":"Umum"}',
    'demo-dokter-clinic', datetime('now')
  ),
  (
    'demo-drg-e1', 'demo-dokter-gigi-clinic', 'demo-drg-p1', 'Tn. Aditya Saputra', 'RM-0001',
    'Nyeri gigi kiri bawah saat mengunyah', 'Keluhan sejak 1 minggu, memberat sejak 2 hari terakhir.',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Gigi 36 nyeri tekan, gingiva sekitar hiperemis.',
    'Pulpitis irreversible gigi 36', 'K04.0',
    '[{"medicineId":"demo-drg-m1","medicineName":"Mefenamic Acid","quantity":10,"unit":"Tablet"}]',
    'Tambal sementara dan dressing', 'Hindari makanan terlalu keras dan kontrol sesuai jadwal.', 'Kontrol 5 hari untuk evaluasi endodontik', 150000,
    '{"category":"Odontologi","dentalVisitType":"Kontrol","dentalMedicalHistory":"Tidak ada penyakit sistemik","dentalTreatmentHistory":"Pernah tambal gigi 2 tahun lalu","dentalExtraOral":"Tidak ada pembengkakan wajah","dentalIntraOral":"Karies profunda regio 36","dentalOcclusion":"Normal","dentalOralHygiene":"Sedang","dentalGingiva":"Inflamasi lokal regio 36","dentalPlaqueIndex":"Sedang","dentalCalculus":"Ringan","dentalPalpation":"Negatif","dentalPercussion":"Positif pada 36","dentalMobility":"Tidak ada","dentalPocketDepth":"3 mm regio 36","dentalBleedingOnProbing":"Minimal","odontogram":[{"toothNumber":18,"status":"Normal","note":""},{"toothNumber":17,"status":"Normal","note":""},{"toothNumber":16,"status":"Normal","note":""},{"toothNumber":15,"status":"Normal","note":""},{"toothNumber":14,"status":"Normal","note":""},{"toothNumber":13,"status":"Normal","note":""},{"toothNumber":12,"status":"Normal","note":""},{"toothNumber":11,"status":"Normal","note":""},{"toothNumber":21,"status":"Normal","note":""},{"toothNumber":22,"status":"Normal","note":""},{"toothNumber":23,"status":"Normal","note":""},{"toothNumber":24,"status":"Normal","note":""},{"toothNumber":25,"status":"Normal","note":""},{"toothNumber":26,"status":"Normal","note":""},{"toothNumber":27,"status":"Normal","note":""},{"toothNumber":28,"status":"Missing","note":"Ekstraksi lama"},{"toothNumber":48,"status":"Normal","note":""},{"toothNumber":47,"status":"Normal","note":""},{"toothNumber":46,"status":"Normal","note":""},{"toothNumber":45,"status":"Normal","note":""},{"toothNumber":44,"status":"Normal","note":""},{"toothNumber":43,"status":"Normal","note":""},{"toothNumber":42,"status":"Normal","note":""},{"toothNumber":41,"status":"Normal","note":""},{"toothNumber":31,"status":"Normal","note":""},{"toothNumber":32,"status":"Normal","note":""},{"toothNumber":33,"status":"Normal","note":""},{"toothNumber":34,"status":"Normal","note":""},{"toothNumber":35,"status":"Normal","note":""},{"toothNumber":36,"status":"Karies","note":"Karies profunda"},{"toothNumber":37,"status":"Tambalan","note":"Tambalan baik"},{"toothNumber":38,"status":"Sisa Akar","note":"Perlu evaluasi ekstraksi"}]}',
    'demo-dokter-gigi-clinic', datetime('now')
  );
