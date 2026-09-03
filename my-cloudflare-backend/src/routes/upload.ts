import { Hono } from 'hono'


type Bindings = {
  DB: D1Database
  LAB_RESULTS: R2Bucket
}

const upload = new Hono<{ Bindings: Bindings }>()

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

// Upload Lab Result Image
upload.post('/lab-result', async (c) => {
    const payload: any = c.get('jwtPayload')
    const clinicId = payload.uid
    
    const body = await c.req.parseBody()
    const file = body['file'] as File
    
    if (!file) return c.json({ error: 'File tidak ditemukan' }, 400)

    // Validasi tipe MIME — cegah upload file berbahaya
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return c.json({ error: 'Tipe file tidak diizinkan. Gunakan JPG, PNG, WEBP, atau PDF.' }, 400)
    }

    // Validasi ukuran file — cegah resource exhaustion
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return c.json({ error: 'Ukuran file melebihi batas maksimal 5 MB.' }, 400)
    }

    // Gunakan ekstensi dari MIME type (bukan dari nama file yang bisa dimanipulasi)
    const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
        'image/gif': 'gif', 'application/pdf': 'pdf'
    }
    const safeExt = mimeToExt[file.type] || 'bin'
    const fileName = `${clinicId}/${crypto.randomUUID()}.${safeExt}`
    
    // Upload to R2
    await c.env.LAB_RESULTS.put(fileName, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type }
    })
    
    return c.json({ 
        success: true, 
        path: fileName
    })
})

// Get Lab Result Image (Proxy to R2) — JWT sudah divalidasi di middleware index.ts
upload.get('/lab-result/:path{.+}', async (c) => {
    const payload: any = c.get('jwtPayload')
    const clinicId = payload.uid
    const path = c.req.param('path')

    // Validasi kepemilikan: path harus diawali clinicId pemilik token
    // Format path: {clinicId}/{uuid}.{ext}
    const pathClinicId = path.split('/')[0]
    if (pathClinicId !== clinicId && payload.isAdmin !== 1) {
        return c.json({ error: 'Akses ditolak' }, 403)
    }

    const object = await c.env.LAB_RESULTS.get(path)
    
    if (!object) return c.json({ error: 'File tidak ditemukan' }, 404)
    
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    
    return c.body(object.body, 200, Object.fromEntries(headers))
})

export default upload
