import { Hono } from 'hono'
import { hashPassword } from '../utils/password'

type Bindings = {
  DB: D1Database
}

const settings = new Hono<{ Bindings: Bindings }>()

const getClinicId = (c: any) => c.get('jwtPayload').uid

// Get clinic settings
settings.get('/settings', async (c) => {
  const clinicId = getClinicId(c)
  
  let result: any = await c.env.DB.prepare(
    'SELECT * FROM clinic_settings WHERE clinicId = ?'
  ).bind(clinicId).first()
  
  // If no settings exist, create default ones
  if (!result) {
    const defaultSettings = {
      clinicId,
      clinicName: '',
      doctorName: '',
      doctorNip: '',
      clinicAddress: '',
      clinicPhone: '',
      lastSickLeaveNumber: 0,
      sickLeaveTemplate: `Dengan ini menerangkan bahwa:
Nama: {{name}}
Umur: {{ageIndo}}
Pekerjaan: {{occupation}}
Alamat: {{address}}

Berdasarkan hasil pemeriksaan, yang bersangkutan dalam keadaan SAKIT, sehingga memerlukan istirahat selama {{days}} hari, terhitung dari tanggal {{startDate}} sampai dengan {{endDate}}.

Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.`,
      enabledFeatures_json: JSON.stringify({
        anc: true,
        kb: true,
        immunization: true,
        dental: true
      })
    }
    
    await c.env.DB.prepare(
      'INSERT OR IGNORE INTO clinic_settings (clinicId, clinicName, doctorName, doctorNip, clinicAddress, clinicPhone, lastSickLeaveNumber, sickLeaveTemplate, enabledFeatures_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      defaultSettings.clinicId,
      defaultSettings.clinicName,
      defaultSettings.doctorName,
      defaultSettings.doctorNip,
      defaultSettings.clinicAddress,
      defaultSettings.clinicPhone,
      defaultSettings.lastSickLeaveNumber,
      defaultSettings.sickLeaveTemplate,
      defaultSettings.enabledFeatures_json
    ).run()
    
    result = defaultSettings
  }
  
  // Parse JSON features
  if (result.enabledFeatures_json) {
    try {
      result.enabledFeatures = JSON.parse(result.enabledFeatures_json)
    } catch (e) {
      result.enabledFeatures = {}
    }
  }
  
  return c.json(result)
})

// Update clinic settings
settings.put('/settings', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()
  
  const enabledFeatures_json = body.enabledFeatures ? JSON.stringify(body.enabledFeatures) : body.enabledFeatures_json
  
  // Debug log (Optional, will show up in Cloudflare Logs)
  console.log(`Updating settings for clinic ${clinicId}:`, {
    clinicName: body.clinicName,
    doctorName: body.doctorName,
    clinicAddress: body.clinicAddress
  });

  try {
    await c.env.DB.prepare(
      `INSERT INTO clinic_settings (
        clinicId, clinicName, doctorName, doctorNip, 
        clinicAddress, clinicPhone, lastSickLeaveNumber, 
        sickLeaveTemplate, enabledFeatures_json, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(clinicId) DO UPDATE SET 
        clinicName = excluded.clinicName,
        doctorName = excluded.doctorName,
        doctorNip = excluded.doctorNip,
        clinicAddress = excluded.clinicAddress,
        clinicPhone = excluded.clinicPhone,
        lastSickLeaveNumber = excluded.lastSickLeaveNumber,
        sickLeaveTemplate = excluded.sickLeaveTemplate,
        enabledFeatures_json = excluded.enabledFeatures_json,
        updatedAt = CURRENT_TIMESTAMP`
    ).bind(
      clinicId,
      body.clinicName || '',
      body.doctorName || '',
      body.doctorNip || '',
      body.clinicAddress || '',
      body.clinicPhone || '',
      parseInt(body.lastSickLeaveNumber) || 0,
      body.sickLeaveTemplate || '',
      enabledFeatures_json
    ).run()
    
    return c.json({ success: true })
  } catch (err: any) {
    console.error("Database error saving settings:", err.message);
    return c.json({ success: false, error: err.message }, 500)
  }
})

// Atomic increment for sick leave number
settings.post('/settings/increment-sick-leave', async (c) => {
  const clinicId = getClinicId(c)
  
  const result: any = await c.env.DB.prepare(
    'UPDATE clinic_settings SET lastSickLeaveNumber = lastSickLeaveNumber + 1 WHERE clinicId = ? RETURNING lastSickLeaveNumber'
  ).bind(clinicId).first()
  
  if (!result) return c.json({ error: 'Settings not found' }, 404)
  
  return c.json({ nextNumber: result.lastSickLeaveNumber })
})

// Download Database Backup for Clinic
settings.get('/settings/backup', async (c) => {
  const clinicId = getClinicId(c)
  
  const patients = await c.env.DB.prepare('SELECT * FROM patients WHERE clinicId = ?').bind(clinicId).all()
  const examinations = await c.env.DB.prepare('SELECT * FROM examinations WHERE clinicId = ?').bind(clinicId).all()
  const medicines = await c.env.DB.prepare('SELECT * FROM medicines WHERE clinicId = ?').bind(clinicId).all()
  
  return c.json({
    timestamp: new Date().toISOString(),
    clinicId,
    data: {
      patients: patients.results,
      examinations: examinations.results,
      medicines: medicines.results
    }
  })
})

// Restore Database Backup for Clinic (Safe UPSERT)
settings.post('/settings/restore', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()
  
  if (!body.data) return c.json({ error: 'Format file backup tidak valid' }, 400)
  if (body.clinicId && body.clinicId !== clinicId) {
    return c.json({ error: 'File backup ini milik klinik lain dan tidak dapat direstore ke akun ini.' }, 400)
  }

  try {
    const stmts: D1PreparedStatement[] = [];

    // 1. Restore Medicines (Upsert)
    for (const m of (body.data.medicines || [])) {
      stmts.push(c.env.DB.prepare(`
        INSERT INTO medicines (id, clinicId, name, unit, price, createdBy) 
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET 
          name = excluded.name, unit = excluded.unit, price = excluded.price
      `).bind(m.id, clinicId, m.name, m.unit, m.price, m.createdBy))
    }

    // 2. Restore Patients (Upsert)
    for (const p of (body.data.patients || [])) {
      stmts.push(c.env.DB.prepare(`
        INSERT INTO patients (
          id, clinicId, rm, name, namaSuami, gender, category, address, occupation, 
          dob, ageYears, ageMonths, ageDisplay, poli, allergies, createdAt, updatedAt, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          rm = excluded.rm, name = excluded.name, namaSuami = excluded.namaSuami, gender = excluded.gender,
          category = excluded.category, address = excluded.address, occupation = excluded.occupation, dob = excluded.dob,
          ageYears = excluded.ageYears, ageMonths = excluded.ageMonths, ageDisplay = excluded.ageDisplay, poli = excluded.poli,
          allergies = excluded.allergies, updatedAt = excluded.updatedAt
      `).bind(
        p.id, clinicId, p.rm, p.name, p.namaSuami, p.gender, p.category, p.address, p.occupation,
        p.dob, p.ageYears, p.ageMonths, p.ageDisplay, p.poli, p.allergies, p.createdAt, p.updatedAt, p.createdBy
      ))
    }

    // 3. Restore Examinations (Upsert)
    for (const e of (body.data.examinations || [])) {
      stmts.push(c.env.DB.prepare(`
        INSERT INTO examinations (
          id, clinicId, patientId, patientName, patientRm, keluhanUtama, riwayatPenyakitSekarang,
          tensi, nadi, suhu, respirasi, bb, tb, spo2, pemeriksaanFisik, diagnosa, icd10,
          medicines_json, tindakan, edukasi, rencanaTindakLanjut, biaya, extendedData_json,
          date, createdAt, updatedAt, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          keluhanUtama = excluded.keluhanUtama, riwayatPenyakitSekarang = excluded.riwayatPenyakitSekarang,
          tensi = excluded.tensi, nadi = excluded.nadi, suhu = excluded.suhu, respirasi = excluded.respirasi,
          bb = excluded.bb, tb = excluded.tb, spo2 = excluded.spo2, pemeriksaanFisik = excluded.pemeriksaanFisik,
          diagnosa = excluded.diagnosa, icd10 = excluded.icd10, medicines_json = excluded.medicines_json,
          tindakan = excluded.tindakan, edukasi = excluded.edukasi, rencanaTindakLanjut = excluded.rencanaTindakLanjut,
          biaya = excluded.biaya, extendedData_json = excluded.extendedData_json, updatedAt = excluded.updatedAt
      `).bind(
        e.id, clinicId, e.patientId, e.patientName, e.patientRm, e.keluhanUtama, e.riwayatPenyakitSekarang,
        e.tensi, e.nadi, e.suhu, e.respirasi, e.bb, e.tb, e.spo2, e.pemeriksaanFisik, e.diagnosa, e.icd10,
        e.medicines_json, e.tindakan, e.edukasi, e.rencanaTindakLanjut, e.biaya, e.extendedData_json,
        e.date, e.createdAt, e.updatedAt, e.createdBy
      ))
    }

    // Execute in batches of 50 to avoid D1 limits
    for (let i = 0; i < stmts.length; i += 50) {
      const chunk = stmts.slice(i, i + 50);
      try {
        await c.env.DB.batch(chunk);
      } catch (chunkErr) {
        console.error("Batch insertion error: ", chunkErr);
        throw chunkErr;
      }
    }

    return c.json({ success: true, message: 'Restore berhasil dilakukan.' })
  } catch (e: any) {
    console.error("Safe restore error:", e);
    return c.json({ error: 'Gagal melakukan restore data. ' + e.message }, 500)
  }
})

// --- MANAJEMEN STAF (RBAC) ---
settings.get('/settings/staff', async (c) => {
    const clinicId = getClinicId(c);
    const result = await c.env.DB.prepare('SELECT id, name, email, role, createdAt FROM clinic_users WHERE clinicId = ? ORDER BY createdAt DESC').bind(clinicId).all();
    return c.json(result.results);
});

settings.post('/settings/staff', async (c) => {
    const payload: any = c.get('jwtPayload');
    if (payload.role && payload.role !== 'OWNER' && payload.role !== 'SUPER_ADMIN') {
        return c.json({ error: 'Hanya Admin/Pemilik klinik yang dapat mengelola staf' }, 403);
    }
    
    const clinicId = getClinicId(c);
    const body = await c.req.json();
    
    if (!body.email || !body.password || !body.name || !body.role) {
        return c.json({ error: 'Semua kolom wajib diisi' }, 400);
    }
    
    const id = crypto.randomUUID();
    try {
        const passHash = await hashPassword(body.password);
        await c.env.DB.prepare(
            'INSERT INTO clinic_users (id, clinicId, name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(id, clinicId, body.name, body.email, passHash, body.role).run();
        
        return c.json({ success: true, message: 'Staf berhasil ditambahkan' });
    } catch (e: any) {
        if (e.message && e.message.includes('UNIQUE constraint failed: clinic_users.email')) {
             return c.json({ error: 'Email ini sudah terdaftar sebagai staf' }, 400);
        }
        return c.json({ error: 'Gagal menambahkan staf' }, 500);
    }
});

settings.delete('/settings/staff/:id', async (c) => {
    const payload: any = c.get('jwtPayload');
    if (payload.role && payload.role !== 'OWNER' && payload.role !== 'SUPER_ADMIN') {
        return c.json({ error: 'Hanya Admin/Pemilik klinik yang dapat menghapus staf' }, 403);
    }
    
    const clinicId = getClinicId(c);
    const staffId = c.req.param('id');
    
    await c.env.DB.prepare('DELETE FROM clinic_users WHERE id = ? AND clinicId = ?').bind(staffId, clinicId).run();
    return c.json({ success: true });
});

export default settings
