import { Controller } from '@nestjs/common';
import { ActivityService } from './activity.service.js';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}
}
