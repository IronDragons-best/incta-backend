import { ApiProperty } from '@nestjs/swagger';

export class OutputStatsViewDto {
  @ApiProperty({ description: 'Total posts count', example: 100 })
  totalPostsCount: number;

  @ApiProperty({ description: 'Total users count', example: 100 })
  totalUsersCount: number;

  constructor(totalPostsCount: number, totalUsersCount: number) {
    this.totalPostsCount = totalPostsCount;
    this.totalUsersCount = totalUsersCount;
  }
}
