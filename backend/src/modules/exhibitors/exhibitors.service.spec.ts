import { Test, TestingModule } from '@nestjs/testing';
import { ExhibitorsService } from './exhibitors.service.js';

describe('ExhibitorsService', () => {
  let service: ExhibitorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExhibitorsService],
    }).compile();

    service = module.get<ExhibitorsService>(ExhibitorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
