/**
 * Utility for password hashing and verification using PBKDF2 with SHA-256.
 * Designed for Cloudflare Workers.
 */

export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passBuffer = new TextEncoder().encode(password);
    
    const keyKey = await crypto.subtle.importKey(
        'raw', 
        passBuffer, 
        { name: 'PBKDF2' }, 
        false, 
        ['deriveBits', 'deriveKey']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyKey,
        256
    );
    
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const saltArray = Array.from(salt);
    
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHex = saltArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Store as salt:hash
    return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const parts = storedHash.split(':');
    
    // Fallback for existing plain-text passwords in production
    if (parts.length !== 2) {
        console.warn('Using plain-text password fallback for user.');
        return password === storedHash;
    }
    
    const saltHex = parts[0];
    const originalHashHex = parts[1];
    
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const passBuffer = new TextEncoder().encode(password);
    
    const keyKey = await crypto.subtle.importKey(
        'raw', 
        passBuffer, 
        { name: 'PBKDF2' }, 
        false, 
        ['deriveBits', 'deriveKey']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyKey,
        256
    );
    
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex === originalHashHex;
}
