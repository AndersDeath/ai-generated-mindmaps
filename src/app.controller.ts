import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

import { parse } from 'csv-parse';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

type CsvRow = {
  topic: string;
  subject: string;
};

interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
  request?: any;
}

@Controller('api/v1')
export class AppController {
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly httpService: HttpService,
  ) {}

  @Post('generate')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async generate(@UploadedFile() file: UploadedFile) {
    // TODO: Create file validator
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'text/csv') {
      throw new BadRequestException(
        'Invalid file type. Only CSV files are allowed.',
      );
    }

    const result = await this.csvParser(file);

    return result;
  }

  csvParser(file: UploadedFile) {
    return new Promise((resolve, reject) => {
      try {
        parse(
          file.buffer,
          {
            delimiter: ',',
          },
          (error, result: CsvRow[]) => {
            if (error) {
              console.error(error);
            }
            result.shift(); // remove titles of csv file
            resolve(result);
          },
        );
      } catch (e: any) {
        reject(new Error(e));
      }
    });
  }

  @Get('callpoenai')
  async callopenai(): Promise<string> {
    const subject = 'Biologie';
    const topic = 'Populationsökologie, Lotka-Volterra-Regeln';

    const mind_map_data_structure = {
      subject: 'subject',
      topic: 'topic',
      subtopics: [
        {
          name: 'name',
          subtopics: [{ name: 'name' }, { name: 'name' }],
        },
      ],
    };

    const prompt = `You are a professional teacher in ${subject}.
Your goal is to generate a mind map for the subject above with the focus on the ${topic} so that a student can improve their understanding of ${subject} and ${topic} while using that mind map.
The mind map should feature sub-topics of the ${topic}and no other content.
The result of your work must be a mind map in the form of JSON using the following data structure:
${JSON.stringify(mind_map_data_structure)}
`;

    try {
      const response: AxiosResponse<{
        choices: { message: { content: string } }[];
      }> = await lastValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
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

    return this.appService.generate();
  }

  @Get('mindmaps')
  mindmaps(): string {
    return this.appService.generate();
  }

  @Get('mindmaps/:id')
  mindmapsById(): string {
    return this.appService.generate();
  }
}
