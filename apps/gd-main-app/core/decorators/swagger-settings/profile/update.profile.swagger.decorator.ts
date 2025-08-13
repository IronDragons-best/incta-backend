import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ProfileInputDto } from '../../../../src/modules/profiles/interface/dto/profile.input.dto';
import { ErrorResponseDto, WithoutFieldErrorResponseDto } from '@common';

export function UpdateProfileSwaggerDecorator() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({
      summary: 'Update user profile',
      description: 'This endpoint allows you to update your profile data',
    }),
    ApiBody({
      description: 'Profile data to update',
      type: ProfileInputDto,
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Profile updated successfully with no content',
    }),
    ApiBadRequestResponse({
      description: 'Invalid input data',
      type: ErrorResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated or token expired',
      type: WithoutFieldErrorResponseDto,
    }),

    ApiNotFoundResponse({
      description: 'Profile not found',
      type: WithoutFieldErrorResponseDto,
    }),
  );
}
