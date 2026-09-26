/**
 * Frontend API Client for ZIRA Backend.
 * Uses VITE_API_URL for the base URL.
 */

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE_URL = `${API_ORIGIN}/api`;

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      const errorData = await response.json();
      return { data: null, error: errorData.message || `API Error: ${response.statusText}` };
    }
    const data: T = await response.json();
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Network error' };
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => fetcher<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body: any, options?: RequestInit) => fetcher<T>(endpoint, { ...options, method: 'POST', headers: { 'Content-Type': 'application/json', ...options?.headers }, body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: any, options?: RequestInit) => fetcher<T>(endpoint, { ...options, method: 'PATCH', headers: { 'Content-Type': 'application/json', ...options?.headers }, body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: RequestInit) => fetcher<T>(endpoint, { ...options, method: 'DELETE' }),
};

// Specific API calls
export const movieApi = {
  getMovies: async <T>(params?: Record<string, string>): Promise<ApiResponse<T>> => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient.get<T>(`/movies${queryString}`);
  },
  getMovieBySlug: async <T>(slug: string): Promise<ApiResponse<T>> => {
    return apiClient.get<T>(`/movies/slug/${slug}`);
  },
};