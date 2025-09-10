import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PostDeletedEvent } from '../../events/post-events/post.deleted.event';
import { HttpService } from '@nestjs/axios';
import { CustomLogger } from '@monitoring';
import { catchError, firstValueFrom, retry, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { AppConfigService } from '@common';

@EventsHandler(PostDeletedEvent)
export class PostDeletedListener implements IEventHandler<PostDeletedEvent> {
  private get filesUrl(): string {
    return this.configService.filesUrl;
  }

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: CustomLogger,
    private readonly configService: AppConfigService,
  ) {
    this.logger.setContext('PostDeletedListener');
  }

  async handle(event: PostDeletedEvent) {
    try {
      await this.deleteFilesWithRetry(event);
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unknown error';
      this.logger.error(
        `All attempts failed to delete files for post ${event.postId}: ${errorMessage}`,
      );
    }
  }

  private async deleteFilesWithRetry(event: PostDeletedEvent) {
    const maxRetries = 2;

    await firstValueFrom(
      this.deleteFiles(event).pipe(
        retry({
          count: maxRetries,
          resetOnSuccess: true, // если первый успешен — больше не повторяем
        }),
        catchError((error) => throwError(() => error)), // проброс ошибки после всех попыток
      ),
    );

    this.logger.log(`Files deleted successfully for post ${event.postId}`);
  }

  private deleteFiles(event: PostDeletedEvent) {
    const url = `${this.filesUrl}/api/v1/delete-post-files/${event.postId}`;
    const filesAdminLogin = this.configService.filesAdminLogin;
    const filesAdminPassword = this.configService.filesAdminPassword;

    return this.httpService.delete(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${filesAdminLogin}:${filesAdminPassword}`,
        ).toString('base64')}`,
      },
      timeout: 10000, // стандартный таймаут на один запрос
    });
  }
}
