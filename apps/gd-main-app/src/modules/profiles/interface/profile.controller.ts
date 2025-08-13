import { UpdateProfileCommand } from '../application/use-cases/update.profile.use-case';
import { Body, Controller, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ProfileInputDto } from './dto/profile.input.dto';
import { ExtractUserFromRequest } from '../../../../core/decorators/guard-decorators/extract.user.from.request.decorator';
import { UserContextDto } from '../../../../core/dto/user.context.dto';
import { JwtAuthGuard } from '../../../../core/guards/local/jwt-auth-guard';

@Controller('profile')
export class ProfileController {
  constructor(private readonly commandBus: CommandBus) {}
  @UseGuards(JwtAuthGuard)
  @Patch('update')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Body() body: ProfileInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    return await this.commandBus.execute(new UpdateProfileCommand(user.id, body));
  }
}
