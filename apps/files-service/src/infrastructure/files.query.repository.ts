import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesQueryRepository extends PrismaService {
  async getManyByPostId(postId: number) {
    const files = await this.file.findMany({
      where: {
        postId: postId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    if (!files.length) {
      return null;
    }
    return files;
  }
}
