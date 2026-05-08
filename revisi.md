TIKET REVISI SISTEM: KLINIK
Tanggal Revisi: 23 April 2026
Status: 🔴 Menunggu Pengerjaan (To Do)
Prioritas: Tinggi
🩺 1. MODUL PEMERIKSAAN MEDIS
Penyesuaian parameter pada form pemeriksaan medis/dokter, khususnya untuk penanganan spesifik mata.
[x] Pemeriksaan Penunjang: Tambahkan field input baru untuk mengukur tekanan bola mata:
TOD (Tension Oculi Dextra / Tekanan Mata Kanan)
TOS (Tension Oculi Sinistra / Tekanan Mata Kiri)
[x] Pemeriksaan Mata: Tambahkan blok atau form khusus untuk mendata hasil "Pemeriksaan Mata" secara keseluruhan di dalam halaman periksa.
💊 2. MODUL FARMASI / RESEP OBAT (E-RESEP)
Penyesuaian tabel input e-resep di halaman CPPT/Pelayanan sesuai screenshot acuan dari klien.
[x] Tabel Input Resep (Dropdown Signa & Aturan Pakai): Pada bagian input obat, pastikan kolom parameter berikut menggunakan format Dropdown (bukan sekadar ketik manual) yang berisi pilihan standar resep di Indonesia:
Kolom Signa: Buat dropdown pilihan frekuensi (Contoh: 1 x 1, 2 x 1, 3 x 1, 4 x 1, prn / jika perlu, dll).
Kolom Aturan Pakai: Buat dropdown instruksi pemakaian (Contoh: Sebelum makan (a.c), Sesudah makan (p.c), Saat makan (d.c), Teteskan pada mata kanan, Teteskan pada mata kiri, dll).
Catatan untuk Agent/Developer: > Referensi tata letak dapat melihat attachment screenshot dari UI E-Resep klien. Pastikan dropdown Signa dan Aturan Pakai mengambil referensi dari Master Data jika ada, atau hardcode pilihan standar nasional secara lengkap agar dokter tinggal pilih. Silakan centang [x] pada file ini jika task sudah diselesaikan.