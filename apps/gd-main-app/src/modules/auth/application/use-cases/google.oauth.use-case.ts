import { GoogleUser } from '../../../../../core/guards/oauth2/ouath.google.strategy';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import {
  AppNotification,
  AuthProvider,
  ErrorMessage,
  NotificationService,
} from '@common';
import { CustomLogger } from '@monitoring';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '../../../users/domain/user.entity';
import { Tokens } from './token.service';
import { LoginCommand } from './login.use-case';
import { ClientInfoDto } from '../../interface/dto/input/client.info.dto';
import { UserProviderAddedEvent } from '../../../../../core/events/user-events/user.provider.added.event';
import { UserProviderRegisteredEvent } from '../../../../../core/events/user-events/user.oauth.registered.event';
import { CreateProfileEvent } from '../../../../../core/events/profile-events/profile.create.event';

export class GoogleOauthCommand {
  constructor(
    public readonly googleUser: GoogleUser,
    public clientInfo: ClientInfoDto,
  ) {}
}

@CommandHandler(GoogleOauthCommand)
export class GoogleOauthUseCase implements ICommandHandler<GoogleOauthCommand> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
    private readonly eventEmitter: EventEmitter2,
    private readonly commandBus: CommandBus,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('Google OAuth use case');
  }
  async execute(command: GoogleOauthCommand): Promise<AppNotification<Tokens>> {
    const notification = this.notificationService.create<Tokens>();
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { googleUser, clientInfo } = command;

      let user: User | null;

      user = await this.usersRepository.findByOAuthProviderIdWithTransaction(
        AuthProvider.GOOGLE,
        googleUser.googleId,
        queryRunner,
      );

      if (user) {
        this.logger.log(`Existing user logged in via Google: ${user.email}`);
      } else {
        user = await this.usersRepository.findUserWithProvider(
          googleUser.email,
          queryRunner,
        );

        if (user) {
          this.logger.log(`Adding Google provider to existing user: ${user.email}`);
          user.addProvider(AuthProvider.GOOGLE, googleUser.googleId);
          await this.usersRepository.saveWithTransaction(user, queryRunner);

          const userProviderCreatedEvent = new UserProviderAddedEvent(
            user.username,
            user.email,
            AuthProvider.GOOGLE,
          );
          this.eventEmitter.emit('user.provider.added', userProviderCreatedEvent);
        } else {
          this.logger.log(`Creating new user via Google OAuth: ${googleUser.email}`);
          const baseUsername = User.generateOAuthUsername(googleUser.email);
          let username = baseUsername;
          let counter = 1;

          while (
            await this.usersRepository.findByUsernameWithTransaction(
              username,
              queryRunner,
            )
          ) {
            username = `${baseUsername}_${counter}`;
            counter++;
          }

          const newUser = User.createOauthInstance(
            googleUser.email,
            username,
            AuthProvider.GOOGLE,
            googleUser.googleId,
          );

          user = await this.usersRepository.saveWithTransaction(newUser, queryRunner);
          if (!user) {
            notification.setServerError('Failed to create new user during Google OAuth.');
            await queryRunner.rollbackTransaction();
            return notification;
          }

          const providerRegisteredEvent = new UserProviderRegisteredEvent(
            user.username,
            user.email,
            AuthProvider.GOOGLE,
          );

          this.eventEmitter.emit('user.provider.registered', providerRegisteredEvent);

          // Создаем только из айдишки. Другие поля до заполнения остаются пустыми.
          const createProfileEvent = new CreateProfileEvent(user.id);
          this.eventEmitter.emit('profile.create', createProfileEvent);
        }
      }
      await queryRunner.commitTransaction();

      const loginNotification: AppNotification<Tokens> = await this.commandBus.execute(
        new LoginCommand({
          userId: user.id,
          deviceName: clientInfo.deviceName,
          ip: clientInfo.ip,
        }),
      );
      if (loginNotification.hasErrors()) {
        const status = loginNotification.getStatusCode();
        const errors: Array<ErrorMessage> = loginNotification.getErrors();
        notification.addErrors(errors, status);
        await queryRunner.rollbackTransaction();
        return notification;
      }

      const tokens = loginNotification.getValue();
      if (!tokens) {
        notification.setServerError('Failed to get tokens from LoginUseCase.');
        await queryRunner.rollbackTransaction();
        return notification;
      }

      notification.setValue(tokens);
      return notification;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error in Google OAuth process', error);
      notification.setServerError('OAuth authentication failed');
      return notification;
    } finally {
      await queryRunner.release();
    }
  }
}
