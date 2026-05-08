UPDATE examinations SET createdAt = replace(createdAt, ' ', 'T') || '.000Z' WHERE createdAt NOT LIKE '%Z' AND createdAt LIKE '% %';
UPDATE examinations SET updatedAt = replace(updatedAt, ' ', 'T') || '.000Z' WHERE updatedAt NOT LIKE '%Z' AND updatedAt LIKE '% %';
UPDATE examinations SET date = replace(date, ' ', 'T') || '.000Z' WHERE date NOT LIKE '%Z' AND date LIKE '% %';

UPDATE visits SET date = replace(date, ' ', 'T') || '.000Z' WHERE date NOT LIKE '%Z' AND date LIKE '% %';
UPDATE visits SET createdAt = replace(createdAt, ' ', 'T') || '.000Z' WHERE createdAt NOT LIKE '%Z' AND createdAt LIKE '% %';
UPDATE visits SET updatedAt = replace(updatedAt, ' ', 'T') || '.000Z' WHERE updatedAt NOT LIKE '%Z' AND updatedAt LIKE '% %';

UPDATE patients SET createdAt = replace(createdAt, ' ', 'T') || '.000Z' WHERE createdAt NOT LIKE '%Z' AND createdAt LIKE '% %';
UPDATE patients SET updatedAt = replace(updatedAt, ' ', 'T') || '.000Z' WHERE updatedAt NOT LIKE '%Z' AND updatedAt LIKE '% %';
