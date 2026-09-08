-- Migration: Menambahkan kolom counter untuk optimasi kuota D1 (0-table-scan)
ALTER TABLE clinic_settings ADD COLUMN totalPatients INTEGER DEFAULT 0;
ALTER TABLE clinic_settings ADD COLUMN totalMedicines INTEGER DEFAULT 0;
