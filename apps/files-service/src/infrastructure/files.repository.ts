import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileEntity } from '../domain/file.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class FilesRepository extends PrismaService {
  async saveMany(
    files: Omit<FileEntity, 'id' | 'createdAt' | 'updatedAt' | 'requests'>[],
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
