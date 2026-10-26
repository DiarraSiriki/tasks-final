import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/api';
import { usersService } from '../services/users.service';
import type { ManagedUser } from '../types/api';

const userSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(80, 'Le nom ne peut pas dépasser 80 caractères'),
    email: z.email('Email invalide'),
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type UserFormData = z.infer<typeof userSchema>;

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
});

function getInitials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    let active = true;

    usersService
      .findAll()
      .then((data) => {
        if (active) setUsers(data);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            getApiErrorMessage(
              error,
              'Erreur lors du chargement des utilisateurs',
            ),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const closeModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      const created = await usersService.create({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
      });
      setUsers((current) => [created, ...current]);
      toast.success('Utilisateur créé');
      closeModal();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Erreur lors de la création de l'utilisateur"),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Utilisateurs</h1>
          <p className="mt-1 text-sm text-base-content/70">
            {users.length} utilisateur{users.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          + Nouvel utilisateur
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : users.length === 0 ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center py-12 text-center">
            <p className="text-lg font-medium">Aucun utilisateur</p>
            <p className="text-sm text-base-content/70">
              Ajoutez un premier utilisateur pour commencer.
            </p>
          </div>
        </div>
      ) : (
        <ul className="grid gap-3">
          {users.map((user) => (
            <li key={user.id} className="card bg-base-100 shadow">
              <div className="card-body flex-row items-center gap-4 p-4">
                <div className="avatar avatar-placeholder">
                  <div className="w-10 rounded-full bg-primary text-primary-content">
                    <span>{getInitials(user.name, user.email)}</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold break-words">
                    {user.name || 'Sans nom'}
                    {user.id === currentUser?.id && (
                      <span className="badge badge-ghost badge-sm ml-2">
                        Vous
                      </span>
                    )}
                  </h2>
                  <p className="text-sm break-words text-base-content/70">
                    {user.email}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-base-content/60">
                    <span
                      className={`badge badge-sm ${
                        user.emailVerified
                          ? 'badge-success'
                          : 'badge-warning'
                      }`}
                    >
                      {user.emailVerified ? 'Email vérifié' : 'Non vérifié'}
                    </span>
                    <span>
                      Créé le {dateFormatter.format(new Date(user.createdAt))}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h2 className="mb-4 text-lg font-bold">Nouvel utilisateur</h2>
            <form
              className="space-y-4"
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
                  className={`input w-full ${errors.name ? 'input-error' : ''}`}
                  placeholder="Ex. Aminata Diallo"
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
                  className={`input w-full ${errors.email ? 'input-error' : ''}`}
                  placeholder="utilisateur@exemple.com"
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
                  className={`input w-full ${errors.password ? 'input-error' : ''}`}
                  placeholder="8 caractères minimum"
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
                  className={`input w-full ${
                    errors.confirmPassword ? 'input-error' : ''
                  }`}
                  placeholder="8 caractères minimum"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <span className="mt-1 text-sm text-error">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner" />
                  ) : (
                    'Créer'
                  )}
                </button>
              </div>
            </form>
          </div>
          <button
            type="button"
            className="modal-backdrop"
            onClick={closeModal}
            aria-label="Fermer"
          />
        </div>
      )}
    </div>
  );
}
