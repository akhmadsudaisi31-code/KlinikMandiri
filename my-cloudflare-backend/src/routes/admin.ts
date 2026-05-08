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
    const { results } = await c.env.DB.prepare('SELECT id, name, email, phone, status, subscriptionPlan, clinicType, tier, validUntil, createdAt FROM clinics WHERE isAdmin = 0 ORDER BY createdAt DESC').all()
    return c.json(results)
})

admin.put('/clinics/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    // If validUntil is explicitly provided (manual edit), use it
    if (body.validUntil) {
        await c.env.DB.prepare('UPDATE clinics SET name = ?, email = ?, phone = ?, subscriptionPlan = ?, tier = ?, validUntil = ? WHERE id = ?')
        .bind(body.name, body.email, body.phone, body.subscriptionPlan, body.tier || 'STANDARD', body.validUntil, id).run()
    } else {
        // Fallback to automatic plan-based calculation if not provided
        const validUntilQuery = `validUntil = ${getValidUntilQuery(body.subscriptionPlan)}`
        await c.env.DB.prepare(`UPDATE clinics SET name = ?, email = ?, phone = ?, subscriptionPlan = ?, tier = ?, ${validUntilQuery} WHERE id = ?`)
        .bind(body.name, body.email, body.phone, body.subscriptionPlan, body.tier || 'STANDARD', id).run()
    }
    
    return c.json({ success: true })
})

admin.delete('/clinics/:id', async (c) => {
    const id = c.req.param('id')
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM examinations WHERE clinicId = ?').bind(id),
        c.env.DB.prepare('DELETE FROM visits WHERE clinicId = ?').bind(id),
        c.env.DB.prepare('DELETE FROM notifications WHERE clinicId = ?').bind(id),
        c.env.DB.prepare('DELETE FROM clinic_addons WHERE clinicId = ?').bind(id),
        c.env.DB.prepare('DELETE FROM clinic_settings WHERE clinicId = ?').bind(id),
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
        c.env.DB.prepare('DELETE FROM clinic_settings').bind(),
        c.env.DB.prepare('DELETE FROM notifications').bind(),
        c.env.DB.prepare('DELETE FROM examinations').bind(),
        c.env.DB.prepare('DELETE FROM visits').bind(),
        c.env.DB.prepare('DELETE FROM sks_records').bind(),
        c.env.DB.prepare('DELETE FROM patients').bind(),
        c.env.DB.prepare('DELETE FROM medicines').bind(),
        c.env.DB.prepare('DELETE FROM clinics WHERE isAdmin = 0').bind(),
        c.env.DB.prepare('DELETE FROM clinic_addons').bind()
    ])
    return c.json({ success: true, message: 'Semua data telah direset' })
})

/**
 * SaaS MANAGEMENT ENDPOINTS
 */

// Get all system plans
admin.get('/plans', async (c) => {
    const plans = await c.env.DB.prepare('SELECT * FROM system_plans ORDER BY price_yearly ASC').all();
    return c.json(plans.results);
});

// Update or create system plan
admin.post('/plans', async (c) => {
    const { id, name, features_json, price_monthly, price_yearly } = await c.req.json();
    await c.env.DB.prepare(
        'INSERT OR REPLACE INTO system_plans (id, name, features_json, price_monthly, price_yearly, updatedAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).bind(id, name, features_json, price_monthly, price_yearly).run();
    return c.json({ success: true });
});

// Delete system plan
admin.delete('/plans/:id', async (c) => {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM system_plans WHERE id = ?').bind(id).run();
    return c.json({ success: true });
});

// Get all system addons
admin.get('/addons', async (c) => {
    const addons = await c.env.DB.prepare('SELECT * FROM system_addons').all();
    return c.json(addons.results);
});

// Manage Clinic Addons
admin.get('/clinics/:id/addons', async (c) => {
    const id = c.req.param('id');
    const addons = await c.env.DB.prepare(
        'SELECT ca.*, sa.name, sa.feature_key FROM clinic_addons ca JOIN system_addons sa ON ca.addonId = sa.id WHERE ca.clinicId = ?'
    ).bind(id).all();
    return c.json(addons.results);
});

admin.post('/clinics/:id/addons', async (c) => {
    const clinicId = c.req.param('id');
    const { addonId, expiresAt } = await c.req.json();
    const id = crypto.randomUUID();
    await c.env.DB.prepare(
        'INSERT INTO clinic_addons (id, clinicId, addonId, expiresAt) VALUES (?, ?, ?, ?)'
    ).bind(id, clinicId, addonId, expiresAt).run();
    return c.json({ success: true });
});

admin.delete('/clinics/addons/:id', async (c) => {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM clinic_addons WHERE id = ?').bind(id).run();
    return c.json({ success: true });
});

// Super Admin Feature Toggles for specific clinic
admin.get('/clinics/:id/features', async (c) => {
    const id = c.req.param('id');
    const settings: any = await c.env.DB.prepare('SELECT enabledFeatures_json FROM clinic_settings WHERE clinicId = ?').bind(id).first();
    return c.json(JSON.parse(settings?.enabledFeatures_json || '{}'));
});

admin.put('/clinics/:id/features', async (c) => {
    const id = c.req.param('id');
    const features = await c.req.json();
    await c.env.DB.prepare('UPDATE clinic_settings SET enabledFeatures_json = ? WHERE clinicId = ?')
    .bind(JSON.stringify(features), id).run();
    return c.json({ success: true });
});

admin.post('/impersonate/:id', async (c) => {
    const id = c.req.param('id')
    const user: any = await c.env.DB.prepare('SELECT id, name, email, status, isAdmin, clinicType, tier, validUntil FROM clinics WHERE id = ?').bind(id).first()
    
    if (!user) return c.json({ error: 'Klinik tidak ditemukan' }, 404)
    
    const token = await sign({ 
        uid: user.id, 
        email: user.email, 
        status: user.status,
        isAdmin: user.isAdmin,
        tier: user.tier || 'STANDARD',
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
            tier: user.tier || 'STANDARD',
            validUntil: user.validUntil
        } 
    })
})

admin.get('/broadcasts', async (c) => {
    const { results } = await c.env.DB.prepare('SELECT * FROM broadcasts ORDER BY createdAt DESC').all()
    return c.json(results)
})

admin.delete('/broadcasts/:id', async (c) => {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM broadcasts WHERE id = ?').bind(id).run()
    return c.json({ success: true })
})

admin.post('/broadcast', async (c) => {
    const { message } = await c.req.json()
    if (!message) return c.json({ error: 'Message is required' }, 400)
    
    try {
        await c.env.DB.prepare('INSERT INTO broadcasts (id, message, createdAt) VALUES (?, ?, CURRENT_TIMESTAMP)')
        .bind(crypto.randomUUID(), message).run()
    } catch (e) {
        // Ensure table exists
        await c.env.DB.prepare('CREATE TABLE IF NOT EXISTS broadcasts (id TEXT PRIMARY KEY, message TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)').run()
        await c.env.DB.prepare('INSERT INTO broadcasts (id, message, createdAt) VALUES (?, ?, CURRENT_TIMESTAMP)')
        .bind(crypto.randomUUID(), message).run()
    }

    return c.json({ success: true })
})

export default admin
