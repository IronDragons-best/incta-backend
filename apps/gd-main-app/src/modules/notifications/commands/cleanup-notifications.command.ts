import { Injectable } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import { NotificationService } from '../application/notification.service';
import { CustomLogger } from '@monitoring';

interface CleanupOptions {
  dryRun?: boolean;
  archiveDays?: number;
  deleteDays?: number;
  verbose?: boolean;
}

@Injectable()
@Command({
  name: 'cleanup-notifications',
  description: 'Clean up old notifications (archive and delete)',
})
export class CleanupNotificationsCommand extends CommandRunner {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
  ) {
    super();
    this.logger.setContext('CleanupNotificationsCommand');
  }

  async run(passedParams: string[], options?: CleanupOptions): Promise<void> {
    const { dryRun = true, archiveDays = 30, deleteDays = 90, verbose = false } = options || {};

    try {
      if (verbose) {
        console.log('🧹 Starting notifications cleanup...');
        console.log(`Archive days: ${archiveDays}`);
        console.log(`Delete days: ${deleteDays}`);
        console.log(`Dry run: ${dryRun ? 'Yes' : 'No'}`);
        console.log('');
      }

      const result = await this.notificationService.manualCleanup({
        archiveDays,
        deleteDays,
        dryRun,
      });

      if (dryRun) {
        console.log('🔍 DRY RUN RESULTS:');
        console.log(`📦 Would archive: ${result.archivedCount} notifications`);
        console.log(`🗑️  Would delete: ${result.deletedCount} notifications`);
        console.log(`📊 Total old notifications: ${result.oldCount}`);
        console.log('💡 To actually perform cleanup, run with --no-dry-run');
      } else {
        console.log('✅ CLEANUP COMPLETED:');
        console.log(`📦 Archived: ${result.archivedCount} notifications`);
        console.log(`🗑️  Deleted: ${result.deletedCount} notifications`);
        console.log(`📊 Total processed: ${result.oldCount} notifications`);
      }

      this.logger.log(`Cleanup completed - archived: ${result.archivedCount}, deleted: ${result.deletedCount}`);

    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      this.logger.error('Cleanup command failed:', error);
      process.exit(1);
    }
  }

  @Option({
    flags: '--dry-run',
    description: 'Show what would be cleaned up without actually doing it',
    defaultValue: true,
  })
  parseDryRun(val: string): boolean {
    return val !== 'false';
  }

  @Option({
    flags: '--no-dry-run',
    description: 'Actually perform the cleanup',
  })
  parseNoDryRun(): boolean {
    return false;
  }

  @Option({
    flags: '--archive-days <days>',
    description: 'Archive notifications older than this many days (default: 30)',
    defaultValue: 30,
  })
  parseArchiveDays(val: string): number {
    const days = parseInt(val, 10);
    if (isNaN(days) || days < 1) {
      throw new Error('Archive days must be a positive number');
    }
    return days;
  }

  @Option({
    flags: '--delete-days <days>',
    description: 'Delete archived notifications older than this many days (default: 90)',
    defaultValue: 90,
  })
  parseDeleteDays(val: string): number {
    const days = parseInt(val, 10);
    if (isNaN(days) || days < 1) {
      throw new Error('Delete days must be a positive number');
    }
    return days;
  }

  @Option({
    flags: '-v, --verbose',
    description: 'Verbose output',
    defaultValue: false,
  })
  parseVerbose(): boolean {
    return true;
  }
}