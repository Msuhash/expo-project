import { Test, TestingModule } from '@nestjs/testing';
import { ExposController } from './expos.controller.js';
import { ExposService } from './expos.service.js';

describe('ExposController', () => {
  let controller: ExposController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExposController],
      providers: [ExposService],
    }).compile();

    controller = module.get<ExposController>(ExposController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
