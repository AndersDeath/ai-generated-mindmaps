import { createMindMapOpenAIResponseDto } from './../dto/create-mind-map-openai-response.dto';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import OpenAI from 'openai';
import {
  MIND_MAP_CREATION_STATUS,
  MindMapOpenAIResponse,
  MindMapV1,
} from '../models/mind-map.model';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private client = new OpenAI({
    apiKey: this.apiKey,
  });

  constructor() {}

  private buildPrompt(subject: string, topic: string): string {
    const mindMapModelV1: MindMapV1 = {
      subject: 'subject',
      topic: 'topic',
      schemaVersion: 1,
      subtopics: [
        {
          name: 'name',
          subtopics: [{ name: 'name' }, { name: 'name' }],
        },
      ],
    };
    return `You are a professional teacher in ${subject}.
Your goal is to generate a mind map for the subject above with the focus on the ${topic} so that a student can improve their understanding of ${subject} and ${topic} while using that mind map.
The mind map should feature sub-topics of the ${topic}and no other content.
The result of your work must be a mind map in the form of JSON using the following data structure:
${JSON.stringify(mindMapModelV1)}
`;
  }

  async sendRequestsWithDelay(
    params: { subject: string; topic: string }[],
    delayMs?: number,
  ): Promise<MindMapOpenAIResponse[]> {
    const results: MindMapOpenAIResponse[] = [];

    for (const param of params) {
      try {
        const response: MindMapOpenAIResponse = await this.request(
          param.subject,
          param.topic,
        );
        results.push(response);
      } catch (error) {
        this.logger.error('OpenAI API error during bulk operation', error);
        throw new HttpException(
          'OpenAI API error during bulk operation',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (!delayMs) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  async request(
    subject: string,
    topic: string,
  ): Promise<MindMapOpenAIResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: this.buildPrompt(subject, topic) }],
      });
      return createMindMapOpenAIResponseDto({
        subject: subject,
        topic: topic,
        mindMap: JSON.parse(
          response.choices[0].message.content || '{}',
        ) as MindMapV1,
        status: MIND_MAP_CREATION_STATUS.SUCCESS,
      });
    } catch (error) {
      this.logger.error('OpenAI API error', error);
      return createMindMapOpenAIResponseDto({
        subject: subject,
        topic: topic,
        mindMap: null,
        status: MIND_MAP_CREATION_STATUS.FAILURE,
      });
    }
  }
}
