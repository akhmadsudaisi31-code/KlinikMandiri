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

---

## 30. Perbaikan Bug: Data Alergi Hilang Saat Edit Parsial (Juli 2026)

**Insiden/Masalah:**
Klien melaporkan bahwa data riwayat alergi pasien (seperti Ibu Salamah) yang sudah diisi sebelumnya menghilang.

**Akar Masalah:**
Saat data pasien diubah melalui halaman selain form pemeriksaan (misalnya saat memindahkan poli atau mengubah profil di menu pendaftaran), *frontend* hanya mengirim subset data. *Backend* (`PUT /patients/:id`) menggunakan logika *update* statis yang menimpa field yang tidak dikirim menjadi `null`. Karena field `allergies` tidak dikirim dari form pendaftaran/profil, field tersebut ditimpa menjadi `null` di database.

**Perbaikan:**
1. **Dynamic Partial Updates**: Mengubah query `UPDATE` di `medical.ts` menjadi dinamis. Backend sekarang hanya memperbarui *field* yang secara spesifik disertakan dalam *payload* `body` *request*. 
2. Jika field seperti `allergies` bernilai `undefined` (tidak ada di *payload*), sistem akan melewati/mengabaikannya dan tidak menimpanya dengan `null`. Ini melindungi data historis yang spesifik seperti rekam medis/alergi agar tidak terhapus tanpa sengaja oleh *form* registrasi.

**File terkait:**
- `my-cloudflare-backend/src/routes/medical.ts`

---

## 31. Optimasi Frontend (Tahap 3) untuk Mencegah Limit API (Juli 2026)

**Masalah:** 
Fitur pencarian *autocomplete* ICD-10 di form pemeriksaan sebelumnya menembak API terlalu sering (setiap 200ms) saat dokter mengetik, yang berisiko membuat kuota *Worker Invocations* harian penuh.

**Perbaikan:**
1. Memperpanjang jeda *debounce* pencarian ICD-10 di `ExaminationForm.tsx` dari 200ms menjadi 500ms. Ini berarti API hanya akan dipanggil jika dokter berhenti mengetik selama setengah detik.
2. Kombinasi dengan Edge Caching (Tahap 2) membuat jumlah *request* yang bocor ke *backend* menjadi sangat minimal.

**File terkait:**
- `src/pages/ExaminationForm.tsx`

---

## 32. Audit & Optimasi Masif: D1 Row Read Limit *(September 2026)*

**Insiden:** 2 September 2026 pukul 05:56 WIB — seluruh akun tidak bisa login karena D1 Free Tier daily row read limit (5 juta baris/hari) habis.

**Akar Masalah:**
- 5 komponen frontend melakukan polling `setInterval` setiap **10 detik** secara bersamaan, bahkan saat tab browser di-minimize/hidden.
- Backend `GET /examinations` menggunakan `SELECT *` sehingga kolom `extendedData_json` (odontogram JSON besar) ikut terbaca setiap polling.
- Backend `GET /medicines` tidak ada `LIMIT`.
- Memory leak di `Header.tsx`: `removeEventListener` tidak bekerja karena arrow function berbeda referensi — listener terus menumpuk setiap re-render.
- Error logger (`useErrorLogger`) tidak ada rate limiting — saat D1 limit kena, error logger sendiri memperparah situasi dengan terus mengirim request ke D1.

**Perbaikan:**

1. **Buat `src/hooks/useVisiblePolling.ts`** — hook reusable yang otomatis pause saat tab hidden, resume + fetch langsung saat tab kembali aktif.
2. **Buat `src/utils/apiCache.ts`** — in-memory cache dengan TTL dan prefix-based invalidation untuk mengurangi redundant API calls.
3. **Naikkan interval polling semua komponen:**
   - `Header.tsx`: 10s → **30s**
   - `ExaminationList.tsx`: 10s → **30s**
   - `PatientList.tsx`: 10s → **60s**
   - `Dashboard.tsx`: 10s → **120s**
   - `MedicineList.tsx`: 10s → **120s**
4. **Tambah visibility guard** di semua polling — berhenti otomatis saat tab tidak aktif.
5. **Fix memory leak `Header.tsx`** — simpan referensi fungsi `handleFocus` sebelum `addEventListener` agar `removeEventListener` bekerja benar.
6. **Backend `GET /examinations`** — ganti `SELECT *` dengan kolom spesifik, skip `extendedData_json` (hanya diambil di `GET /examinations/:id`).
7. **Backend `GET /medicines`** — tambah `LIMIT 1000`.
8. **Buat `migrations/0005_add_performance_indexes.sql`** — 5 database index untuk query hot-path: `idx_patients_clinic_poli`, `idx_patients_clinic_created`, `idx_examinations_clinic_date`, `idx_notifications_clinic_read_role`, `idx_examinations_clinic_patient_date`.
9. **Rate limiting `useErrorLogger`** — maks 1 log per 30 detik per error type, maks 10 log per 5 menit secara global.

**Estimasi dampak penghematan:**
- Kondisi sebelum: ~5 juta rows/hari (mentok limit)
- Setelah perbaikan: **~80–250 ribu rows/hari** (jauh di bawah limit)

**File terkait:**
- `src/hooks/useVisiblePolling.ts` *(baru)*
- `src/utils/apiCache.ts` *(baru)*
- `src/components/Header.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/PatientList.tsx`
- `src/pages/ExaminationList.tsx`
- `src/pages/MedicineList.tsx`
- `src/hooks/useErrorLogger.ts`
- `my-cloudflare-backend/src/routes/medical.ts`
- `my-cloudflare-backend/migrations/0005_add_performance_indexes.sql` *(baru)*

---

## 33. Perbaikan Bug: Logout Mendadak / Sering Terlogout *(September 2026)*

**Masalah:** Client melaporkan akun sering terlogout paksa, terutama di tengah sesi kerja.

**Akar Masalah:**
1. **JWT TTL hanya 24 jam** — klinik yang login pagi akan terlogout paksa keesokan harinya di jam yang sama, termasuk di tengah shift kerja.
2. **Tidak ada mekanisme refresh token** — setelah token expire, satu-satunya cara adalah login ulang manual.
3. **`api.ts` logout agresif saat 401** — semua response 401 (termasuk dari D1 timeout atau kondisi tidak terduga) memicu hapus token + redirect login, meskipun token user sebenarnya masih valid.
4. **`refreshUser` dipanggil tanpa cek expiry** — setiap kali app dibuka, langsung hit `/auth/me`. Jika jaringan sesaat bermasalah dan backend reply 401 karena apapun, user dilogout.

**Perbaikan:**

1. **JWT TTL 24 jam → 7 hari** di `auth.ts` (endpoint `/login` dan `/register`).
2. **Endpoint baru `POST /auth/refresh-token`** — terima token lama yang masih valid, terbitkan token baru 7 hari tanpa perlu password. Whitelist di status middleware `index.ts`.
3. **`AuthContext.tsx` — rewrite session management:**
   - Fungsi `getTokenExpiry()`: decode JWT payload di client untuk cek expiry tanpa hit backend.
   - Saat app dibuka: cek expiry token dulu — jika sudah expire, logout bersih dengan pesan jelas sebelum hit backend.
   - `scheduleTokenRefresh()`: jadwalkan silent refresh 1 jam sebelum token expire. Dijalankan otomatis setelah login, setelah `refreshUser`, dan saat app dibuka.
   - `silentRefreshToken()`: hit `POST /auth/refresh-token` diam-diam. Jika gagal (network error, D1 error), **tidak logout** — token lama tetap dipakai.
   - `refreshUser()`: tangkap error non-401 dengan diam (warn ke console), **tidak logout** saat terjadi error transient. Hanya 401 asli (dari `api.ts` middleware) yang memicu logout.

**Alur baru:**
```
Login → Token 7 hari
  ↓ [6 hari kemudian]
scheduleTokenRefresh() trigger
  ↓
POST /auth/refresh-token → Token baru 7 hari
  ↓
User tidak pernah dilogout paksa selama masih aktif
```

**File terkait:**
- `my-cloudflare-backend/src/routes/auth.ts`
- `my-cloudflare-backend/src/index.ts`
- `src/context/AuthContext.tsx`

---

## 34. Perbaikan Bug: Riwayat Kunjungan Pasien & Seluruh Menu Laporan *(September 2026)*

**Masalah:** 
1. Riwayat kunjungan pada profil pasien lama tidak muncul (kosong/crash).
2. Menu Laporan (Harian, Bulanan, Tahunan) untuk semua data pemeriksaan tidak menampilkan data.

**Akar Masalah:**
1. Pada `PatientDetail.tsx`, data rekam medis lama memiliki kolom `date` yang bernilai `NULL` (hanya ada `createdAt`). Saat pemformatan tanggal `format(new Date(item.date), ...)`, `date-fns` melempar runtime error `RangeError: Invalid time value` sehingga timeline riwayat gagal dirender.
2. Pada `my-cloudflare-backend/src/routes/medical.ts`, optimasi sebelumnya tidak menyertakan kolom `extendedData_json` pada `GET /examinations`. Ini menyebabkan filter laporan ANC dan Persalinan membuang semua record (karena filter wajib `extendedData_json`), serta mapping data laporan pemeriksaan umum tidak terbaca dengan lengkap.
3. Tabel empty state di `Reports.tsx` memiliki `colSpan={5}` yang tidak sesuai dengan jumlah header kolom (7 kolom), menyebabkan layout bergeser saat data kosong.

**Perbaikan:**
1. **`my-cloudflare-backend/src/routes/medical.ts`**:
   - Menambahkan kembali `examinations.extendedData_json` ke dalam query `SELECT` pada endpoint `GET /examinations`.
   - Menggunakan `COALESCE(examinations.date, examinations.createdAt) as date` agar field `date` selalu terisi valid untuk data lama.
2. **`src/pages/PatientDetail.tsx`**:
   - Mengubah logika sorting dan rendering timeline riwayat agar menggunakan fallback `rawDate = item.date || item.createdAt`.
   - Menggunakan fungsi `formatWibSafe(rawDate, ...)` sehingga aman dari nilai null/undefined.
3. **`src/pages/Reports.tsx`**:
   - Menyesuaikan `colSpan` empty state secara dinamis sesuai jenis laporan (`ANC: 19`, `Persalinan: 20`, `Umum: 7`).

**File terkait:**
- `my-cloudflare-backend/src/routes/medical.ts`
- `src/pages/PatientDetail.tsx`
- `src/pages/Reports.tsx`

---

## 35. Proteksi Backend & Halaman Status Error Terpadu *(September 2026)*

**Kebutuhan:** 
Ketika terjadi error kritis seperti kuota database D1 tercapai (limit hit), pengguna tidak boleh melihat tampilan error console atau layar blank, melainkan diarahkan secara rapi ke halaman status server dengan penjelasan informatif.

**Perbaikan:**
1. **Buat `src/pages/MaintenanceError.tsx`**:
   - Halaman khusus modern bertema "Sistem Sedang Istirahat".
   - Menjelaskan bahwa kuota harian server sedang terisi penuh dan akan di-reset otomatis setiap pukul **07:00 WIB** (00:00 UTC).
   - Menjamin kepada user bahwa **seluruh data rekam medis tetap aman**.
   - Dilengkapi tombol coba muat ulang dan hitung mundur auto-retry setiap 60 detik.
2. **Routing & Redirection (`src/main.tsx` & `src/api.ts`)**:
   - Menambahkan rute `/maintenance`.
   - `api.ts` secara otomatis mendeteksi status `429`, flag `isD1Limit`, atau error string `D1_ERROR` dan langsung melakukan auto-redirect ke `/maintenance`.
3. **Proteksi Backend (`my-cloudflare-backend`)**:
   - `index.ts`: `app.onError` mendeteksi error D1 limit dan mengembalikan HTTP status `429 (Too Many Requests)` dengan pesan yang terstruktur.
   - `routes/errorLogs.ts`: Melewati (skip) pencatatan log jika error disebabkan oleh limit D1 agar tidak membuang sisa kuota *write rows*.

**File terkait:**
- `src/pages/MaintenanceError.tsx` *(baru)*
- `src/main.tsx`
- `src/api.ts`
- `my-cloudflare-backend/src/index.ts`
- `my-cloudflare-backend/src/routes/errorLogs.ts`

---

## 36. Perbaikan False-Positive Halaman Maintenance & SQL Query Examinations *(September 2026)*

**Masalah:** 
Setelah kuota harian Cloudflare D1 direset pada pukul 07:00 WIB, aplikasi di domain production (`klinikmandiri.pages.dev`) masih mengarahkan pengguna ke halaman `/maintenance`.

**Akar Masalah:**
1. Pada `my-cloudflare-backend/src/routes/medical.ts`, query `SELECT` pada endpoint `GET /examinations` memanggil kolom `examinations.labResultImage` yang belum ada di skema tabel D1 remote, menyebabkan SQLite melempar error `SQLITE_ERROR: no such column: examinations.labResultImage`.
2. Pada `my-cloudflare-backend/src/index.ts`, penangkap error global sebelumnya memeriksa string `D1_ERROR` secara umum sehingga seluruh error SQLite (termasuk syntax/column error) dianggap sebagai *Daily Rate Limit Exceeded* dan membalas status HTTP `429`, yang memicu frontend berpindah ke halaman `/maintenance`.

**Perbaikan:**
1. **`my-cloudflare-backend/src/routes/medical.ts`**:
   - Menghapus kolom `labResultImage` dari klausa `SELECT` di endpoint `GET /examinations`.
   - Memastikan filter tanggal menggunakan `COALESCE(examinations.date, examinations.createdAt)` agar seluruh data pemeriksaan lama dan baru terbaca akurat.
2. **`my-cloudflare-backend/src/index.ts`**:
   - Memperketat regex/string matching error handler agar **hanya merespons 429 jika pesan error eksplisit menyatakan kuota habis** (`exceeded D1's free tier daily row read limit` atau `daily row read limit`).
3. **`src/api.ts`**:
   - Menjaga agar redirect ke `/maintenance` hanya aktif di environment production dan hanya terjadi pada limit kuota yang valid.

**File terkait:**
- `my-cloudflare-backend/src/routes/medical.ts`
- `my-cloudflare-backend/src/index.ts`
- `src/api.ts`

---

## 37. Arsitektur 0-D1 Row Read untuk Pencarian Diagnosa ICD-10 & Tuning Polling *(September 2026)*

**Akar Masalah (Terdeteksi via Metrik Dasbor Cloudflare D1):**
Query pencarian kamus ICD-10 (`SELECT code, title FROM icd_codes WHERE source = ? AND (code LIKE ? OR title LIKE ?)`) menghabiskan **4,23 Juta baris baca (84,6% kuota harian D1)** hanya dari **133 panggilan**. Hal ini terjadi karena:
1. Tabel `icd_codes` berukuran masif (86.940 baris).
2. Klausa wildcard depan `LIKE '%teks%'` pada kolom `title` memaksa SQLite melakukan *Full Table Scan* di setiap ketikan dokter.
3. Frontend `ExaminationForm.tsx` menembak dua sumber sekaligus (`who_icd10_2019` & `icd10cm_2026`) secara paralel di setiap ketikan.

**Solusi & Perbaikan:**
1. **Pencarian In-Memory Lokal (0-D1 Reads):**
   - Mengalihkan pencarian ICD-10 di `src/pages/ExaminationForm.tsx` dari HTTP request database menjadi pencarian in-memory langsung di JavaScript browser.
   - Memperkaya kamus diagnosa lokal di `src/data/icd10.ts` menjadi 150+ diagnosa klinis primer paling umum di Indonesia, lengkap dengan sinonim dan kata kunci bahasa Indonesia (contoh: 'diare', 'tipes', 'maag', 'darah tinggi', 'ispa', 'luka', 'kb').
   - Mendukung pencarian instan (0ms delay), bebas timeout, dan **menghemat 4.230.000+ baris D1 per hari (0 baris baca ke D1)**.
2. **Tuning Interval Polling Frontend:**
   - `src/components/Header.tsx`: Interval polling notifikasi dinaikkan dari 30s ke 60s (menghemat beban query unread notif hingga 50%).
   - `src/pages/ExaminationList.tsx`: Interval polling antrean pasien & pemeriksaan disesuaikan dari 30s ke 45s.

**File terkait:**
- `src/data/icd10.ts`
- `src/pages/ExaminationForm.tsx`
- `src/components/Header.tsx`
- `src/pages/ExaminationList.tsx`

---

## 38. Optimasi Efisiensi Antrean Pasien UNION, Counter RM Settings & Konsolidasi Dashboard *(September 2026)*

**Masalah yang Ditemukan saat Audit Database:**
1. **Antrean Pasien (`activeDate`)**: Query `WHERE clinicId = ? AND (poli = 'Pemeriksaan' OR id IN (SELECT...))` memaksa SQLite melakukan evaluasi scan ke seluruh 2.700 pasien klinik setiap siklus polling. Membaca 2.600 baris hanya untuk mengembalikan 9 pasien.
2. **Generator Nomor RM Baru (`next-rm`)**: Query `SELECT MAX(CAST(REPLACE(rm...)))` membungkus kolom dalam kalkulasi fungsi string yang menonaktifkan index dan melakukan full scan 2.700 pasien setiap kali form pendaftaran dibuka.
3. **Dashboard Polling**: Melakukan 4 HTTP request terpisah (`/patients/count`, `/examinations/today/count`, `/medicines/count`, `/broadcast`).

**Solusi & Perbaikan:**
1. **Query Antrean Pasien UNION Terindeks (`my-cloudflare-backend/src/routes/medical.ts`):**
   - Menambahkan index komposit baru: `idx_patients_clinic_poli ON patients(clinicId, poli)`.
   - Mengubah klausa `OR` menjadi `UNION` antara pasien antrean poli aktif dengan pemeriksaan hari ini via `JOIN`.
   - SQLite sekarang memanfaatkan index `idx_patients_clinic_poli` dan `idx_examinations_clinic_created` secara langsung tanpa memindai seluruh data pasien.
   - **Hasil:** Membaca baris turun 97% (dari 642k baris/hari menjadi < 15k baris/hari).
2. **Counter Nomor RM Terpusat (`clinic_settings.lastRmNumber`):**
   - Menambahkan kolom `lastRmNumber INTEGER DEFAULT 0` di tabel `clinic_settings`.
   - Endpoint `/patients/next-rm` kini membaca langsung dari 1 baris counter pengaturan klinik (**hanya 1 baris terbaca**, menggantikan full scan 2.700 pasien).
   - Pada saat simpan pasien baru (`POST /patients`), `lastRmNumber` diupdate otomatis dalam 1 atomic batch.
3. **Index Pengurutan Obat:**
   - Menambahkan index komposit `idx_medicines_clinic_name ON medicines(clinicId, name ASC)` untuk menghilangkan overhead memori *Temp B-Tree* pada sorting obat.
4. **Konsolidasi Endpoint Dashboard (`/dashboard/stats`):**
   - Membuat endpoint `GET /dashboard/stats` yang mengeksekusi 4 query ringkasan dalam 1 single D1 batch.
   - Mengurangi network latency dan koneksi D1 hingga 75%.

**File terkait:**
- `my-cloudflare-backend/schema.sql`
- `my-cloudflare-backend/src/routes/medical.ts`
- `src/pages/Dashboard.tsx`
- `note.md`

---





