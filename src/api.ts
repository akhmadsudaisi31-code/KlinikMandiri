const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

// Helper for standard fetch
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errRes = await response.json();
      errorMsg = errRes.message || errorMsg;
    } catch (e) {
      errorMsg = response.statusText;
    }
    throw new Error(errorMsg);
  }

  // Not all responses will be JSON (e.g., 204 No Content)
  if (response.status !== 204) {
      return response.json();
  }
  return null;
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
  delete: (endpoint: string) =>
    fetchAPI(endpoint, {
      method: 'DELETE',
    }),
};
