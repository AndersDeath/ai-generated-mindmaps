import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

import { OpenaiService } from './openai.service';
import { CsvService } from './csv.service';
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
@Controller('api/v1')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly openaiService: OpenaiService,
    private readonly csvService: CsvService,
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

    return this.csvService.parse(file);
  }

  @Get('callpoenai')
  callopenai(): Promise<string> {
    const subject = 'Biologie';
    const topic = 'Populationsökologie, Lotka-Volterra-Regeln';
    return this.openaiService.request(subject, topic);
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
