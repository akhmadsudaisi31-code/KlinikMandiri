import { broadcastDataSync, inferSyncResources } from './utils/dataSync';
import toast from 'react-hot-toast';

const isProd = window.location.hostname === 'klinikmandiri.pages.dev' || 
               window.location.hostname === 'satset-rm.pages.dev';

const PROD_API_URL = 'https://my-cloudflare-backend.praktek-mandiri.workers.dev/api';
const DEV_API_URL = import.meta.env.VITE_API_URL || PROD_API_URL;

// Di production, JANGAN gunakan env var, paksa pakai PROD_API_URL
const API_BASE_URL = isProd ? PROD_API_URL : DEV_API_URL;

// Prevent toast spam
const lastErrorTimes: Record<string, number> = {};
const ERROR_QUIET_PERIOD = 5000; // 5 seconds

// Helper for standard fetch
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            // Token expired or invalid for this backend
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Limit toast for 401
            const now = Date.now();
            if (now - (lastErrorTimes['401'] || 0) > ERROR_QUIET_PERIOD) {
                lastErrorTimes['401'] = now;
                toast.error('Sesi habis atau tidak valid. Silakan login kembali.', { id: 'auth-error' });
            }
            
            // Redirect if not already on login/register pages
            if (!['/login', '/register', '/lupa-password'].includes(window.location.pathname)) {
                window.location.href = '/login';
            }
            throw new Error('Unauthorized');
        }

        let errorMsg = 'An error occurred';
        try {
          const errRes = await response.json();
          errorMsg = errRes.error || errRes.message || errorMsg;
        } catch (e) {
          errorMsg = response.statusText;
        }
        throw new Error(errorMsg);
    }

    if (response.status !== 204) {
        const result = await response.json();
        maybeBroadcastMutation(endpoint, options.method);
        return result;
    }

    maybeBroadcastMutation(endpoint, options.method);
    return null;
  } catch (error: any) {
     const now = Date.now();
     const errorKey = error.message || 'unknown-error';

     // Handle connection errors
     if (error instanceof TypeError && error.message === 'Failed to fetch') {
         if (now - (lastErrorTimes['network'] || 0) > ERROR_QUIET_PERIOD) {
             lastErrorTimes['network'] = now;
             toast.error('Gagal terhubung ke server. Pastikan backend (wrangler) berjalan.', {
                id: 'network-connection-error'
             });
         }
     } else if (error.message !== 'Unauthorized') {
         // Generic deduplication for other errors if needed
         if (now - (lastErrorTimes[errorKey] || 0) > ERROR_QUIET_PERIOD) {
             lastErrorTimes[errorKey] = now;
             // We don't necessarily want to toast every error here as components might handle them
             console.error("API Error:", error.message);
         }
     }
     
     throw error;
  }
}

function maybeBroadcastMutation(endpoint: string, method?: string) {
  const normalizedMethod = (method || 'GET').toUpperCase();
  if (normalizedMethod === 'GET') return;

  const resources = inferSyncResources(endpoint);
  if (resources.length === 0) return;

  broadcastDataSync({
    resources,
    endpoint,
    method: normalizedMethod,
    source: 'api',
  });
}

export const api = {
  get: (endpoint: string) => fetchAPI(endpoint),
  post: (endpoint: string, data: any) =>
    fetchAPI(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: (endpoint: string, data: any) =>
    fetchAPI(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (endpoint: string, data?: any) =>
    fetchAPI(endpoint, {
      method: 'DELETE',
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    }),
};
