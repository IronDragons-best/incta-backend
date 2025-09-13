import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PasswordRecoveryUseCase } from '../../src/modules/auth/application/use-cases/password.recovery.use-case';

import { UsersRepository } from '../../src/modules/users/infrastructure/users.repository';

import { User } from '../../src/modules/users/domain/user.entity';
import { ConfigService } from '@nestjs/config';
import { RecaptchaService } from '../../src/modules/auth/application/recaptcha.service';
import { HttpService } from '@nestjs/axios';

describe('PasswordRecoveryUseCase', () => {
  let useCase: PasswordRecoveryUseCase;
  let usersRepository: any;
  let notification: NotificationService;
  let logger: CustomLogger;
  let eventEmitter: EventEmitter2;
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
        PasswordRecoveryUseCase,
        NotificationService,
        RecaptchaService,
        ConfigService,
        { provide: HttpService, useValue: { post: jest.fn() } },
        { provide: UsersRepository, useValue: { findByEmailWithTransaction: jest.fn(), saveWithTransaction: jest.fn() } },
        { provide: CustomLogger, useValue: { setContext: jest.fn(), warn: jest.fn(), error: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        {
          provide: DataSource,
          useValue: { createQueryRunner: () => queryRunner },
        },
      ],
    }).compile();

    useCase = module.get(PasswordRecoveryUseCase);
    usersRepository = module.get(UsersRepository);
    notification = module.get(NotificationService);
    logger = module.get(CustomLogger);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should return not found if user does not exist', async () => {
    usersRepository.findByEmailWithTransaction.mockResolvedValue(null);

    const result = await useCase.execute({
      email: 'notfound@example.com',
      captchaToken: 'captcha-token-12345'
    });

    expect(result.hasErrors()).toBe(true);
    expect(result.getStatusCode()).toBe(404);
    expect(logger.warn).toHaveBeenCalledWith('User Not Found');
  });

  it('should return 400 if email not confirmed', async () => {
    const user = new User();
    user.emailConfirmationInfo = { isConfirmed: false } as any;
    usersRepository.findByEmailWithTransaction.mockResolvedValue(user);

    const result = await useCase.execute({
      email: 'unconfirmed@example.com',
      captchaToken: 'captcha-token-12345'
    });

    expect(result.hasErrors()).toBe(true);
    expect(result.getStatusCode()).toBe(400);
    expect(logger.warn).toHaveBeenCalledWith('User Not Confirmed');
  });

  it('should emit recovery event and return 204 if successful', async () => {
    const user = new User();
    user.username = 'john';
    user.email = 'john@example.com';
    user.emailConfirmationInfo = { isConfirmed: true } as any;
    user.setPasswordRecoveryCode = jest.fn();

    usersRepository.findByEmailWithTransaction.mockResolvedValue(user);
    usersRepository.saveWithTransaction.mockResolvedValue(user);

    const result = await useCase.execute({
      email: user.email,
      captchaToken: 'captcha-token-12345'
    });

    expect(usersRepository.saveWithTransaction).toHaveBeenCalledWith(user, queryRunner);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'email.password_recovery',
      expect.objectContaining({ userLogin: 'john', email: 'john@example.com' }),
    );
    expect(result.getStatusCode()).toBe(204);
  });
});
