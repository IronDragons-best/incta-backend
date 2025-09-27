import { Module } from '@nestjs/common';
import { TestResolver } from './resolvers/test.resolver';

@Module({
  imports: [],
  providers: [TestResolver],
})
export class NotificationsModule {}
