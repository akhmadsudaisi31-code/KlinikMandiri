import { broadcastDataSync, inferSyncResources } from './utils/dataSync';
import toast from 'react-hot-toast';
import { reportError } from './hooks/useErrorLogger';

// Special error class for duplicate examination (HTTP 409)
export class DuplicateExaminationError extends Error {
  existingId: string;
  constructor(message: string, existingId: string) {
    super(message);
    this.name = 'DuplicateExaminationError';
    this.existingId = existingId;
  }
}

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
  // JANGAN set Content-Type jika mengirim FormData (biar browser yang set boundary-nya)
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            const now = Date.now();
            if (now - (lastErrorTimes['401'] || 0) > ERROR_QUIET_PERIOD) {
                lastErrorTimes['401'] = now;
                toast.error('Sesi habis atau tidak valid. Silakan login kembali.', { id: 'auth-error' });
            }
            if (!['/login', '/register', '/lupa-password'].includes(window.location.pathname)) {
                window.location.href = '/login';
            }
            throw new Error('Unauthorized');
        }

        let errorBody: any = {};
        let errorMsg = 'An error occurred';
        try {
          errorBody = await response.json();
          errorMsg = errorBody.error || errorBody.message || errorMsg;
        } catch (e) {
          errorMsg = response.statusText;
        }

        // REDIRECT KE HALAMAN MAINTENANCE JIKA D1 LIMIT TERCAPAI (Hanya aktif di Production)
        if (
          isProd && (
            errorBody.isD1Limit ||
            response.status === 429 ||
            errorMsg.includes("exceeded D1's free tier daily row read limit") ||
            errorMsg.includes("D1_ERROR")
          )
        ) {
          if (window.location.pathname !== '/maintenance') {
            sessionStorage.setItem('d1_limit_active', 'true');
            window.location.href = '/maintenance';
          }
          throw new Error(errorMsg);
        }

        // Handle duplicate examination (409) as a special typed error
        if (response.status === 409 && errorBody.code === 'DUPLICATE_EXAMINATION') {
          throw new DuplicateExaminationError(errorMsg, errorBody.existingId || '');
        }

        // report error to D1 logger (unless already handled or 401)
        if (response.status !== 401) {
            let metadata = null;
            if (options.body) {
                try {
                    const parsed = JSON.parse(options.body as string);
                    // Sanitize sensitive fields
                    const sanitized = { ...parsed };
                    ['password', 'oldPassword', 'newPassword', 'pin', 'token'].forEach(key => {
                        if (sanitized[key]) sanitized[key] = '********';
                    });
                    metadata = {
                        method: options.method || 'GET',
                        payload: sanitized,
                        status: response.status,
                        statusText: response.statusText
                    };
                } catch (e) {
                    metadata = { method: options.method || 'GET', status: response.status };
                }
            } else {
                metadata = { method: options.method || 'GET', status: response.status };
            }

            reportError(new Error(`API ${response.status}: ${errorMsg} (${endpoint})`), { metadata }).catch(() => {});
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
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  put: (endpoint: string, data: any) =>
    fetchAPI(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  delete: (endpoint: string, data?: any) =>
    fetchAPI(endpoint, {
      method: 'DELETE',
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    }),
};
