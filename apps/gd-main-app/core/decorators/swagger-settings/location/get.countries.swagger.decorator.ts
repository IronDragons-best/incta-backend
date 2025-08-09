import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CountryViewDto } from '../../../../src/modules/location/interface/dto/country.view.dto';
import { WithoutFieldErrorResponseDto } from '@common';

export function GetCountriesSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all countries',
      description: 'Getting all countries',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: CountryViewDto,
      isArray: true,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Countries not found.',
      type: WithoutFieldErrorResponseDto,
    }),
  );
}
