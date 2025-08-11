import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { FilePostFromDatabaseDtoType } from '@common';

@Injectable()
export class FilesQueryRepository extends PrismaService {
  async getManyByUserIdAndPostId(
    userId: number,
    postId: number,
  ): Promise<FilePostFromDatabaseDtoType[] | null> {
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
    return files as unknown as FilePostFromDatabaseDtoType[];
  }

  async getManyByUserId(userId: number): Promise<FilePostFromDatabaseDtoType[] | null> {
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
    return files as unknown as FilePostFromDatabaseDtoType[];
  }
}
