import { GitHubUser } from '../../../../../core/guards/oauth2/oauth.github.strategy';
import { ClientInfoDto } from '../../interface/dto/input/client.info.dto';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { AppNotification, NotificationService } from '@common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Tokens } from './token.service';
import { AuthProvider } from '../../domain/user.oauth2.provider';
import { User } from '../../../users/domain/user.entity';
import { LoginCommand } from './login.use-case';

export class GithubOauthCommand {
  constructor(
    public githubUser: GitHubUser,
    public clientInfo: ClientInfoDto,
  ) {}
}

@CommandHandler(GithubOauthCommand)
export class GithubOauthUseCase implements ICommandHandler<GithubOauthCommand> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly eventEmitter: EventEmitter2,
    private readonly usersRepository: UsersRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('Github Oauth use case');
  }
  async execute(command: GithubOauthCommand): Promise<AppNotification<Tokens>> {
    const notification = this.notification.create<Tokens>();
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { githubUser, clientInfo } = command;
      let user: User | null;

      user = await this.usersRepository.findByOAuthProviderIdWithTransaction(
        AuthProvider.GITHUB,
        githubUser.githubId,
        queryRunner,
      );

      if (user) {
        this.logger.log(`Existing user logged in via Github: ${user.email}`);
      } else {
        user = await this.usersRepository.findByEmailWithTransaction(
          githubUser.email,
          queryRunner,
        );

        if (user) {
          this.logger.log(`Adding Github provider to existing user: ${user.email}`);
          user.addProvider(AuthProvider.GITHUB, githubUser.githubId);
          await this.usersRepository.saveWithTransaction(user, queryRunner);

          this.eventEmitter.emit('user.provider.added', {
            userId: user.id,
            email: user.email,
            provider: AuthProvider.GITHUB,
          });
        } else {
          this.logger.log(`Creating new user via Github OAuth: ${githubUser.email}`);
          const baseUsername = User.generateOAuthUsername(githubUser.username);
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
            githubUser.email,
            username,
            AuthProvider.GITHUB,
            githubUser.githubId,
          );

          user = await this.usersRepository.saveWithTransaction(newUser, queryRunner);
          if (!user) {
            notification.setServerError('Failed to create new user during Github OAuth.');
            await queryRunner.rollbackTransaction();
            return notification;
          }

          this.eventEmitter.emit('user.provider.registered', {
            userId: user.id,
            email: user.email,
            username: user.username,
            provider: AuthProvider.GITHUB,
            firstName: githubUser.firstName,
          });
        }
      }

      const loginResult: AppNotification<Tokens> = await this.commandBus.execute(
        new LoginCommand({
          userId: user.id,
          deviceName: clientInfo.deviceName,
          ip: clientInfo.ip,
        }),
      );

      if (loginResult.hasErrors()) {
        const status = loginResult.getStatusCode();
        const errors = loginResult.getErrors();
        notification.addErrors(errors, status);
        await queryRunner.rollbackTransaction();
        return notification;
      }

      const tokens = loginResult.getValue();
      if (!tokens) {
        this.logger.error('Something went wrong while creating tokens');
        notification.setServerError('Failed to get tokens from LoginUseCase');
        await queryRunner.rollbackTransaction();
        return notification;
      }

      await queryRunner.commitTransaction();
      notification.setValue(tokens);
      return notification;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error in Github OAuth process', error);
      notification.setServerError('OAuth authentication failed');
      return notification;
    } finally {
      await queryRunner.release();
    }
  }
}
