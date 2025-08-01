import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PostDeletedEvent } from '../../events/post-events/post.deleted.event';
import { HttpService } from '@nestjs/axios';
import { CustomLogger } from '@monitoring';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@EventsHandler(PostDeletedEvent)
export class PostDeletedHandler implements IEventHandler<PostDeletedEvent> {
  constructor(
    private readonly httpService: HttpService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('PostDeletedHandler');
  }

  async handle(event: PostDeletedEvent) {
    try {
      await this.deleteFiles(event);
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unknown error';
      this.logger.warn(
        `First attempt failed to delete files for post ${event.postId}. Retrying in 5 seconds... ErrorMessage: ${errorMessage}`,
      );

      await this.sleep(10000);

      try {
        await this.deleteFiles(event);
      } catch (retryError) {
        const errorMessage =
          retryError instanceof AxiosError
            ? retryError.message
            : retryError instanceof Error
              ? retryError.message
              : 'Unknown error';
        this.logger.error(
          `Final attempt failed to delete files for post ${event.postId}: ${errorMessage}`,
        );
      }
    }
  }

  private async deleteFiles(event: PostDeletedEvent): Promise<void> {
    await firstValueFrom(
      this.httpService.delete(`/files/posts/${event.postId}`, {
        timeout: 10000, // 10 секунд таймаут для повторной попытки
      }),
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
