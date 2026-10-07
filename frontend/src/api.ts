const API_BASE_URL = (import.meta.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' && input.startsWith('/api/')
    ? `${API_BASE_URL}${input}`
    : input;

  const request = { ...init, credentials: init?.credentials || 'include' };
  return fetch(url, request).then(async response => {
    const path = typeof input === 'string' ? input : '';
    const headers = new Headers(init?.headers);
    if (response.status !== 401 || !headers.has('Authorization') || path.startsWith('/api/auth/')) return response;

    const refresh = await fetch(`${API_BASE_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!refresh.ok) return response;
    const data = await refresh.json();
    if (typeof data.token !== 'string') return response;
    localStorage.setItem('zira_token', data.token);
    window.dispatchEvent(new CustomEvent('zira:token-refreshed', { detail: data.token }));
    headers.set('Authorization', `Bearer ${data.token}`);
    return fetch(url, { ...request, headers });
  });
}