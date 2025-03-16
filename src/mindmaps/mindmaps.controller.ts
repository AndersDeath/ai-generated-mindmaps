import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

import { OpenaiService } from './services/openai.service';
import { CsvService } from './services/csv.service';
import { MindmapService } from './services/mindmap.service';
// import { MindmapService } from '../services/mindmap.service';
import { Mindmap } from './entities/mindmaps.entity';

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { Response } from 'express';
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
@Controller('api/v1')
export class MindmapsController {
  private readonly logger = new Logger(MindmapsController.name);

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly csvService: CsvService,
    private readonly mindmapService: MindmapService,
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
  async generate(@UploadedFile() file: UploadedFile, @Res() res: Response) {
    // TODO: Create file validator
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'text/csv') {
      throw new BadRequestException(
        'Invalid file type. Only CSV files are allowed.',
      );
    }

    const test = await this.openaiService.sendRequestsWithDelay(
      await this.csvService.parse(file),
    );
    test.map((a: { subject: string; topic: string; mindmap: string }) => ({
      id: uuidv4(),
      subject: a.subject,
      topic: a.topic,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mindmap: JSON.parse(a.mindmap) || '',
    }));

    await this.mindmapService.save(test as Mindmap[]);
    // console.log(saveResult);
    const filePath = await this.csvService.generateCsv([
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Doe', email: 'jane@example.com' },
    ]);

    res.download(filePath, 'data.csv', (err: Error) => {
      if (err) {
        throw new Error();
      }
      fs.unlinkSync(filePath);
    });
  }

  // @Get('download')
  // @ApiOperation({ summary: 'Download a CSV file' })
  // @ApiResponse({ status: 200, description: 'CSV file downloaded successfully' })
  // @ApiResponse({ status: 500, description: 'Internal server error' })
  // async downloadCsv(@Res() res: Response) {}

  @Get('callpoenai')
  callopenai(): Promise<any> {
    const subject = 'Biologie';
    const topic = 'Populationsökologie, Lotka-Volterra-Regeln';
    return this.openaiService.request(subject, topic);
  }

  @Get('mindmaps')
  mindmaps() {
    return this.mindmapService.findAll();
  }

  @Get('mindmaps/:id')
  mindmapsById(): string {
    return 's';
  }
}
