import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SessionGuard } from '../../common/guards/session.guard.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get()
	@ApiOperation({
		summary: 'Lister les utilisateurs',
		description: 'Récupérer la liste des comptes existants',
	})
	@ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
	@ApiResponse({ status: 401, description: 'Non authentifié' })
	findAll() {
		return this.usersService.findAll();
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: 'Créer un utilisateur',
		description: "Créer un nouveau compte utilisateur depuis l'application",
	})
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				name: { type: 'string', example: 'Aminata Diallo' },
				email: { type: 'string', example: 'aminata@example.com' },
				password: { type: 'string', example: 'motdepasse123' },
			},
			required: ['name', 'email', 'password'],
		},
	})
	@ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
	@ApiResponse({ status: 400, description: 'Données invalides' })
	@ApiResponse({ status: 401, description: 'Non authentifié' })
	@ApiResponse({ status: 409, description: 'Email déjà utilisé' })
	create(@Body() dto: CreateUserDto) {
		return this.usersService.create(dto);
	}
}
