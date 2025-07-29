import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { Request } from 'express';

export const OWNERSHIP_KEY = 'ownership';

export interface OwnershipConfig {
  repository: string;
  paramName?: string;
}

export const CheckOwnership = (config: OwnershipConfig) => {
  return Reflect.metadata(OWNERSHIP_KEY, config);
};

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<OwnershipConfig>(
      OWNERSHIP_KEY,
      context.getHandler(),
    );

    if (!config) {
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
      const repository = this.moduleRef.get(config.repository, { strict: false });

      if (!repository) {
        throw new InternalServerErrorException(
          `Repository '${config.repository}' not found`,
        );
      }

      // Проверяем что репозиторий реализует нужный метод
      if (typeof repository.checkOwnership !== 'function') {
        throw new InternalServerErrorException(
          `Repository '${config.repository}' does not implement checkOwnership method`,
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
