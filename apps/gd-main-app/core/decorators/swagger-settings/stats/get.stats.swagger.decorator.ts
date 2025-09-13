import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { OutputStatsViewDto } from '../../../../src/modules/stats/interface/dto/output/stats.view.dto';

export function GetStatsSwaggerDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get stats',
      description: 'Getting stats from the server, for list of the stats.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Getting stats from the server, for list of the stats.',
      type: OutputStatsViewDto,
    }),
  );
}
