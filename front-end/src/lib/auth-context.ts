import { createContext } from 'react';
import type { User } from '../types/api';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
