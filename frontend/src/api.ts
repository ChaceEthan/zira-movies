const rawBaseUrl = (
  import.meta.env.NEXT_PUBLIC_API_URL ||
  import.meta.env.VITE_API_URL ||
  ''
)
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

export const API_BASE_URL = `${rawBaseUrl}/api`;

export function buildApiUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  const strippedPath = endpoint
    .trim()
    .replace(/^\/+/, '')
    .replace(/^(?:api\/)+/i, '')
    .replace(/^api$/i, '');
  return strippedPath ? `${API_BASE_URL}/${strippedPath}` : API_BASE_URL;
}

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? buildApiUrl(input) : input;

  const request: RequestInit = { ...init, credentials: init?.credentials || 'include' };
  return fetch(url, request).then(async response => {
    const path = typeof input === 'string' ? buildApiUrl(input) : '';
    const headers = new Headers(init?.headers);
    if (response.status !== 401 || !headers.has('Authorization') || path.includes('/api/auth/')) {
      return response;
    }

    const refresh = await fetch(buildApiUrl('/api/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
    });
    if (!refresh.ok) return response;
    const data = await refresh.json();
    if (typeof data.token !== 'string') return response;
    localStorage.setItem('zira_token', data.token);
    window.dispatchEvent(new CustomEvent('zira:token-refreshed', { detail: data.token }));
    headers.set('Authorization', `Bearer ${data.token}`);
    return fetch(url, { ...request, headers });
  });
}
