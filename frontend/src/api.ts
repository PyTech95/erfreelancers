export const API_BASE = process.env.REACT_APP_BACKEND_URL as string;
const TOKEN_KEY = 'erf_admin_token';

export const getAdminToken = () => localStorage.getItem(TOKEN_KEY);
export const setAdminToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearAdminToken = () => localStorage.removeItem(TOKEN_KEY);

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = getAdminToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401 && token && !path.startsWith('/api/auth/')) {
    clearAdminToken();
    window.dispatchEvent(new Event('erf-admin-logout'));
  }
  return res;
}
