const fs = require('fs');
const path = require('path');

// Gunakan better-sqlite3 jika ada, atau sqlite3 bawaan node jika versi baru
async function run() {
  console.log('Loading SQLite driver...');
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch (e) {
    console.log('better-sqlite3 not found, using pure node runner or installing temporary sqlite...');
  }

  const dbDir = path.join(__dirname, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.sqlite'));
  if (files.length === 0) {
    console.error('No .sqlite file found');
    return;
  }
  const sqliteFile = path.join(dbDir, files[0]);
  console.log('Target SQLite DB:', sqliteFile);

  if (Database) {
    const db = new Database(sqliteFile);
    console.log('Reading backup SQL file...');
    const sql = fs.readFileSync(path.join(__dirname, 'backup_klinik_db.sql'), 'utf-8');
    console.log('Executing SQL statements...');
    db.exec(sql);
    console.log('Done! Total clinics:', db.prepare('SELECT COUNT(*) as c FROM clinics').get());
    console.log('Total patients:', db.prepare('SELECT COUNT(*) as c FROM patients').get());
    console.log('Total examinations:', db.prepare('SELECT COUNT(*) as c FROM examinations').get());
  }
}

run().catch(console.error);
