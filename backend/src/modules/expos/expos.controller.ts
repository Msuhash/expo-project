import { Controller } from '@nestjs/common';
import { ExposService } from './expos.service.js';

@Controller('expos')
export class ExposController {
  constructor(private readonly exposService: ExposService) {}
}
