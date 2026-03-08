# Panduan Setup Lupa Password (Password Reset)

Fitur "Lupa Password" menggunakan layanan autentikasi Firebase. Agar fitur ini berfungsi, Anda **tidak perlu mengubah kode**, tetapi perlu memastikan konfigurasi di Firebase Console sudah benar.

## Langkah-langkah Konfigurasi

1.  **Buka Firebase Console**
    - Akses [console.firebase.google.com](https://console.firebase.google.com/).
    - Pilih project Anda.

2.  **Masuk ke Menu Authentication**
    - Di sidebar kiri, klik **Build** -> **Authentication**.

3.  **Cek Templates (Template Email)**
    - Klik tab **Templates**.
    - Pilih jenis template **Password reset**.
    - Pastikan template ini aktif (biasanya aktif secara default).
    - Anda bisa mengedit "Sender name" (misal: "KlinikMandiri") atau isi emailnya agar terlihat lebih profesional.
    - **PENTING**: Jika Anda menggunakan domain kustom (bukan gmail/firebaseapp), pastikan domain tersebut sudah diverifikasi di Firebase. Namun untuk tahap testing/development, defaultnya sudah cukup.

4.  **Tes Fitur**
    - Jalankan aplikasi (`npm run dev`).
    - Masuk ke menu Login.
    - Klik link **"Lupa Password?"**.
    - Masukkan email Anda yang terdaftar.
    - Cek inbox (atau spam) email Anda.
    - Klik link di email untuk membuat password baru.

## Troubleshooting

- **Error: "Email tidak terdaftar"**
  Pastikan Anda memasukkan email yang benar-benar ada di daftar *Users* di Firebase Authentication.
  
- **Email tidak masuk (PENTING)**
  1.  **Cek Folder Spam**: Email dari server gratis sering masuk spam.
  2.  **Proteksi Email Enumeration**: Firebase memiliki fitur keamanan yang membuat aplikasi **terlihat sukses** mengirim email meskipun **email tersebut tidak terdaftar**. Ini untuk mencegah orang jahat menebak-nebak email user.
      - **Solusi**:  Pastikan email yang Anda masukkan **100% sama presisi** dengan yang ada di menu Authentication > Users.
  3.  **Quota**: Jika terlalu sering mencoba dalam waktu singkat, Firebase mungkin memblokir sementara. Tunggu beberapa saat.
