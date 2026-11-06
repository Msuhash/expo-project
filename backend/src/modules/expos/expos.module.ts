import { Module } from '@nestjs/common';
import { ExposService } from './expos.service.js';
import { ExposController } from './expos.controller.js';

@Module({
  controllers: [ExposController],
  providers: [ExposService],
})
export class ExposModule {}
