import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class MemoryLoggerService implements OnModuleInit {
  private readonly logger = new Logger(MemoryLoggerService.name);

  onModuleInit() {
    setInterval(() => {
      if (global.gc) {
        global.gc();
      }
      const mem = process.memoryUsage();
      this.logger.log(
        `Memory: rss=${(mem.rss / 1024 / 1024).toFixed(2)}MB, heapUsed=${(
          mem.heapUsed /
          1024 /
          1024
        ).toFixed(2)}MB`,
      );
    }, 600000);
  }
}
