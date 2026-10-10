import { apiFetch } from '../../api';

export async function adminRequest(path: string, method = 'GET', body?: unknown) {
  let response: Response;
  try {
    response = await apiFetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new Error('The server could not be reached. Your unsaved changes are still here; please try again.');
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(response.status >= 500 ? 'The server took too long to respond. Please try again shortly.' : 'An unexpected response was received. Please try again.');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Please check the fields and try again.');
  return data;
}