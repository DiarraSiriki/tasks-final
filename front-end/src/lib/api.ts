import axios from 'axios';

/**
 * En développement, `VITE_API_URL` est vide : les requêtes partent sur la même
 * origine et sont relayées vers le backend par le proxy Vite (vite.config.ts).
 * En production, on peut soit garder ce proxy, soit renseigner une URL absolue.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const TOKEN_STORAGE_KEY = 'tasks.auth.token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Le backend protège /tasks avec un token Bearer (voir SessionGuard).
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearStoredToken();
      const { pathname } = window.location;
      if (pathname !== '/login' && pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/** Extrait le message d'erreur renvoyé par NestJS (string ou tableau de strings). */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[]; error?: string }
      | undefined;

    if (Array.isArray(data?.message)) {
      return data.message.join(', ');
    }
    if (typeof data?.message === 'string') {
      return data.message;
    }
    if (typeof data?.error === 'string') {
      return data.error;
    }
  }
  return fallback;
}
