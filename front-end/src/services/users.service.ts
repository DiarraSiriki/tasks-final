import { api } from '../lib/api';
import type { CreateUserDto, ManagedUser } from '../types/api';

export const usersService = {
  async findAll() {
    const response = await api.get<ManagedUser[]>('/users');
    return response.data;
  },

  async create(dto: CreateUserDto) {
    const response = await api.post<ManagedUser>('/users', dto);
    return response.data;
  },
};
