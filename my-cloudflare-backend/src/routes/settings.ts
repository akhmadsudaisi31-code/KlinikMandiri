import { Hono } from 'hono'

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
        lastSickLeaveNumber = COALESCE(excluded.lastSickLeaveNumber, clinic_settings.lastSickLeaveNumber),
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

export default settings
