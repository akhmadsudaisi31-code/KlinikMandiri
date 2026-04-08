ALTER TABLE patients ADD COLUMN occupation TEXT;
ALTER TABLE clinic_settings ADD COLUMN clinicAddress TEXT;
ALTER TABLE clinic_settings ADD COLUMN clinicPhone TEXT;
ALTER TABLE clinic_settings ADD COLUMN lastSickLeaveNumber INTEGER DEFAULT 0;
