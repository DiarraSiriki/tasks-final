import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '../lib/api';
import { AuthContext } from '../lib/auth-context';
import { authService } from '../services/auth.service';
import type { User } from '../types/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (!getStoredToken()) {
        setLoading(false);
        return;
      }

      try {
        const session = await authService.getSession();
        if (session) {
          setUser(session.user);
        } else {
          clearStoredToken();
          setUser(null);
        }
      } catch {
        clearStoredToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await authService.signIn(email, password);
    setStoredToken(response.token);
    setUser(response.user);
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const response = await authService.signUp(email, password, name);
    setStoredToken(response.token);
    setUser(response.user);
  };

  const signOut = async () => {
    try {
      await authService.signOut();
    } finally {
      clearStoredToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
