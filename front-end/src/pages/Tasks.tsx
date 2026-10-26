import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { getApiErrorMessage } from '../lib/api';
import { tasksService } from '../services/tasks.service';
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  type Task,
  type TaskPriority,
} from '../types/api';

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est requis').max(120),
  description: z.string().max(500).optional(),
  priority: z.enum(TASK_PRIORITIES),
});

type TaskFormData = z.infer<typeof taskSchema>;

type CompletedFilter = 'all' | 'pending' | 'completed';
type PriorityFilter = 'ALL' | TaskPriority;

const PRIORITY_BADGES: Record<TaskPriority, string> = {
  LOW: 'badge-success',
  MEDIUM: 'badge-warning',
  HIGH: 'badge-error',
};

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
});

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedFilter, setCompletedFilter] =
    useState<CompletedFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [showModal, setShowModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
    },
  });

  useEffect(() => {
    let active = true;

    tasksService
      .findAll(priorityFilter === 'ALL' ? {} : { priority: priorityFilter })
      .then((data) => {
        if (active) setTasks(data);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            getApiErrorMessage(error, 'Erreur lors du chargement des tâches'),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [priorityFilter]);

  const visibleTasks = useMemo(() => {
    if (completedFilter === 'all') return tasks;
    return tasks.filter((task) =>
      completedFilter === 'completed' ? task.completed : !task.completed,
    );
  }, [tasks, completedFilter]);

  const remainingCount = tasks.filter((task) => !task.completed).length;

  const closeModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = async (data: TaskFormData) => {
    try {
      const created = await tasksService.create({
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        priority: data.priority,
      });
      if (priorityFilter === 'ALL' || created.priority === priorityFilter) {
        setTasks((current) => [created, ...current]);
      }
      toast.success('Tâche créée');
      closeModal();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Erreur lors de la création de la tâche'),
      );
    }
  };

  const toggleComplete = async (task: Task) => {
    try {
      await tasksService.update(task.id, { completed: !task.completed });
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? { ...item, completed: !item.completed }
            : item,
        ),
      );
      toast.success(
        task.completed ? 'Tâche réactivée' : 'Tâche terminée',
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Erreur lors de la mise à jour'),
      );
    }
  };

  const deleteTask = async (task: Task) => {
    if (!window.confirm(`Supprimer la tâche « ${task.title} » ?`)) return;

    try {
      await tasksService.remove(task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
      toast.success('Tâche supprimée');
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Erreur lors de la suppression'),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mes tâches</h1>
          <p className="mt-1 text-sm text-base-content/70">
            {tasks.length} tâche{tasks.length > 1 ? 's' : ''} ·{' '}
            {remainingCount} en cours
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          + Nouvelle tâche
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="tabs tabs-box">
          {(
            [
              ['all', 'Toutes'],
              ['pending', 'En cours'],
              ['completed', 'Terminées'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              className={`tab ${completedFilter === value ? 'tab-active' : ''}`}
              onClick={() => setCompletedFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          className="select w-48"
          aria-label="Filtrer par priorité"
          value={priorityFilter}
          onChange={(event) => {
            setLoading(true);
            setPriorityFilter(event.target.value as PriorityFilter);
          }}
        >
          <option value="ALL">Toutes les priorités</option>
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {TASK_PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center py-12 text-center">
            <p className="text-lg font-medium">Aucune tâche trouvée</p>
            <p className="text-sm text-base-content/70">
              Créez une tâche ou modifiez vos filtres.
            </p>
          </div>
        </div>
      ) : (
        <ul className="grid gap-3">
          {visibleTasks.map((task) => (
            <li key={task.id} className="card bg-base-100 shadow">
              <div className="card-body flex-row items-start gap-3 p-4">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary mt-1"
                  checked={task.completed}
                  onChange={() => void toggleComplete(task)}
                  aria-label={
                    task.completed
                      ? `Réactiver ${task.title}`
                      : `Terminer ${task.title}`
                  }
                />
                <div className="min-w-0 flex-1">
                  <h2
                    className={`text-lg font-semibold break-words ${
                      task.completed
                        ? 'text-base-content/40 line-through'
                        : ''
                    }`}
                  >
                    {task.title}
                  </h2>
                  {task.description && (
                    <p className="mt-1 text-sm break-words text-base-content/70">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-base-content/60">
                    <span className={`badge ${PRIORITY_BADGES[task.priority]}`}>
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </span>
                    <span>Créée le {dateFormatter.format(new Date(task.createdAt))}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-error"
                  onClick={() => void deleteTask(task)}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h2 className="mb-4 text-lg font-bold">Nouvelle tâche</h2>
            <form
              className="space-y-4"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <div className="form-control">
                <label className="label" htmlFor="title">
                  <span className="label-text">Titre</span>
                </label>
                <input
                  id="title"
                  type="text"
                  className={`input w-full ${errors.title ? 'input-error' : ''}`}
                  placeholder="Ex. Préparer la présentation"
                  {...register('title')}
                />
                {errors.title && (
                  <span className="mt-1 text-sm text-error">
                    {errors.title.message}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label" htmlFor="description">
                  <span className="label-text">
                    Description <span className="text-xs">(optionnel)</span>
                  </span>
                </label>
                <textarea
                  id="description"
                  className={`textarea w-full ${errors.description ? 'textarea-error' : ''}`}
                  rows={3}
                  placeholder="Détails de la tâche…"
                  {...register('description')}
                />
                {errors.description && (
                  <span className="mt-1 text-sm text-error">
                    {errors.description.message}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label" htmlFor="priority">
                  <span className="label-text">Priorité</span>
                </label>
                <select
                  id="priority"
                  className="select w-full"
                  {...register('priority')}
                >
                  {TASK_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {TASK_PRIORITY_LABELS[priority]}
                    </option>
                  ))}
                </select>
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
