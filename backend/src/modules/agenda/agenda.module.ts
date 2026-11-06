import { Module } from '@nestjs/common';
import { AgendaService } from './agenda.service.js';
import { AgendaController } from './agenda.controller.js';

@Module({
  controllers: [AgendaController],
  providers: [AgendaService],
})
export class AgendaModule {}
