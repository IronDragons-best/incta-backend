import { ApiExcludeEndpoint, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ErrorResponseDto } from '@common';
import { TokenResponseDto } from '../../../types/token.types';

export function GithubAuthSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Initiate GitHub OAuth authentication',
      description:
        'Redirects user to GitHub OAuth authorization page. Frontend should redirect user to this endpoint via window.location.href or <a> tag.',
    }),
    ApiResponse({
      status: HttpStatus.TEMPORARY_REDIRECT,
      description: 'Successfully redirects to GitHub OAuth authorization page',
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: ErrorResponseDto,
      description: 'Invalid OAuth parameters or missing configuration',
    }),
  );
}

export function GithubAuthCallbackSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'GitHub OAuth callback handler',
      description:
        'Internal callback endpoint. Called automatically by GitHub after user authorization. Do not call manually.',
    }),
    ApiQuery({
      name: 'code',
      description: 'Authorization code from GitHub',
      required: true,
      type: String,
    }),
    ApiQuery({
      name: 'state',
      description: 'State parameter for security',
      required: false,
      type: String,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Authentication successful, returns tokens',
      type: TokenResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: ErrorResponseDto,
      description: 'Invalid authorization code from GitHub or OAuth parameters error',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: ErrorResponseDto,
      description: 'User not found during login process',
    }),

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      type: ErrorResponseDto,
      description: 'GitHub OAuth authentication failed or invalid GitHub user data',
    }),
  );
}
