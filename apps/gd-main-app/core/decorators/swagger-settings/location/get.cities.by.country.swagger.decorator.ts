import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { CityViewDto } from '../../../../src/modules/location/interface/dto/city.view.dto';
import { WithoutFieldErrorResponseDto } from '@common';

export function GetCitiesByCountrySwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all Cities by country id',
      description: 'Getting all cities list by country id',
    }),
    ApiParam({
      name: 'countryId',
      description: 'country ID',
      required: true,
      type: Number,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: CityViewDto,
      isArray: true,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Cities not found.',
      type: WithoutFieldErrorResponseDto,
    }),
  );
}
