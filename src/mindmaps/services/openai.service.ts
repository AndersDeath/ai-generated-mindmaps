import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom } from 'rxjs';

interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
  request?: any;
}

interface OpenAiResponse {
  choices: { message: { content: string } }[]; // it covers only necessary part of the data structure that is important for the task
}

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly mindMapDataStructure = {
    subject: 'subject',
    topic: 'topic',
    subtopics: [
      {
        name: 'name',
        subtopics: [{ name: 'name' }, { name: 'name' }],
      },
    ],
  };

  constructor(private httpService: HttpService) {}

  private buildPrompt(subject: string, topic: string): string {
    return `You are a professional teacher in ${subject}.
Your goal is to generate a mind map for the subject above with the focus on the ${topic} so that a student can improve their understanding of ${subject} and ${topic} while using that mind map.
The mind map should feature sub-topics of the ${topic}and no other content.
The result of your work must be a mind map in the form of JSON using the following data structure:
${JSON.stringify(this.mindMapDataStructure)}
`;
  }

  async sendRequestsWithDelay(
    params: { subject: string; topic: string }[],
    delayMs?: number,
  ): Promise<
    {
      subject: string;
      topic: string;
      mindmap: string;
    }[]
  > {
    const results: {
      subject: string;
      topic: string;
      mindmap: string;
    }[] = [];

    for (const param of params) {
      try {
        const response: {
          subject: string;
          topic: string;
          mindmap: string;
        } = await this.request(param.subject, param.topic);
        results.push(response);
      } catch (error) {
        this.logger.error('OpenAI API error during bulk operation', error);
        throw new HttpException(
          'OpenAI API error during bulk operation',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (!delayMs) {
        // Wait for the delay before the next request
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  async request(
    subject: string,
    topic: string,
  ): Promise<{
    subject: string;
    topic: string;
    mindmap: string;
  }> {
    try {
      const response: AxiosResponse<OpenAiResponse> = await lastValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'user', content: this.buildPrompt(subject, topic) },
            ],
            max_tokens: 500,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return {
        subject: subject,
        topic: topic,
        mindmap: response.data.choices[0].message.content,
      };
    } catch (error) {
      this.logger.error('OpenAI API error', error);
      throw new HttpException(
        'OpenAI API error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
