import { ApiProperty } from '@nestjs/swagger';

export class PostViewDto {
  @ApiProperty({
    description: 'Unique identifier of the post.',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'User id of the user who created the post.',
    example: 15,
  })
  userId: number;

  @ApiProperty({
    description: 'Title of the post.',
    example: 'Understanding TypeScript Decorators'
  })
  title: string;

  @ApiProperty({
    description: 'Content of the post.',
    example: 'This post explains how to use decorators in TypeScript...'
  })
  shortDescription: string;

  @ApiProperty({
    description: 'Preview images of the post.',
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg'
    ],
  })
  previewImages: string[];

  @ApiProperty({
    description: 'Date when the post was created.',
    example: '2023-10-01T12:00:00Z',
  })
  createdAt: Date;
}