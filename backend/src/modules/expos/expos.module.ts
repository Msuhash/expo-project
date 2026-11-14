import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ExpoAccessGuard } from '../../common/guards/expo-access.guard.js';
import { ExposController } from './expos.controller.js';
import { ExposService } from './expos.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ExposController],
  providers: [ExposService, ExpoAccessGuard],
  exports: [ExposService, ExpoAccessGuard],
})
export class ExposModule {}
