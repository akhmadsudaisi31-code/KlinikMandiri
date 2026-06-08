ALTER TABLE examinations ADD COLUMN updatedAt DATETIME;
ALTER TABLE visits ADD COLUMN updatedAt DATETIME;
UPDATE examinations SET updatedAt = datetime('now') WHERE updatedAt IS NULL;
UPDATE visits SET updatedAt = datetime('now') WHERE updatedAt IS NULL;
