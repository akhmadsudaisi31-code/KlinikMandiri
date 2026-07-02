# Catatan Perubahan

## Ringkasan Umum

Dokumen ini merangkum perubahan yang sudah diterapkan pada project `KlinikMandiri`, terutama untuk dukungan akun `Dokter Gigi`, alur pendaftaran pasien, form pelayanan gigi, tema visual, dan detail akun.

## 1. Dukungan Jenis Praktik Dokter Gigi

- Menambahkan `Dokter Gigi` sebagai opsi jenis praktik saat registrasi akun.
- Menyimpan `clinicType` dokter gigi ke alur login dan refresh session.
- Menambahkan helper pembacaan `clinicType` yang lebih toleran terhadap kapitalisasi dan spasi.
- Menambahkan tema visual khusus `Dokter Gigi` agar mudah dibedakan dari `Bidan`, `Perawat`, dan `Dokter`.

File terkait:

- `src/pages/Register.tsx`
- `src/context/AuthContext.tsx`
- `src/types.ts`
- `src/utils/clinic.ts`
- `src/index.css`

## 2. Tema Khusus Dokter Gigi

- Menambahkan kelas tema `theme-dokter-gigi`.
- Warna utama dokter gigi menggunakan nuansa mint/teal agar berbeda jelas dari tema lain.
- Tema diterapkan otomatis berdasarkan `clinicType` akun yang sedang login.

File terkait:

- `src/index.css`
- `src/context/AuthContext.tsx`
- `src/utils/clinic.ts`

## 3. Pendaftaran Pasien

- Mengubah label `Poli Tujuan` dari `Umum` menjadi `Pendaftaran`.
- Mengubah redirect setelah simpan pasien non-pemeriksaan ke `/pendaftaran` agar tidak lagi masuk ke halaman 404.
- Untuk akun dokter gigi, form pendaftaran menyesuaikan copy dan label poli menjadi `Poli Gigi`.
- Notifikasi antrian juga mengikuti istilah pelayanan gigi untuk akun dokter gigi.

File terkait:

- `src/pages/PatientForm.tsx`
- `src/pages/PatientList.tsx`
- `src/pages/PatientDetail.tsx`
- `src/pages/ExaminationList.tsx`
- `src/types.ts`
- `my-cloudflare-backend/schema.sql`

## 4. Form Pelayanan Gigi

- Menambahkan alur pelayanan khusus dokter gigi di halaman pemeriksaan.
- Menyembunyikan kategori pemeriksaan umum/lansia/bumil untuk akun dokter gigi.
- Menghapus field pemeriksaan umum yang tidak relevan untuk dokter gigi dari tampilan akun dokter gigi, seperti:
  - Tensi
  - Nadi
  - Suhu
  - Respirasi
  - Berat badan
  - Tinggi badan
  - SPO2
- Menyisakan field yang relevan untuk pelayanan gigi, seperti:
  - Jenis kunjungan
  - Keluhan utama
  - Riwayat penyakit sekarang
  - Riwayat alergi
  - Riwayat medis dental
  - Riwayat perawatan gigi
  - Pemeriksaan extraoral
  - Pemeriksaan intraoral
  - Oklusi
  - Kebersihan mulut
  - Gingiva/periodontal
  - Indeks plak
  - Kalkulus
  - BOP
  - Palpasi
  - Perkusi
  - Mobilitas gigi
  - Pocket depth
  - Odontogram
  - Diagnosa gigi
  - ICD-10
  - Tindakan dental
  - Resep obat/bahan
  - Aturan minum obat opsional per item resep
  - Instruksi pasca tindakan
  - Rencana kontrol/rujukan
  - Biaya

File terkait:

- `src/pages/ExaminationForm.tsx`
- `src/components/ExaminationDetailModal.tsx`
- `src/pages/PatientDetail.tsx`
- `src/types.ts`

## 5. Odontogram

- Menyederhanakan editor odontogram dewasa menjadi layout posisi gigi visual bergaya panoramic yang bisa diklik.
- Mendukung status gigi per nomor FDI.
- Edit dilakukan melalui satu panel pilihan status di bawah layout agar field tidak terlalu banyak.
- Tetap mendukung catatan singkat per gigi.
- Data odontogram disimpan ke `extendedData_json`.
- Data odontogram tampil kembali saat edit rekam medis.
- Ringkasan odontogram tampil di modal detail pemeriksaan.

File terkait:

- `src/components/OdontogramEditor.tsx`
- `src/utils/dental.ts`
- `src/pages/ExaminationForm.tsx`
- `src/components/ExaminationDetailModal.tsx`

## 6. ICD-10 Otomatis untuk Semua Kategori

- Menambahkan autocomplete ICD-10 untuk semua kategori akun: `Bidan`, `Perawat`, `Dokter`, dan `Dokter Gigi`.
- Pencarian bisa berdasarkan kode atau nama diagnosis.
- Jika user memilih saran ICD-10, kode akan diisi otomatis.
- Jika field diagnosa masih kosong, judul diagnosis dari ICD-10 akan ikut diisi otomatis.
- Menambahkan selector sumber ICD langsung di form pemeriksaan.
- Sumber yang tersedia:
  - `WHO ICD-10 2019`
  - `ICD-10-CM 2026`
- Data ICD tidak lagi mengandalkan subset lokal di frontend saja, tetapi memakai endpoint pencarian backend.

Catatan:

- Dataset resmi yang sudah diimpor ke D1:
  - `WHO ICD-10 2019`: `12.221` kode
  - `ICD-10-CM 2026`: `74.719` kode
- Endpoint backend baru:
  - `GET /api/icd/search`
- Referensi sumber resmi yang dipakai:
  - WHO download page: `https://icdcdn.who.int/icd10/index.html`
  - CDC ICD-10-CM 2026 files: `https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Publications/ICD10CM/2026/`

File terkait:

- `src/components/Icd10Autocomplete.tsx`
- `src/data/icd10.ts`
- `src/data/dentalIcd10.ts`
- `src/pages/ExaminationForm.tsx`
- `my-cloudflare-backend/src/index.ts`
- `my-cloudflare-backend/schema.sql`
- `scripts/build_icd_import.mjs`

## 7. Detail Akun di Header

- Informasi login di header sekarang bisa diklik.
- Menampilkan modal detail akun berisi:
  - Nama akun
  - Email
  - Jenis praktik
  - Status akun
  - Paket langganan
  - Role
- Modal ini memudahkan pengecekan apakah akun benar terbaca sebagai `Dokter Gigi`.

File terkait:

- `src/components/Header.tsx`

## 8. Penyesuaian Label dan UX

- Menghapus tulisan kecil `Odontogram` di kartu register `Dokter Gigi`.
- Mengubah istilah antrian dan label pemeriksaan untuk akun dokter gigi menjadi lebih sesuai.
- Menyesuaikan copy UI agar form dokter gigi tidak lagi terasa seperti form SOAP umum.

File terkait:

- `src/pages/Register.tsx`
- `src/pages/PatientForm.tsx`
- `src/pages/PatientList.tsx`
- `src/pages/PatientDetail.tsx`
- `src/pages/ExaminationList.tsx`
- `src/pages/ExaminationForm.tsx`

## 9. Akun Demo per Kategori

- Menambahkan halaman demo publik di route `/demo`.
- Menyediakan 4 akun demo aktif di database remote:
  - `Demo Bidan`
  - `Demo Perawat`
  - `Demo Dokter`
  - `Demo Dokter Gigi`
- Tombol `Masuk Demo` akan login ke akun demo yang sesuai melalui endpoint login backend.
- Setiap akun demo memakai `clinicId` yang berbeda sehingga hanya melihat data demo miliknya sendiri.
- Menambahkan data demo terpisah untuk pasien, obat, dan pemeriksaan pada tiap kategori demo.

Credential demo yang dipakai:

- `demo.bidan@klinikmandiri.app`
- `demo.perawat@klinikmandiri.app`
- `demo.dokter@klinikmandiri.app`
- `demo.drg@klinikmandiri.app`
- Password demo: `demo12345`

File terkait:

- `src/pages/DemoCatalog.tsx`
- `src/pages/Login.tsx`
- `src/main.tsx`
- `my-cloudflare-backend/schema.sql`
- `my-cloudflare-backend/src/index.ts`
- `.codex_tmp/demo_seed.sql`

## 10. API Base URL Frontend

- Mengubah fallback `API_BASE_URL` saat development agar tidak selalu bergantung ke `http://localhost:8787/api`.
- Jika `VITE_API_URL` tidak diisi saat frontend berjalan di localhost, frontend sekarang fallback ke API production.
- Tujuannya agar register/login/data tetap bisa dipakai walau worker lokal belum dijalankan.

File terkait:

- `src/api.ts`

## 11. Verifikasi

- Build frontend berhasil dijalankan beberapa kali dengan `npm run build`.
- Perubahan besar sudah lolos kompilasi.
- Worker backend berhasil dideploy ulang ke:
  - `https://my-cloudflare-backend.praktek-mandiri.workers.dev`
- Endpoint ICD live berhasil diverifikasi untuk:
  - `WHO ICD-10 2019`
  - `ICD-10-CM 2026`
- Akun demo remote berhasil diverifikasi ada dan aktif di D1.

## 12. Catatan Tambahan

- Karena project memakai PWA/service worker, browser bisa menampilkan bundle lama jika cache belum bersih.
- Jika perubahan belum terlihat:
  - lakukan hard refresh
  - atau clear site data/service worker
  - lalu login ulang dan cek `Detail Akun`

## 13. File Baru yang Ditambahkan

- `note.md`
- `src/utils/clinic.ts`
- `src/utils/dental.ts`
- `src/components/OdontogramEditor.tsx`
- `src/components/Icd10Autocomplete.tsx`
- `src/data/icd10.ts`
- `src/data/dentalIcd10.ts`
- `src/pages/DemoCatalog.tsx`
- `scripts/build_icd_import.mjs`
- `.codex_tmp/demo_seed.sql`

---

## 14. Sistem Multi-Akun & Sub-Akun (RBAC) *(Apr 2026)*

- Menambahkan tabel `clinic_users` di D1 untuk mengelola staf per klinik.
- Role yang tersedia: `OWNER`, `SUPER_ADMIN`, `DOKTER`, `APOTEKER`, `PENDAFTARAN`.
- Global Admin (NPA) bisa impersonate akun client dan tetap punya akses penuh.
- Endpoint `/auth/me` dan `/login` diperbarui untuk mendukung login staf dengan JWT impersonation.
- Komponen `StaffManagementSection.tsx` dibuat untuk mengelola daftar staf di halaman Settings.
- Header dan BottomNav menyesuaikan menu berdasarkan role pengguna.
- Bug: saat session refresh, `role` dan `subId` hilang → diperbaiki di `AuthContext.refreshUser`.

File terkait:
- `my-cloudflare-backend/schema.sql` (tabel `clinic_users`)
- `my-cloudflare-backend/src/routes/auth.ts`
- `src/context/AuthContext.tsx`
- `src/components/StaffManagementSection.tsx`
- `src/components/Header.tsx`
- `src/components/BottomNav.tsx`
- `src/pages/Settings.tsx`

---

## 15. Kolom Keluhan di Pendaftaran Pasien *(Apr 2026)*

- Menambahkan kolom `keluhan TEXT` di tabel `patients` (migration D1 lokal & remote).
- Form pendaftaran (`PatientForm.tsx`) kini memiliki field "Keluhan Utama (Opsional)".
- Saat Dokter membuka form pemeriksaan, field `keluhanUtama` (Subjective SOAP) otomatis terisi dari `keluhan` pasien jika ini adalah pemeriksaan baru.
- Setelah pemeriksaan disimpan (`POST /examinations`), kolom `keluhan` di tabel pasien di-set ke `NULL` otomatis untuk mencegah data basi di kunjungan berikutnya (*Clean Visit Cycle*).

File terkait:
- `my-cloudflare-backend/schema.sql`
- `my-cloudflare-backend/src/routes/medical.ts`
- `src/pages/PatientForm.tsx`
- `src/pages/ExaminationForm.tsx`

---

## 16. Perbaikan Bug: Idempotency Guard Pemeriksaan *(Apr 2026)*

**Insiden:** 15 April 2026 pukul 17:07–17:44 WIB, 1 akun dokter (traffic tertinggi) tidak bisa menyimpan pemeriksaan.

**Penyebab:** Sistem idempotency guard `POST /examinations` memblokir simpan ulang selama **1 JAM** penuh, sehingga dokter yang ingin mengkoreksi data dalam sesi kerja yang sama selalu mendapat error 409.

**Perbaikan:**
1. Window idempotency diperkecil: **1 jam → 3 menit** (cukup cegah double-click, tidak mengganggu koreksi).
2. Error 409 kini ditangkap sebagai `DuplicateExaminationError` di `api.ts`.
3. Frontend (`ExaminationForm.tsx`) menampilkan dialog konfirmasi jelas, bukan toast error generik.

File terkait:
- `my-cloudflare-backend/src/routes/medical.ts`
- `src/api.ts`
- `src/pages/ExaminationForm.tsx`

---

## 17. Perbaikan Bug: PUT /examinations Kolom `updatedAt` *(Apr 2026)*

**Error:** `D1_ERROR: no such column: updatedAt: SQLITE_ERROR` saat "Ubah Riwayat" pemeriksaan.

**Penyebab:** Query `UPDATE examinations SET ... updatedAt = ?` — kolom `updatedAt` tidak ada di tabel `examinations`.

**Perbaikan:** Menghapus `updatedAt` dari query UPDATE. Tidak perlu kolom tersebut karena audit trail sudah cukup dari `createdAt`.

File terkait:
- `my-cloudflare-backend/src/routes/medical.ts`

---

## 18. Rencana Integrasi Sentry (Error Monitoring) *(Apr 2026)*

Rencana integrasi Sentry Free Tier untuk memantau semua error yang terjadi di browser client secara otomatis. Detail lengkap lihat file:

📄 `sentry_integration_plan.md`

Ringkasan integrasi:
- Package: `@sentry/react`
- Init di: `src/main.tsx`
- Set user di: `src/context/AuthContext.tsx`
- Hanya aktif di production (`enabled: import.meta.env.PROD`)
- Data pasien tidak masuk Sentry (privacy-safe)

---

## 19. Perbaikan Bug: Waktu "Selesai" Menunjukkan Jam UTC bukan WIB *(Apr 2026)*

**Masalah:** Kolom WAKTU pada tab "Selesai" di halaman Pemeriksaan menampilkan jam UTC (misal: 12:34) padahal waktu sebenarnya adalah sekitar 19:34 WIB (UTC+7).

**Penyebab:** `ExaminationList.tsx` baris 407 menggunakan `format(new Date(latestExaminationAt[...]), 'HH:mm')` dari `date-fns` yang menggunakan timezone lokal browser. Karena D1 menyimpan timestamp dalam UTC ISO string, hasilnya salah jika browser tidak di-set ke WIB.

**Perbaikan:** Ganti dengan `formatWibSafe(latestExaminationAt[...], 'HH:mm')` dari `src/utils/date.ts` yang secara eksplisit mengonversi ke timezone `Asia/Jakarta`.

File terkait:
- `src/pages/ExaminationList.tsx` (baris 407)
- `src/utils/date.ts` (fungsi `formatWibSafe`)

---

## 20. Sistem Log Error Cloudflare D1 (Gratis Penuh) *(Apr 2026)*

Sebagai alternatif Sentry yang 100% gratis dan tidak ada batas waktu, dibangun sistem error logging berbasis Cloudflare D1 (database bawaan Cloudflare Workers).

**Keunggulan:**
- ✅ **Gratis selamanya** (tidak ada trial 14 hari)
- ✅ Data tersimpan di infrastruktur Cloudflare sendiri
- ✅ Tidak ada ketergantungan pihak ketiga

**Komponen yang Dibuat:**

| Komponen | File |
|----------|------|
| Tabel D1 | `error_logs` di database `klinik-db` (remote & local) |
| Backend route | `my-cloudflare-backend/src/routes/errorLogs.ts` |
| Registrasi route | `my-cloudflare-backend/src/index.ts` |
| Frontend hook | `src/hooks/useErrorLogger.ts` |
| Aktivasi global | `src/App.tsx` (`useErrorLogger()`) |

**Cara Kerja:**
1. Semua error JS yang tidak tertangani di browser ditangkap oleh `window.addEventListener('error', ...)` dan `unhandledrejection`.
2. Error dikirim ke `POST /api/errors` (tanpa perlu login) dengan info: klinik, user, URL, stack trace, browser.
3. Tersimpan di tabel `error_logs` di Cloudflare D1.
4. Super Admin bisa melihat log via `GET /api/errors` (perlu auth admin).
5. Log otomatis dibersihkan lewat `DELETE /api/errors` setelah 30 hari.

---

## 21. Multi-Criteria Patient Search (Pencarian Lanjut) *(Apr 2026)*

**Masalah:** User ingin melakukan pencarian pasien dengan kombinasi Nama, NIK, Alamat, dan Usia secara bersamaan (AND logic).

**Perbaikan:**
1. Mengganti `searchTerm` tunggal dengan objek `filters` yang mencakup: `name`, `nik`, `address`, dan `age`.
2. Memperbarui logika `filteredPatients` di `PatientList.tsx` agar melakukan pencocokan **AND** (semua kriteria yang diisi harus terpenuhi).
3. Mendesain ulang UI pencarian menjadi grid input yang responsif untuk keempat kriteria tersebut.
4. Menambahkan tombol "Hapus Filter" untuk mereset semua field input sekaligus.

- `src/pages/PatientList.tsx`

---

## 22. Perbaikan Bug: NIK Tidak Tersimpan *(Apr 2026)*

**Masalah:** Data NIK yang diinput di frontend tidak masuk ke database saat simpan atau ubah pasien.

**Penyebab:** Handler backend `POST /patients` dan `PUT /patients/:id` belum menyertakan kolom `nik` dalam query SQL (INSERT/UPDATE), sehingga data tersebut diabaikan oleh server.

**Perbaikan:** 
1. Memperbarui query `INSERT` pada `POST /patients` di `medical.ts` untuk menyertakan kolom `nik`.
2. Memperbarui query `UPDATE` pada `PUT /patients/:id` di `medical.ts` untuk menyertakan kolom `nik`.
3. Melakukan redeploy worker backend.

File terkait:
- `my-cloudflare-backend/src/routes/medical.ts`

---

## 23. Optimasi Notifikasi & Logging Error *(Apr 2026)*

**Masalah:** 
1. Toast (notifikasi) menumpuk jika terjadi banyak aksi atau navigasi cepat.
2. Error API (seperti 400 Bad Request saat daftar) tidak muncul di Error Logs Admin Panel.

**Perbaikan:**
1. **Deduplikasi Toast**: Memberikan ID unik pada setiap kategori toast (`exam-success`, `auth-status`, `reg-toast`). Ini memastikan pesan baru menggantikan yang lama, bukan menumpuk.
2. **Auto-Logging API**: Mengintegrasikan fungsi `reportError` langsung ke dalam wrapper `api.ts`. Setiap kali API mengembalikan status non-2xx (400, 500, dsb), error tersebut otomatis dikirim ke database `error_logs` di D1 (kecuali 401 Unauthorized).
3. **Penyelarasan Backend**: Memastikan endpoint `/api/errors` terbuka untuk POST (laporan error anonymous) namun tetap aman.

File terkait:
- `src/api.ts`
- `src/hooks/useErrorLogger.ts`
- `src/pages/ExaminationForm.tsx`
- `src/pages/Register.tsx`
- `src/context/AuthContext.tsx`
---

## 24. Pro Tier: Upload Gambar Hasil Lab *(Apr 2026)*

- **Infrastruktur**: Membuat R2 Bucket `klinik-lab-results` di Cloudflare untuk penyimpanan gambar persisten.
- **Backend**:
    - Membuat route `upload.ts` untuk menangani upload via Multipart Form-Data dan Proxying gambar dari R2.
    - Menambah kolom `labResultImage TEXT` pada tabel `examinations`.
    - Memperbarui `medical.ts` untuk menyimpan path gambar ke database.
- **Frontend**:
    - Implementasi `LabSection.tsx` sebagai area upload interaktif dengan loading state dan validasi file.
    - Integrasi `ExaminationDetailModal.tsx` untuk menampilkan foto hasil lab pada riwayat pemeriksaan (bisa diklik fullscreen).

File terkait:
- `my-cloudflare-backend/wrangler.jsonc`
- `my-cloudflare-backend/src/routes/upload.ts`
- `my-cloudflare-backend/src/routes/medical.ts`
- `src/components/ExaminationForm/LabSection.tsx`
- `src/components/ExaminationDetailModal.tsx`

---

## 25. Pro Tier: Statistik Bisnis Lanjutan *(Apr 2026)*

- **Backend**: Menambahkan endpoint `/api/stats/advanced` yang menghitung:
    - Tren pendapatan bulanan (6 bulan terakhir).
    - Top 5 Diagnosa (berdasarkan kode ICD-10).
    - Distribusi demografi pasien (Gender).
- **Frontend**: 
    - Membuat komponen `AdvancedStatsSection.tsx` menggunakan library `chart.js` dan `react-chartjs-2`.
    - Menampilkan statistik visual dalam bentuk grafik (Line, Bar, Pie) di Dashboard khusus untuk user Pro.

File terkait:
- `my-cloudflare-backend/src/routes/medical.ts`
- `src/components/AdvancedStatsSection.tsx`
- `src/pages/Dashboard.tsx`

---

## 26. Perbaikan Pendaftaran & Sistem QRIS Dinamis *(Apr 2026)*

- **Fix Registration**: Memperbaiki query `INSERT` pada `clinic_settings` yang sebelumnya error 400 karena ketidaksesuaian kolom `id` di backend vs database.
- **QRIS Dinamis (EMVCo)**: 
    - Membuat utility `qris.ts` untuk menghasilkan string QRIS standar EMVCo secara dinamis.
    - Sistem otomatis menyuntikkan nominal (Tag 54) ke dalam QRIS sesuai dengan paket & tier yang dipilih saat mendaftar.
    - Menghitung ulang CRC16-CCITT agar QR tetap valid dan bisa di-scan otomatis oleh aplikasi perbankan.
- **Update Info Pembayaran**: 
    - Bank BRI a/n **Akhmad Sudaisi**.
    - Merchant Name **ARZACHEL MAINTENANCE**.
    - Integrasi logo dan branding pada halaman `ActivationPending.tsx`.

File terkait:
- `my-cloudflare-backend/src/routes/auth.ts`
- `src/utils/qris.ts`
- `src/pages/ActivationPending.tsx`
- `src/pages/Register.tsx`
- `src/context/AuthContext.tsx`

---

## 27. Perbaikan Kritis Integritas Data & Sistem RM *(Juni 2026)*

**Insiden/Masalah:**
1. Pasien lama dengan nomor RM awal (seperti RM-0001 sampai RM-0100) tidak muncul dari hasil pencarian jika total pasien klinik melebihi 1000 karena adanya batasan `LIMIT 1000` pada query.
2. Terjadi duplikasi atau konflik nomor RM otomatis jika ada pasien lama yang dihapus, karena sistem menggunakan `COUNT(*)` untuk menentukan nomor RM berikutnya.
3. Penghapusan rekam medis di tab Laporan menyisakan pasien dengan status poli `Selesai` tanpa pemeriksaan terkait (*ghost patient*).

**Perbaikan:**
1. **Penghapusan Hard Limit & Paginasi**: Menghapus `LIMIT 1000` dari endpoint `GET /patients` dan mengimplementasikan pencarian server-side (`search`) serta opsi paginasi (`page` & `pageSize`) agar data pasien lama tidak terpotong.
2. **Auto RM Berbasis Nilai Maksimum**: Mengubah penentuan nomor RM baru dari `COUNT(*)` menjadi `MAX(rm)` numerik. Sistem kini mengambil nomor RM tertinggi yang pernah dibuat dan menambahkannya dengan 1. Ditambahkan pula safety-net loop untuk menjamin keunikan.
3. **Reset Status Poli**: Pada fungsi `handleDelete` di `Reports.tsx`, jika data pemeriksaan dihapus, status poli pasien otomatis dikembalikan ke `Pendaftaran` agar data tetap sinkron.
4. **Migrasi Database**: Menambahkan kolom `updatedAt` pada tabel `examinations` dan `visits` di database Cloudflare D1.

**File terkait:**
- `my-cloudflare-backend/src/routes/medical.ts`
- `my-cloudflare-backend/migrations/0004_add_updated_at_to_examinations_and_visits.sql`
- `src/pages/Reports.tsx`

---

## 28. Perbaikan Kasus Pasien Menghilang di Pencarian (Juli 2026)

**Insiden/Masalah:**
Pasien lama (contoh: Sumriyah, Ismiyatul) seolah menghilang dan tidak dapat ditemukan saat dicari di daftar pasien.

**Akar Masalah:**
Frontend `PatientList.tsx` mencoba memuat seluruh data pasien tanpa `page` atau `search` server-side, sehingga menabrak *limit payload* Cloudflare D1 saat volume data pasien sudah besar. Karena *backend* menggunakan `ORDER BY createdAt DESC`, sisa data (yakni pasien-pasien lama) terpotong dan tidak pernah sampai di *frontend*.

**Perbaikan:**
1. **Server-Side Search**: Meneruskan kata kunci nama (setelah dibersihkan dari gelar) langsung ke API melalui parameter `?search=nama`. Dengan begini, database langsung yang memfilter hasilnya sehingga respon dari *backend* sangat spesifik, terhindar dari *limit payload* atau *truncation*.
2. **Debounce Optimization**: Menambahkan jeda waktu (*debounce*) 400ms saat mengetik, guna mencegah *spam* kueri ke *server* dan menghemat *rows read* di D1.

**File terkait:**
- `src/pages/PatientList.tsx`

---

## 29. Optimasi Performa Polling & Resolusi D1 Timeout (Juli 2026)

**Insiden/Masalah:**
Sistem sering menampilkan pesan *error* `D1_ERROR: D1 DB storage operation exceeded timeout which caused object to be reset` di log aplikasi.

**Akar Masalah:**
Fitur *polling* otomatis di halaman `Dashboard.tsx` dan `ExaminationList.tsx` meminta *full table scan* (mengunduh seluruh tabel pasien, obat, dan antrean) ke *backend* setiap 10 detik dari tiap pengguna. Transmisi payload berukuran raksasa ini memaksa Cloudflare D1 melebihi ambang batas waktu (*timeout*) dan akhirnya me-reset *Durable Object*.

**Perbaikan:**
1. **Pembuatan API Statistik (Count)**: Menambah *endpoint* `/patients/count`, `/medicines/count`, dan `/examinations/today/count` di *backend* sehingga *dashboard* cukup menerima data angka statistik (ringan) dibanding array JSON dari seluruh tabel.
2. **Filter Antrean Aktif (activeDate)**: Mengubah pengambilan data pasien di daftar antrean agar mem-filter `poli = 'Pemeriksaan'` atau pasien dengan riwayat pemeriksaan *pada tanggal yang dipilih* via `activeDate`, menghilangkan kebutuhan transfer ribuan profil pasien yang tak relevan.

**File terkait:**
- `my-cloudflare-backend/src/routes/medical.ts`
- `src/pages/Dashboard.tsx`
- `src/pages/ExaminationList.tsx`
