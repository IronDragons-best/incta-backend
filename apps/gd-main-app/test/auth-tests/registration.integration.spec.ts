import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationUseCase } from '../../src/modules/auth/application/use-cases/registration.use.case';
import { CommandBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CustomLogger } from '@monitoring';
import { AppNotification, NotificationService } from '@common';
import { UserInputDto } from '../../src/modules/users/interface/dto/user.input.dto';
import { MockCustomLogger } from '../mocks/common.mocks';

describe('RegistrationUseCase', () => {
  let useCase: RegistrationUseCase;
  let commandBus: { execute: jest.Mock };
  let eventEmitter: { emit: jest.Mock };
  let logger: CustomLogger;

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationUseCase,
        NotificationService,
        { provide: CommandBus, useValue: commandBus },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: CustomLogger, useClass: MockCustomLogger },
      ],
    }).compile();

    useCase = module.get(RegistrationUseCase);
    logger = module.get(CustomLogger);
  });

  it('204: успешно — вызывает CreateUser и эмитит событие', async () => {
    const dto: UserInputDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'StrongP@ss1',
      passwordConfirmation: 'StrongP@ss1',
      agreeToTerms: true,
    };
    const regDto = { login: dto.username, email: dto.email, confirmCode: 'abc123' };
    const notification = new AppNotification<typeof regDto>().setValue(regDto);
    commandBus.execute.mockResolvedValue(notification);

    const result = await useCase.execute({ userDto: dto });

    expect(commandBus.execute).toHaveBeenCalledWith(expect.any(Object));
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'user.created',
      expect.objectContaining({
        userLogin: dto.username,
        email: dto.email,
        code: 'abc123',
      }),
    );
    expect(result.hasErrors()).toBe(false);
  });

  it('400: CreateUser вернул ошибки — эмит не вызывается', async () => {
    const dto = {
      username: '',
      email: 'bad',
      password: '',
      passwordConfirmation: '',
      agreeToTerms: false,
    };
    const notification = new AppNotification().setBadRequest(
      'bad credentials',
      'username',
    );
    commandBus.execute.mockResolvedValue(notification);

    const result = await useCase.execute({ userDto: dto });

    expect(commandBus.execute).toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
    expect(result.hasErrors()).toBe(true);
    expect(result.getErrors()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'username', message: 'bad credentials' }),
      ]),
    );
  });

  it('500: исключение — логирует и ничего не возвращает', async () => {
    const dto: UserInputDto = {
      username: 'x',
      email: 'x@x',
      password: 'p',
      passwordConfirmation: 'p',
      agreeToTerms: true,
    };
    commandBus.execute.mockRejectedValue(new Error('DB crash'));

    const result = await useCase.execute({ userDto: dto });

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(expect.any(Error));
    expect(eventEmitter.emit).not.toHaveBeenCalled();
    expect(result.hasErrors()).toBe(true);
  });
});
