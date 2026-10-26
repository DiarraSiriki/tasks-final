import { api, getStoredToken } from '../lib/api';
import type { AuthResponse, SessionResponse } from '../types/api';

export const authService = {
  async signUp(email: string, password: string, name?: string) {
    const response = await api.post<AuthResponse>('/api/auth/sign-up/email', {
      email,
      password,
      name,
    });
    return response.data;
  },

  async signIn(email: string, password: string) {
    const response = await api.post<AuthResponse>('/api/auth/sign-in/email', {
      email,
      password,
    });
    return response.data;
  },

  async signOut() {
    const token = getStoredToken();

    // /sign-out ne supprime que le cookie de session : avec un token Bearer il
    // faut révoquer explicitement la session avant de nettoyer le stockage.
    if (token) {
      try {
        await api.post('/api/auth/revoke-session', { token });
      } catch {
        // On nettoie quand même le token local côté AuthProvider.
      }
    }

    const response = await api.post('/api/auth/sign-out', {});
    return response.data;
  },

  async getSession() {
    const response = await api.get<SessionResponse | null>(
      '/api/auth/get-session',
    );
    return response.data;
  },
};
