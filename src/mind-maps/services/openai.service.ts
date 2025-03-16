import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import OpenAI from 'openai';

interface MindMapV1 {
  subject: string;
  topic: string;
  schemaVersion: number;
  dateCreate: string;
  id: string;
  subtopics: SubTopicV1[];
}

interface SubTopicV1 {
  name: string;
  id: string;
  subtopics?: SubTopicV1[];
}

interface MindMapOpenAIResponse {
  subject: string;
  topic: string;
  mindMap: string;
  status: string;
}

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private client = new OpenAI({
    apiKey: this.apiKey,
  });

  private readonly mindMapModelV1: MindMapV1 = {
    subject: 'subject',
    topic: 'topic',
    schemaVersion: 1,
    dateCreate: 'ISO DateTime',
    id: 'UUID',
    subtopics: [
      {
        name: 'name',
        id: 'UUID',
        subtopics: [
          { name: 'name', id: 'UUID' },
          { name: 'name', id: 'UUID' },
        ],
      },
    ],
  };

  constructor() {}

  private buildPrompt(subject: string, topic: string): string {
    return `You are a professional teacher in ${subject}.
Your goal is to generate a mind map for the subject above with the focus on the ${topic} so that a student can improve their understanding of ${subject} and ${topic} while using that mind map.
The mind map should feature sub-topics of the ${topic}and no other content.
The result of your work must be a mind map in the form of JSON using the following data structure:
${JSON.stringify(this.mindMapModelV1)}
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
      return {
        subject: subject,
        topic: topic,
        mindMap: response.choices[0].message.content || '',
        status: 'Success',
      };
    } catch (error) {
      this.logger.error('OpenAI API error', error);
      return {
        subject: subject,
        topic: topic,
        mindMap: '',
        status: 'Failure',
      };
    }
  }
}
