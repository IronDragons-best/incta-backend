import { ApiProperty } from '@nestjs/swagger';

export class ErrorMessageDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  field?: string;
}

export class ErrorResponseDto {
  @ApiProperty({ type: [ErrorMessageDto] })
  errorsMessages: ErrorMessageDto[];
}
