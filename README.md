Aplikasi Registrasi Pasien Klinik (React + Vite + Firebase)

Ini adalah proyek frontend lengkap untuk aplikasi registrasi pasien klinik, dibangun menggunakan React, Vite, TypeScript, Tailwind CSS, dan Firebase (Auth & Firestore).

Fitur Utama

Autentikasi Staf: Staf dapat login menggunakan email dan password.

CRUD Pasien: Tambah, Edit, dan Lihat data pasien.

Nomor RM Otomatis: Pembuatan nomor rekam medis (RM) unik secara otomatis saat mendaftar pasien baru (misal: 18070, 18071, ...).

Kalkulator Umur: Input umur fleksibel (tahun/bulan) atau berdasarkan tanggal lahir, dengan konversi otomatis.

Pencarian Cepat: Cari pasien berdasarkan Nama, No. RM, atau Alamat.

Paginasi Sederhana: Paginasi sisi klien untuk menangani daftar pasien yang panjang.

Desain Responsif: Tampilan optimal di perangkat mobile dan desktop.

Validasi Form: Validasi input data pasien untuk memastikan integritas data.

Tumpukan Teknologi

Frontend: React 18, Vite, TypeScriptv

Routing: React Router v6

Styling: Tailwind CSS

Manajemen Form: React Hook Form & Zod (untuk validasi skema)

Backend: Firebase (Authentication & Firestore)

Notifikasi: React Hot Toast

1. Pengaturan Firebase (Wajib)

Sebelum menjalankan proyek, Anda harus mengatur proyek Firebase Anda.

Langkah 1: Buat Proyek Firebase

Buka Firebase Console.

Klik "Add project" dan ikuti langkah-langkah untuk membuat proyek baru.

Langkah 2: Aktifkan Autentikasi (Authentication)

Di menu proyek Anda, pilih "Authentication".

Klik "Get started".

Di bawah "Sign-in method", pilih "Email/Password" dan aktifkan (Enable).

Langkah 3: Aktifkan Firestore (Database)

Di menu proyek, pilih "Firestore Database".

Klik "Create database".

Pilih Start in production mode. (PENTING: Aturan keamanan akan kita tambahkan nanti).

Pilih lokasi Cloud Firestore yang paling dekat dengan Anda (misal: asia-southeast2 untuk Jakarta).

Klik "Enable".

Langkah 4: Dapatkan Kunci Konfigurasi

Kembali ke halaman "Project Overview" di proyek Anda.

Klik ikon roda gigi (Settings) > "Project settings".

Di tab "General", scroll ke bawah ke "Your apps".

Klik ikon Web (</>).

Beri nama panggilan aplikasi (misal: "Aplikasi Klinik Web") dan klik "Register app".

Firebase akan menampilkan konfigurasi Anda (objek firebaseConfig). Salin nilai-nilai ini.

2. Instalasi Proyek Lokal

Langkah 1: Clone Proyek

git clone <URL_REPO_ANDA>
cd <NAMA_FOLDER_PROYEK>



Langkah 2: Instal Dependensi

npm install



Langkah 3: Atur Environment Variables

Buat file .env di root proyek Anda dengan menyalin dari contoh:

cp .env.example .env



Buka file .env dan isi dengan kunci konfigurasi Firebase yang Anda dapatkan di Langkah 4 sebelumnya.

VITE_FIREBASE_API_KEY="NILAI_ANDA"
VITE_FIREBASE_AUTH_DOMAIN="NILAI_ANDA"
VITE_FIREBASE_PROJECT_ID="NILAI_ANDA"
VITE_FIREBASE_STORAGE_BUCKET="NILAI_ANDA"
VITE_FIREBASE_MESSAGING_SENDER_ID="NILAI_ANDA"
VITE_FIREBASE_APP_ID="NILAI_ANDA"



Langkah 4: Jalankan Proyek

npm run dev



Aplikasi sekarang berjalan di http://localhost:5173 (atau port lain yang tersedia).

3. Konfigurasi Database (Wajib)

Langkah 1: Buat Akun Staf Pertama

Buka Firebase Console > Authentication > Users.

Klik "Add user".

Masukkan Email dan Password untuk akun staf (admin) pertama Anda.

Sekarang Anda dapat menggunakan email dan password ini untuk login ke aplikasi Anda.

Langkah 2: Atur Aturan Keamanan (Security Rules)

Data Anda saat ini terkunci (mode produksi). Kita perlu mengizinkan staf yang terautentikasi untuk membaca dan menulis data.

Buka Firebase Console > Firestore Database > Rules.

Ganti aturan default dengan aturan berikut:

// Salin konten dari file firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Hanya staf yang login yang bisa membaca, menulis, membuat, 
    // dan menghapus data pasien.
    match /patients/{patientId} {
      allow read, write, create, delete: if request.auth != null;
    }

    // Hanya staf yang login yang bisa membaca dan menulis
    // dokumen counter untuk Nomor RM.
    match /metadata/patientCounter {
      allow read, write: if request.auth != null;
    }
  }
}



Klik "Publish".

Langkah 3: (Opsional) Atur Indeks Firestore

Untuk memastikan query pencarian dan pengurutan (orderBy) berjalan cepat, kita perlu menambahkan indeks.

Buat file firestore.indexes.json (jika belum ada).

Salin konten di bawah ke file tersebut.

Gunakan Firebase CLI untuk mendeploy indeks ini (ini adalah cara yang disarankan untuk proyek besar):

# (Perlu instalasi firebase-tools: npm install -g firebase-tools)
firebase use <PROJECT_ID_ANDA>
firebase firestore:indexes:create firestore.indexes.json



Konten untuk firestore.indexes.json ada di file terpisah.

Cara Reset Nomor RM

Jika Anda ingin mengulang hitungan Nomor RM (misalnya kembali ke 18070):

Buka Firebase Console > Firestore Database > Data.

Hapus koleksi metadata.

Atau, hapus dokumen patientCounter di dalam koleksi metadata.

Pendaftaran pasien berikutnya akan otomatis membuat ulang dokumen tersebut dan memulai dari 18070.

4. Deploy ke Netlify (Gratis)

Push ke Repositori Git: Pastikan proyek Anda sudah ada di GitHub, GitLab, atau Bitbucket.

Daftar/Login ke Netlify: Buka Netlify.

Import Proyek:

Dari dashboard Netlify, klik "Add new site" > "Import an existing project".

Hubungkan ke penyedia Git Anda (GitHub).

Pilih repositori proyek Anda.

Atur Pengaturan Build:

Netlify biasanya otomatis mendeteksi Vite.

Pastikan pengaturannya benar:

Build command: npm run build

Publish directory: dist

Tambahkan Environment Variables (PENTING):

Sebelum men-deploy, buka "Site settings" > "Build & deploy" > "Environment".

Klik "Edit variables".

Tambahkan SEMUA variabel VITE_FIREBASE_* yang ada di file .env Anda, satu per satu.

Deploy Situs:

Kembali ke tab "Deploys" dan picu (trigger) deploy.

Tunggu beberapa menit hingga proses build selesai.

Netlify akan memberi Anda URL publik (misal: nama-unik-anda.netlify.app).