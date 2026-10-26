import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/api';

const loginSchema = z.object({
  email: z.email('Email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  if (!loading && user) {
    return <Navigate to="/tasks" replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
      toast.success('Connexion réussie');
      navigate('/tasks', { replace: true });
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Email ou mot de passe incorrect'),
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl">Connexion</h1>
          <p className="text-sm text-base-content/70">
            Accédez à votre liste de tâches.
          </p>

          <form
            className="mt-4 space-y-4"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="form-control">
              <label className="label" htmlFor="email">
                <span className="label-text">Email</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                className={`input w-full ${errors.email ? 'input-error' : ''}`}
                {...register('email')}
              />
              {errors.email && (
                <span className="mt-1 text-sm text-error">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="form-control">
              <label className="label" htmlFor="password">
                <span className="label-text">Mot de passe</span>
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={`input w-full ${errors.password ? 'input-error' : ''}`}
                {...register('password')}
              />
              {errors.password && (
                <span className="mt-1 text-sm text-error">
                  {errors.password.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary mt-2 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner" />
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            Pas encore de compte ?{' '}
            <Link to="/register" className="link link-primary">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
