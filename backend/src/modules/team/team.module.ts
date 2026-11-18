import { Module } from '@nestjs/common';
import { TeamService } from './team.service.js';
import { TeamController } from './team.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { ExpoAccessGuard } from '../../common/guards/expo-access.guard.js';

@Module({
  imports: [AuthModule],
  controllers: [TeamController],
  providers: [TeamService, ExpoAccessGuard],
  exports: [TeamService]
})
export class TeamModule { }
