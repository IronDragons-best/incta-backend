import { ApiProperty } from '@nestjs/swagger';

export class ErrorMessageBaseDto {
  @ApiProperty()
  message: string;
}
export class ErrorMessageDto extends ErrorMessageBaseDto {
  @ApiProperty({ required: false })
  field?: string;
}

export class ErrorResponseDto {
  @ApiProperty({ type: [ErrorMessageDto] })
  errorsMessages: ErrorMessageDto[];
}

export class WithoutFieldErrorResponseDto {
  @ApiProperty({ type: [ErrorMessageBaseDto] })
  errorsMessages: ErrorMessageBaseDto[];
}
