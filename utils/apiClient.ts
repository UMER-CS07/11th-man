import { getAuthToken } from './auth';

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', token);
  }

  return fetch(url, {
    ...options,
    headers
  });
}
