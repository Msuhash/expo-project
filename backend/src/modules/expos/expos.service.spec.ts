import { Test, TestingModule } from '@nestjs/testing';
import { ExposService } from './expos.service.js';

describe('ExposService', () => {
  let service: ExposService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExposService],
    }).compile();

    service = module.get<ExposService>(ExposService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
