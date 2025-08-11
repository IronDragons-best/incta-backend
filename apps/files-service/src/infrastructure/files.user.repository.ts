import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileUserEntity } from '../domain/file.user.entity';
import { Prisma } from '@prisma/client';
import { FileType } from '@common';

@Injectable()
export class FilesUserRepository extends PrismaService {
  async findUserAvatar(userId: number) {
    return this.fileUser.findFirst({ where: { userId, type: FileType.PUBLIC } });
  }

  async deleteManyUserFilesByUserId(userId: number) {
    return this.fileUser.deleteMany({ where: { userId } });
  }

  async saveUserFilesMany(
    files: Omit<FileUserEntity, 'id' | 'createdAt' | 'updatedAt' | 'requests'>[],
  ) {
    return this.fileUser.createMany({
      data: files as Prisma.FileUserCreateManyInput[],
    });
  }

  async replaceUserAvatar(
    file: Omit<FileUserEntity, 'id' | 'createdAt' | 'updatedAt' | 'requests'>,
  ) {
    return this.$transaction(async (tx) => {
      const existing = await tx.fileUser.findFirst({ where: { userId: file.userId } });

      if (existing) {
        await tx.fileUser.delete({ where: { id: existing.id } });
      }

      return tx.fileUser.create({ data: file as Prisma.FileUserCreateInput });
    });
  }
}
