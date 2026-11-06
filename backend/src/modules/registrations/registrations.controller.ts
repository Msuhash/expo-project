import { Controller } from '@nestjs/common';
import { RegistrationsService } from './registrations.service.js';

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}
}
