import { UpdateProfileCommand } from '../application/use-cases/update.profile.use-case';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ProfileInputDto } from './dto/profile.input.dto';
import { ExtractUserFromRequest } from '../../../../core/decorators/guard-decorators/extract.user.from.request.decorator';
import { UserContextDto } from '../../../../core/dto/user.context.dto';
import { JwtAuthGuard } from '../../../../core/guards/local/jwt-auth-guard';
import { UpdateProfileSwaggerDecorator } from '../../../../core/decorators/swagger-settings/profile/update.profile.swagger.decorator';
import { UpdateAvatarCommand } from '../application/use-cases/update-avatar.use-case';
import { FileInterceptor } from '@nestjs/platform-express';
import { AVATAR_SIZE_LIMIT } from '@common';
import { AvatarValidationPipe } from '@common/pipes/avatar-validation-pipe.service';
import { ImageCompressionPipe } from '@common/pipes/image.processing.pipe';
import { UploadAvatarSwagger } from '../../../../core/decorators/swagger-settings/profile/upload.avatar.swagger.decorator';
import { DeleteAvatarCommand } from '../application/use-cases/delete-avatar.use-case';
import { DeleteAvatarSwagger } from '../../../../core/decorators/swagger-settings/profile/delete.avatar.swagger.decorator';

@Controller('profile')
export class ProfileController {
  constructor(private readonly commandBus: CommandBus) {}
  @UseGuards(JwtAuthGuard)
  @Patch()
  @UpdateProfileSwaggerDecorator()
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateProfile(
    @Body() body: ProfileInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    return await this.commandBus.execute(new UpdateProfileCommand(user.id, body));
  }

  @UseGuards(JwtAuthGuard)
  @Patch('avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UploadAvatarSwagger()
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: AVATAR_SIZE_LIMIT },
    }),
  )
  async updateAvatar(
    @UploadedFile(new AvatarValidationPipe(), ImageCompressionPipe())
    avatar: Express.Multer.File,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    return await this.commandBus.execute(new UpdateAvatarCommand(avatar, user.id));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteAvatarSwagger()
  async deleteAvatar(@ExtractUserFromRequest() user: UserContextDto) {
    return await this.commandBus.execute(new DeleteAvatarCommand(user.id));
  }
}
