import { Controller } from '@nestjs/common';
import { AgendaService } from './agenda.service.js';

@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}
}
