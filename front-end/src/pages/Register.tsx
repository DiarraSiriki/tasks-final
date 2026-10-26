import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/api';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.email('Email invalide'),
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const { user, loading, signUp } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  if (!loading && user) {
    return <Navigate to="/tasks" replace />;
  }

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUp(data.email, data.password, data.name);
      toast.success('Compte créé avec succès');
      navigate('/tasks', { replace: true });
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Erreur lors de la création du compte'),
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl">Inscription</h1>
          <p className="text-sm text-base-content/70">
            Créez votre compte pour gérer vos tâches.
          </p>

          <form
            className="mt-4 space-y-4"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="form-control">
              <label className="label" htmlFor="name">
                <span className="label-text">Nom</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Votre nom"
                className={`input w-full ${errors.name ? 'input-error' : ''}`}
                {...register('name')}
              />
              {errors.name && (
                <span className="mt-1 text-sm text-error">
                  {errors.name.message}
                </span>
              )}
            </div>

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
                autoComplete="new-password"
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

            <div className="form-control">
              <label className="label" htmlFor="confirmPassword">
                <span className="label-text">Confirmer le mot de passe</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={`input w-full ${errors.confirmPassword ? 'input-error' : ''}`}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <span className="mt-1 text-sm text-error">
                  {errors.confirmPassword.message}
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
                "S'inscrire"
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            Déjà un compte ?{' '}
            <Link to="/login" className="link link-primary">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
