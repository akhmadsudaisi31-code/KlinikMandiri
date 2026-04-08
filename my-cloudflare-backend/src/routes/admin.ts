import { Hono } from 'hono'
import { sign } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  RESEND_API_KEY: string
}

const admin = new Hono<{ Bindings: Bindings }>()

const getValidUntilQuery = (subscriptionPlan?: string): string => {
  if (subscriptionPlan === 'MONTHLY') return "datetime('now', '+1 month')";
  if (subscriptionPlan === '2YEARS') return "datetime('now', '+2 years')";
  if (subscriptionPlan === 'LIFETIME') return "datetime('now', '+100 years')";
  return "datetime('now', '+1 year')";
}

async function sendEmail(env: Bindings, to: string, subject: string, html: string) {
  if (!env.RESEND_API_KEY) {
     console.log("Email mocked (No RESEND_API_KEY):", to, subject);
     return;
  }
  
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Admin KlinikMandiri <onboarding@resend.dev>',
        to,
        subject,
        html
      })
    });
    const result: any = await res.json();
    if (res.ok) {
        console.log("Email sent successfully:", result.id);
    } else {
        console.error("Email send failed with Resend API Error:", result);
    }
  } catch(e) {
    console.error("Email send network/parsing error:", e);
  }
}

const getEmailTemplate = (type: 'success' | 'rejected', clinicName: string): string => {
  const isSuccess = type === 'success';
  const color = isSuccess ? '#0ea5e9' : '#f43f5e';
  const title = isSuccess ? 'Aktivasi Akun Berhasil 🎉' : 'Aktivasi Akun Ditolak ⚠️';
  const body = isSuccess 
    ? `Selamat! Akun klinik <b>${clinicName}</b> telah berhasil diaktifkan. Anda sekarang dapat masuk (login) dan menikmati seluruh fitur unggulan aplikasi KlinikMandiri.`
    : `Mohon maaf, aktivasi akun klinik <b>${clinicName}</b> saat ini tidak dapat kami setujui. Hal ini mungkin terjadi jika Anda belum mentransfer nominal yang sesuai atau bukti pembayaran tidak valid.`;
  
  const ctaText = isSuccess ? 'Masuk ke Dashboard' : 'Hubungi Dukungan CS (WA)';
  const ctaLink = isSuccess ? 'https://satset-rm.pages.dev/login' : 'https://wa.me/6281234567890';

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <tr><td align="center" style="padding: 40px 20px; background-color: ${color};"><h1 style="color: #ffffff; margin: 0;">KlinikMandiri</h1></td></tr>
                <tr><td style="padding: 40px 30px;"><h2>${title}</h2><p>${body}</p><a href="${ctaLink}" style="display: inline-block; padding: 14px 28px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 8px;">${ctaText}</a></td></tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// Middleware: Admin Only
admin.use('*', async (c, next) => {
    const payload: any = c.get('jwtPayload')
    if (payload?.isAdmin !== 1) return c.json({ error: 'Unauthorized' }, 403)
    return next()
})

admin.get('/clinics', async (c) => {
    const { results } = await c.env.DB.prepare('SELECT id, name, email, phone, status, subscriptionPlan, clinicType, validUntil, createdAt FROM clinics WHERE isAdmin = 0 ORDER BY createdAt DESC').all()
    return c.json(results)
})

admin.put('/clinics/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validUntilQuery = `validUntil = ${getValidUntilQuery(body.subscriptionPlan)}`
    await c.env.DB.prepare(`UPDATE clinics SET name = ?, email = ?, phone = ?, subscriptionPlan = ?, ${validUntilQuery} WHERE id = ?`)
    .bind(body.name, body.email, body.phone, body.subscriptionPlan, id).run()
    return c.json({ success: true })
})

admin.delete('/clinics/:id', async (c) => {
    const id = c.req.param('id')
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM examinations WHERE clinicId = ?').bind(id),
        c.env.DB.prepare('DELETE FROM visits WHERE clinicId = ?').bind(id),
        c.env.DB.prepare('DELETE FROM notifications WHERE clinicId = ?').bind(id),
        c.env.DB.prepare('DELETE FROM patients WHERE clinicId = ?').bind(id),
        c.env.DB.prepare('DELETE FROM medicines WHERE clinicId = ?').bind(id),
        c.env.DB.prepare('DELETE FROM clinics WHERE id = ?').bind(id)
    ])
    return c.json({ success: true })
})

admin.put('/clinics/:id/activate', async (c) => {
    const id = c.req.param('id')
    const clinic: any = await c.env.DB.prepare('SELECT email, name, subscriptionPlan FROM clinics WHERE id = ?').bind(id).first()
    if (!clinic) return c.json({ error: 'Klinik tidak ditemukan' }, 404)
    const validUntilQuery = getValidUntilQuery(clinic.subscriptionPlan)
    await c.env.DB.prepare(`UPDATE clinics SET status = "active", validUntil = ${validUntilQuery} WHERE id = ?`).bind(id).run()
    await sendEmail(c.env, clinic.email, 'Aktivasi Akun KlinikMandiri Berhasil', getEmailTemplate('success', clinic.name));
    return c.json({ success: true })
})

admin.put('/clinics/:id/reject', async (c) => {
    const id = c.req.param('id')
    const clinic: any = await c.env.DB.prepare('SELECT email, name FROM clinics WHERE id = ?').bind(id).first()
    if (!clinic) return c.json({ error: 'Klinik tidak ditemukan' }, 404)
    await c.env.DB.prepare('UPDATE clinics SET status = "rejected" WHERE id = ?').bind(id).run()
    await sendEmail(c.env, clinic.email, 'Informasi Aktivasi Akun KlinikMandiri', getEmailTemplate('rejected', clinic.name));
    return c.json({ success: true })
})

admin.get('/clinics/:id/activity', async (c) => {
    const id = c.req.param('id')
    const clinic: any = await c.env.DB.prepare('SELECT lastLoginAt FROM clinics WHERE id = ?').bind(id).first()
    if (!clinic) return c.json({ error: 'Klinik tidak ditemukan' }, 404)
    const patientsCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM patients WHERE clinicId = ?').bind(id).first()
    const medicinesCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM medicines WHERE clinicId = ?').bind(id).first()
    const examsCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM examinations WHERE clinicId = ?').bind(id).first()
    return c.json({
        lastLoginAt: clinic.lastLoginAt,
        totalPatients: (patientsCount as any)?.c || 0,
        totalMedicines: (medicinesCount as any)?.c || 0,
        totalExaminations: (examsCount as any)?.c || 0
    })
})

admin.delete('/system/reset', async (c) => {
    const body: any = await c.req.json().catch(() => ({}))
    if (body.confirmation !== 'RESET') return c.json({ error: 'Konfirmasi tidak valid' }, 400)
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM examinations').bind(),
        c.env.DB.prepare('DELETE FROM visits').bind(),
        c.env.DB.prepare('DELETE FROM notifications').bind(),
        c.env.DB.prepare('DELETE FROM patients').bind(),
        c.env.DB.prepare('DELETE FROM medicines').bind(),
        c.env.DB.prepare('DELETE FROM clinics WHERE isAdmin = 0').bind()
    ])
    return c.json({ success: true, message: 'Semua data telah direset' })
})

admin.post('/impersonate/:id', async (c) => {
    const id = c.req.param('id')
    const user: any = await c.env.DB.prepare('SELECT id, name, email, status, isAdmin, clinicType, validUntil FROM clinics WHERE id = ?').bind(id).first()
    
    if (!user) return c.json({ error: 'Klinik tidak ditemukan' }, 404)
    
    const token = await sign({ 
        uid: user.id, 
        email: user.email, 
        status: user.status,
        isAdmin: user.isAdmin,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
    }, c.env.JWT_SECRET)

    return c.json({ 
        token, 
        user: { 
            uid: user.id, 
            email: user.email, 
            displayName: user.name,
            status: user.status,
            isAdmin: user.isAdmin,
            clinicType: user.clinicType,
            validUntil: user.validUntil
        } 
    })
})

export default admin
