// Types pour l'authentification (Better Auth)
export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/** Réponse de POST /api/auth/sign-in/email et /api/auth/sign-up/email */
export interface AuthResponse {
  token: string;
  user: User;
  redirect?: boolean;
  url?: string;
}

/** Réponse de GET /api/auth/get-session */
export interface SessionResponse {
  session: Session;
  user: User;
}

// Types pour les tâches
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
};

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority: TaskPriority;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  completed?: boolean;
}

export interface ListTaskFilters {
  priority?: TaskPriority;
}

// Types pour les exemples (module de démonstration du backend)
export interface Example {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExampleDto {
  name: string;
  description?: string;
}

export interface UpdateExampleDto {
  name?: string;
  description?: string;
}
