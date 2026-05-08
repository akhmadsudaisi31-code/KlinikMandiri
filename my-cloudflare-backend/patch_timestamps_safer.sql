UPDATE examinations SET createdAt = replace(createdAt, ' ', 'T') || '.000Z' WHERE createdAt NOT LIKE '%Z' AND createdAt LIKE '% %';
UPDATE examinations SET date = replace(date, ' ', 'T') || '.000Z' WHERE date NOT LIKE '%Z' AND date LIKE '% %';
