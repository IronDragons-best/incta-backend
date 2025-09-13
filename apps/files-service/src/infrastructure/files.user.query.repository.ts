import { Injectable } from '@nestjs/common';
import { FileUserFromDatabaseDtoType } from '@common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FilesUserQueryRepository extends PrismaService {
  async getManyAvatarsByUserId(userId: number): Promise<FileUserFromDatabaseDtoType[] | null> {
    try {
      const files = await this.fileUser.findMany({
        where: { uploadedBy: userId },
        orderBy: { createdAt: 'asc' },
      });
      return files as FileUserFromDatabaseDtoType[] ?? null;
    } catch (error) {
      return null;
    }
  }
}
