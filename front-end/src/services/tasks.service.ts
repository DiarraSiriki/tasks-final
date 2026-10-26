import { api } from '../lib/api';
import type {
  CreateTaskDto,
  ListTaskFilters,
  Task,
  UpdateTaskDto,
} from '../types/api';

export const tasksService = {
  async findAll(filters: ListTaskFilters = {}) {
    const response = await api.get<Task[]>('/tasks', { params: filters });
    return response.data;
  },

  async findOne(id: string) {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  async create(dto: CreateTaskDto) {
    const response = await api.post<Task>('/tasks', dto);
    return response.data;
  },

  async update(id: string, dto: UpdateTaskDto) {
    const response = await api.patch<Task>(`/tasks/${id}`, dto);
    return response.data;
  },

  /** Raccourci backend : marque la tâche comme terminée (completed = true). */
  async complete(id: string) {
    const response = await api.patch<Task>(`/tasks/${id}/completed`);
    return response.data;
  },

  async remove(id: string) {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};
