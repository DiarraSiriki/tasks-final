import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserSchema = z.object({
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
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
