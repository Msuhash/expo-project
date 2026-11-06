import { Controller } from '@nestjs/common';
import { ExhibitorsService } from './exhibitors.service.js';

@Controller('exhibitors')
export class ExhibitorsController {
  constructor(private readonly exhibitorsService: ExhibitorsService) {}
}
