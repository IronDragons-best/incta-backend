import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CityViewDto } from '../../../../src/modules/location/interface/dto/city.view.dto';
import { WithoutFieldErrorResponseDto } from '@common';

export function GetAllCitiesSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all cities',
      description: 'Getting all cities from the server, for list of the cities.',
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
