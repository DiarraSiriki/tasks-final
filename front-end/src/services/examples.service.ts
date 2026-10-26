import { api } from '../lib/api';
import type {
  CreateExampleDto,
  Example,
  UpdateExampleDto,
} from '../types/api';

export const examplesService = {
  async findAll() {
    const response = await api.get<Example[]>('/examples');
    return response.data;
  },

  async findOne(id: string) {
    const response = await api.get<Example>(`/examples/${id}`);
    return response.data;
  },

  async create(dto: CreateExampleDto) {
    const response = await api.post<Example>('/examples', dto);
    return response.data;
  },

  async update(id: string, dto: UpdateExampleDto) {
    const response = await api.patch<Example>(`/examples/${id}`, dto);
    return response.data;
  },

  async remove(id: string) {
    const response = await api.delete(`/examples/${id}`);
    return response.data;
  },
};
