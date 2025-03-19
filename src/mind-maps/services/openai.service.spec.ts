import { Test, TestingModule } from '@nestjs/testing';
import { OpenaiService } from './openai.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import OpenAI from 'openai';
import { createMindMapOpenAIResponseDto } from './../dto/create-mind-map-openai-response.dto';
import { MIND_MAP_CREATION_STATUS } from '../models/mind-map.model';

jest.mock('openai');

describe('OpenaiService', () => {
  let service: OpenaiService;
  let mockOpenAIClient;

  beforeEach(async () => {
    mockOpenAIClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (OpenAI as unknown as jest.Mock).mockImplementation(() => mockOpenAIClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenaiService],
    }).compile();

    service = module.get<OpenaiService>(OpenaiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildPrompt', () => {
    it('should generate a valid prompt string', () => {
      const subject = 'Math';
      const topic = 'Algebra';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const prompt = (service as any).buildPrompt(subject, topic);
      expect(prompt).toContain(subject);
      expect(prompt).toContain(topic);
    });
  });

  describe('request', () => {
    it('should return a successful mind map response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                subject: 'Math',
                topic: 'Algebra',
                schemaVersion: 1,
                subtopics: [{ name: 'Equations' }],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.request('Math', 'Algebra');

      expect(result.status).toBe(MIND_MAP_CREATION_STATUS.SUCCESS);
      expect(result.mindMap).toHaveProperty('subject', 'Math');
      expect(result.mindMap).toHaveProperty('topic', 'Algebra');
    });

    it('should return a failure status on error', async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValue(
        new Error('API Error'),
      );

      const result = await service.request('Math', 'Algebra');

      expect(result.status).toBe(MIND_MAP_CREATION_STATUS.FAILURE);
      expect(result.mindMap).toBeNull();
    });
  });

  describe('sendRequestsWithDelay', () => {
    it('should process multiple requests with delay', async () => {
      jest.spyOn(service, 'request').mockResolvedValue(
        createMindMapOpenAIResponseDto({
          subject: 'Math',
          topic: 'Algebra',
          mindMap: null,
          status: MIND_MAP_CREATION_STATUS.SUCCESS,
        }),
      );

      const params = [
        { subject: 'Math', topic: 'Algebra' },
        { subject: 'Physics', topic: 'Mechanics' },
      ];

      const results = await service.sendRequestsWithDelay(params, 10);

      expect(results).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.request).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if a request fails', async () => {
      jest.spyOn(service, 'request').mockRejectedValue(new Error('API Error'));
      const params = [{ subject: 'Math', topic: 'Algebra' }];

      await expect(service.sendRequestsWithDelay(params, 10)).rejects.toThrow(
        new HttpException(
          'OpenAI API error during bulk operation',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});
