import { Module } from '@nestjs/common';
import { ExhibitorsService } from './exhibitors.service.js';
import { ExhibitorsController } from './exhibitors.controller.js';

@Module({
  controllers: [ExhibitorsController],
  providers: [ExhibitorsService],
})
export class ExhibitorsModule {}
