import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { FileFromDatabaseDtoType } from '@common';

@Injectable()
export class FilesQueryRepository extends PrismaService {
  async getManyByUserIdAndPostId(
    userId: number,
    postId: number,
  ): Promise<FileFromDatabaseDtoType[] | null> {
    const files = await this.file.findMany({
      where: {
        postId: postId,
        uploadedBy: userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    if (!files.length) {
      return null;
    }
    return files as unknown as FileFromDatabaseDtoType[];
  }

  async getManyByUserId(userId: number): Promise<FileFromDatabaseDtoType[] | null> {
    const files = await this.file.findMany({
      where: {
        uploadedBy: userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    if (!files.length) {
      return null;
    }
    return files as unknown as FileFromDatabaseDtoType[];
  }
}
