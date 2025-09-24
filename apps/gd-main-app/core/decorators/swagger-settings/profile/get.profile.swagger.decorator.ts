import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { WithoutFieldErrorResponseDto } from '@common';
import { ProfileViewDto } from '../../../../src/modules/profiles/interface/dto/profile.view.dto';

export function GetProfileSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get profile info',
      description: 'This endpoint retrieves profile info',
    }),
    ApiParam({
      name: 'userId',
      type: Number,
      description: 'User Id',
      required: true,
      example: '2',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: ProfileViewDto,
    }),
    ApiNotFoundResponse({
      description: 'Profile not found',
      type: WithoutFieldErrorResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'User id is invalid',
      type: WithoutFieldErrorResponseDto,
    }),
  );
}
