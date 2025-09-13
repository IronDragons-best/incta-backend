import { Test, TestingModule } from '@nestjs/testing';

import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';

import { DataSource } from 'typeorm';

import { NewPasswordUseCase } from '../../src/modules/auth/application/use-cases/new.password.use-case';

import { UsersRepository } from '../../src/modules/users/infrastructure/users.repository';

import { CryptoService } from '../../src/modules/users/application/crypto.service';

import { User } from '../../src/modules/users/domain/user.entity';

describe('NewPasswordUseCase', () => {
  let useCase: NewPasswordUseCase;
  let usersRepository: any;
  let notification: NotificationService;
  let logger: CustomLogger;
  let cryptoService: any;
  let queryRunner: any;

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewPasswordUseCase,
        NotificationService,
        { provide: UsersRepository, useValue: { findByRecoveryCodeWithTransaction: jest.fn(), saveWithTransaction: jest.fn() } },
        { provide: CustomLogger, useValue: { setContext: jest.fn(), warn: jest.fn(), error: jest.fn() } },
        { provide: CryptoService, useValue: { createHash: jest.fn().mockResolvedValue('hashedPassword') } },
        {
          provide: DataSource,
          useValue: { createQueryRunner: () => queryRunner },
        },
      ],
    }).compile();

    useCase = module.get(NewPasswordUseCase);
    usersRepository = module.get(UsersRepository);
    notification = module.get(NotificationService);
    logger = module.get(CustomLogger);
    cryptoService = module.get(CryptoService);
  });

  it('should return 404 if user is not found by recovery code', async () => {
    usersRepository.findByRecoveryCodeWithTransaction.mockResolvedValue(null);

    const result = await useCase.execute({ recoveryCode: 'invalid-code', newPassword: 'pass' });

    expect(result.hasErrors()).toBe(true);
    expect(result.getStatusCode()).toBe(404);
    expect(logger.warn).toHaveBeenCalledWith('User Not Found');
  });

  it('should return 400 if email is not confirmed', async () => {
    const user = new User();
    user.emailConfirmationInfo = { isConfirmed: false } as any;

    usersRepository.findByRecoveryCodeWithTransaction.mockResolvedValue(user);

    const result = await useCase.execute({ recoveryCode: 'valid-code', newPassword: 'pass' });

    expect(result.hasErrors()).toBe(true);
    expect(result.getStatusCode()).toBe(400);
    expect(logger.warn).toHaveBeenCalledWith('User Not Confirmed');
  });

  it('should set new password and return 204 if valid', async () => {
    const user = new User();
    user.emailConfirmationInfo = { isConfirmed: true } as any;
    user.setPasswordHash = jest.fn();
    user.setPasswordRecoveryCodeNullable = jest.fn();
    jest.spyOn(User, 'validatePasswordRecoveryCode').mockReturnValue(undefined);

    usersRepository.findByRecoveryCodeWithTransaction.mockResolvedValue(user);

    const result = await useCase.execute({ recoveryCode: 'valid', newPassword: '123' });

    expect(user.setPasswordHash).toHaveBeenCalledWith('hashedPassword');
    expect(user.setPasswordRecoveryCodeNullable).toHaveBeenCalled();
    expect(usersRepository.saveWithTransaction).toHaveBeenCalledWith(user, queryRunner);
    expect(result.getStatusCode()).toBe(204);
  });
});
