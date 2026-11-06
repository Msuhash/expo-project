import { Controller } from '@nestjs/common';
import { TeamService } from './team.service.js';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}
}
