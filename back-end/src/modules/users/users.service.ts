import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { auth } from '../../auth/auth.cli.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';

const publicUserSelect = {
	id: true,
	email: true,
	name: true,
	emailVerified: true,
	image: true,
	createdAt: true,
	updatedAt: true,
} as const;

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	findAll() {
		return this.prisma.user.findMany({
			select: publicUserSelect,
			orderBy: { createdAt: 'desc' },
		});
	}

	async create(dto: CreateUserDto) {
		try {
			// Better Auth gère le hachage du mot de passe et la création du compte.
			const result = await auth.api.signUpEmail({ body: dto });

			// L'inscription ouvre automatiquement une session pour le nouvel
			// utilisateur. On la révoque : un administrateur crée un compte,
			// il ne doit pas être connecté à sa place.
			if (result.token) {
				await auth.api
					.signOut({ headers: { authorization: `Bearer ${result.token}` } })
					.catch(() => undefined);
			}

			return result.user;
		} catch (error) {
			const message = error instanceof Error ? error.message : "Impossible de créer l'utilisateur";

			if (/already exists|existe déjà|unique/i.test(message)) {
				throw new ConflictException('Un compte existe déjà avec cet email');
			}

			throw new BadRequestException(message);
		}
	}
}
