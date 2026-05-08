# AI Development Guidelines - Klinik Mandiri

Untuk menjaga stabilitas aplikasi, setiap Agent AI (termasuk saya) WAJIB mematuhi aturan berikut:

1. **Prinsip Perubahan Minimal (Least Change):**
   - Hanya ubah bagian kode yang diminta secara spesifik oleh User.
   - Dilarang melakukan refactoring massal atau mengubah gaya penulisan kode (coding style) di file yang tidak terkait.

2. **Integritas Database (D1 Schema):**
   - Dilarang menambahkan kolom baru ke dalam query `SELECT`, `INSERT`, atau `UPDATE` jika kolom tersebut belum ada di `schema.sql`.
   - Jika fitur baru memerlukan kolom baru, Agent WAJIB memberitahu User untuk melakukan migrasi database terlebih dahulu sebelum mengubah kode aplikasi.

3. **Konsistensi Extended Data:**
   - Gunakan kolom `extendedData_json` untuk menyimpan data-data tambahan yang sifatnya dinamis (seperti foto lab, data spesialis, dll) guna menghindari perubahan skema database yang berisiko.

4. **Komentar & Dokumentasi:**
   - Jangan menghapus komentar yang sudah ada di dalam kode.
   - Jika melakukan perubahan krusial, berikan komentar singkat pada bagian yang diubah.

5. **Verifikasi Jalur API:**
   - Selalu pastikan URL API (seperti `/api/...`) konsisten dan tidak terjadi duplikasi jalur (misal: `/api/api/...`).
