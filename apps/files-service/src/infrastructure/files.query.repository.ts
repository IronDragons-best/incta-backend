import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { FilePostFromDatabaseDtoType, FileUserFromDatabaseDtoType } from '@common';

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

  async getManyPostFilesByUserId(userId: number): Promise<FilePostFromDatabaseDtoType[]> {
    return (await this.file.findMany({
      where: { uploadedBy: userId },
      orderBy: { createdAt: 'asc' },
    })) as unknown as FilePostFromDatabaseDtoType[];
  }

  async getManyUserFilesByUserId(userId: number): Promise<FileUserFromDatabaseDtoType[]> {
    return (await this.fileUser.findMany({
      where: { uploadedBy: userId },
      orderBy: { createdAt: 'asc' },
    })) as unknown as FileUserFromDatabaseDtoType[];
  }
}
