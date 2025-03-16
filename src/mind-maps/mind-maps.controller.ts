import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';

import { OpenaiService } from './services/openai.service';
import { CsvService } from './services/csv.service';
import { MindMapService } from './services/mind-map.service';
import { MindMap } from './entities/mind-map.entity';

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { Response } from 'express';
import { UUID } from 'crypto';
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
@Controller('api/v1')
export class MindMapsController {
  private readonly logger = new Logger(MindMapsController.name);

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly csvService: CsvService,
    private readonly mindMapService: MindMapService,
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
    test.map((a: { subject: string; topic: string; mindMap: string }) => ({
      id: uuidv4(),
      subject: a.subject,
      topic: a.topic,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mindMap: JSON.parse(a.mindMap) || '',
    }));

    await this.mindMapService.save(
      test
        .filter((a) => a.status === 'Success')
        .map((a) => ({
          subject: a.subject,
          topic: a.topic,
          mindMap: a.mindMap,
        })) as unknown as MindMap[],
    );
    const filePath = await this.csvService.generateCsv(
      test.map((a) => ({
        subject: a.subject,
        topic: a.topic,
        status: a.status,
      })),
    );

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

  @Get('mindmaps')
  mindMaps() {
    return this.mindMapService.findAll();
  }

  @Get('mindmaps/:id')
  @ApiParam({
    name: 'id',
    required: true,
    description:
      'either an integer for the project id or a string for the project name',
    schema: { oneOf: [{ type: 'string' }] },
  })
  mindMapsById(@Param() params: { id: string }) {
    return this.mindMapService.findOne(params.id as UUID);
  }
}
