import { Module } from '@nestjs/common';
import { RegistrationsService } from './registrations.service.js';
import { RegistrationsController } from './registrations.controller.js';

@Module({
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
})
export class RegistrationsModule {}
