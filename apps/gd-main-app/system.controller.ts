import { Controller, Get } from '@nestjs/common';

@Controller('system')
export class SystemController {
  @Get('memory')
  getMemoryUsage() {
    if (global.gc) {
      global.gc(); // руками форсируем GC перед замером
    }

    const mem = process.memoryUsage();
    return {
      rss: (mem.rss / 1024 / 1024).toFixed(2) + ' MB',
      heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
      heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      external: (mem.external / 1024 / 1024).toFixed(2) + ' MB',
    };
  }
}
