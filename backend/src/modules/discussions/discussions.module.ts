import { Module } from '@nestjs/common';
import { DiscussionsService } from './discussions.service.js';
import { DiscussionsController } from './discussions.controller.js';

@Module({
  controllers: [DiscussionsController],
  providers: [DiscussionsService],
})
export class DiscussionsModule {}
