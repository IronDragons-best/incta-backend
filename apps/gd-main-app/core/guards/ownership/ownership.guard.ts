import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  SetMetadata,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IOwnershipRepository } from './ownership.repository.interface';

export const OWNERSHIP_KEY = 'ownership';

export interface OwnershipConfig {
  repository: RepositoryToken;
  paramName?: string;
}

export type RepositoryToken = string | symbol | (new (...args: any[]) => any);

/** Передаем репозиторий, который будем использовать для проверки. В репозитории добавляем метод checkOwnership
 * Репозиторий при этом должен имплементировать IOwnershipRepository */
export const CheckOwnership = (config: OwnershipConfig) => {
  return SetMetadata(OWNERSHIP_KEY, config);
};

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Используем getAllAndOverride для более надежного получения метаданных
    const config = this.reflector.getAllAndOverride<OwnershipConfig>(OWNERSHIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!config) {
      console.log('No config found, allowing access');
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as { id: number };
    const paramName = config.paramName || 'id';
    const resourceId = Number.parseInt(request.params[paramName]);

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!resourceId || isNaN(resourceId)) {
      throw new BadRequestException('Invalid parameter');
    }

    try {
      const repository: IOwnershipRepository = this.moduleRef.get(config.repository, {
        strict: false,
      });

      if (!repository) {
        console.log('!repository');
        throw new InternalServerErrorException(
          `Repository '${String(config.repository)}' not found`,
        );
      }

      // Проверяем что репозиторий реализует нужный метод
      if (typeof repository.checkOwnership !== 'function') {
        throw new InternalServerErrorException(
          `Repository '${String(config.repository)}' does not implement checkOwnership method`,
        );
      }
      const isOwner = await repository.checkOwnership(resourceId, user.id);
      if (!isOwner) {
        throw new ForbiddenException('You are not the owner of this resource');
      }

      return true;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Ownership check failed');
    }
  }
}
