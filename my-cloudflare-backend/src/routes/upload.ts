import { Hono } from 'hono'


type Bindings = {
  DB: D1Database
  LAB_RESULTS: R2Bucket
}

const upload = new Hono<{ Bindings: Bindings }>()

// Upload Lab Result Image
upload.post('/lab-result', async (c) => {
    const payload: any = c.get('jwtPayload')
    const clinicId = payload.uid
    
    // Check if user has Pro tier or lab_upload feature enabled
    // (Feature check is done globally in index.ts, but we can double check here)
    
    const body = await c.req.parseBody()
    const file = body['file'] as File
    
    if (!file) return c.json({ error: 'No file uploaded' }, 400)
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${clinicId}/${crypto.randomUUID()}.${fileExt}`
    
    // Upload to R2
    await c.env.LAB_RESULTS.put(fileName, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type }
    })
    
    // We don't store the URL in DB yet, we just return the fileName/path
    // The client will use this to reference the image in the examination record
    
    return c.json({ 
        success: true, 
        path: fileName,
        url: `https://pub-your-r2-id.r2.dev/${fileName}` // TODO: Set up R2 Custom Domain or use worker proxy
    })
})

// Get Lab Result Image (Proxy to R2)
upload.get('/lab-result/:path{.+}', async (c) => {
    const path = c.req.param('path')
    const object = await c.env.LAB_RESULTS.get(path)
    
    if (!object) return c.json({ error: 'Image not found' }, 404)
    
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    
    return c.body(object.body, 200, Object.fromEntries(headers))
})

export default upload
