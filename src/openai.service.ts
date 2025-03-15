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

  async request(subject: string, topic: string): Promise<string> {
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
      console.log(response.data.choices[0].message.content);
      return response.data.choices[0].message.content;
    } catch (error) {
      this.logger.error('OpenAI API error', error);
      throw new HttpException(
        'OpenAI API error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
