import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateProfileEvent } from '../../events/profile-events/profile.create.event';
import { CreateProfileCommand } from '../../../src/modules/profiles/application/use-cases/create.profile.use-case';
import { CreateProfileDomainDto } from '../../../src/modules/profiles/domain/profile.domain.dto';

@Injectable()
export class CreateProfileListener {
  constructor(private readonly commandBus: CommandBus) {}

  @OnEvent('profile.create')
  async handleProfileCreate(event: CreateProfileEvent) {
    const profileDto = CreateProfileDomainDto.from(event);
    await this.commandBus.execute(new CreateProfileCommand(profileDto));
  }
}
