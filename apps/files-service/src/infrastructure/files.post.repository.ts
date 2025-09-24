import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilePostEntity } from '../domain/file.post.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class FilesPostRepository extends PrismaService {
  async saveMany(
    files: Omit<FilePostEntity, 'id' | 'createdAt' | 'updatedAt' | 'requests'>[],
  ): Promise<Prisma.BatchPayload | null> {
    const result: Prisma.BatchPayload = await this.file.createMany({
      data: files,
    });
    if (!result.count) {
      return null;
    }
    return result;
  }
  async findByPostId(postId: number) {
    return this.file.findFirst({
      where: { postId },
    });
  }

  async findManyByPostId(postId: number) {
    return this.file.findMany({ where: { postId } });
  }

  async deleteManyByPostId(postId: number) {
    return this.file.deleteMany({ where: { postId } });
  }
}
