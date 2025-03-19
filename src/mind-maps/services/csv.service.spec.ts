import { Test, TestingModule } from '@nestjs/testing';
import { CsvService } from './csv.service';

jest.mock('fast-csv', () => ({
  parseString: jest.fn(),
  write: jest.fn().mockReturnValue({ pipe: jest.fn() }),
}));

jest.mock('fs', () => ({
  createWriteStream: jest.fn().mockReturnValue({ on: jest.fn() }),
}));

describe('CsvService', () => {
  let service: CsvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvService],
    }).compile();

    service = module.get<CsvService>(CsvService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
