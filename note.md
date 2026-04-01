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
