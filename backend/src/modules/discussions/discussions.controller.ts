import { Controller } from '@nestjs/common';
import { DiscussionsService } from './discussions.service.js';

@Controller('discussions')
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}
}
