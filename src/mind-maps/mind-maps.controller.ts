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
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

import { OpenaiService } from './services/openai.service';
import { CsvService } from './services/csv.service';
import { MindMapService } from './services/mind-map.service';
import { MindMap } from './entities/mind-map.entity';
import { Response } from 'express';
import { UUID } from 'crypto';
import { MIND_MAP_CREATION_STATUS } from './models/mind-map.model';
import { createMindMapDto } from './dto/create-mind-map.dto';
import { UploadedCsvFile } from './models/files.model';

@Controller('api/v1')
export class MindMapsController {
  private readonly logger = new Logger(MindMapsController.name);

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly csvService: CsvService,
    private readonly mindMapService: MindMapService,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Upload CSV file for building mindmaps jsons' })
  @ApiResponse({
    status: 200,
    description: 'CSV file uploaded and mindmaps generated successfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
  async generate(@UploadedFile() file: UploadedCsvFile, @Res() res: Response) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'text/csv') {
      throw new BadRequestException(
        'Invalid file type. Only CSV files are allowed.',
      );
    }
    const parseResult = await this.csvService.parse(file);

    const mindMapOpenAiResponses =
      await this.openaiService.sendRequestsWithDelay(parseResult.results);

    await this.mindMapService.save(
      mindMapOpenAiResponses
        .filter((a) => a.status === MIND_MAP_CREATION_STATUS.SUCCESS)
        .map((a) => {
          return createMindMapDto({
            subject: a.subject,
            topic: a.topic,
            mindMap: a.mindMap,
          } as MindMap);
        }),
    );

    const filePath = await this.csvService.generateCsv(
      mindMapOpenAiResponses.map((a) => ({
        subject: a.subject,
        status: a.status,
      })),
    );

    res.download(filePath, 'data.csv', (err: Error) => {
      if (err) {
        throw new BadRequestException('Report cvs file generation failed', err);
      }
    });
  }

  @Get('mindmaps')
  @ApiOperation({ summary: 'Get all generated mindmaps' })
  @ApiResponse({
    status: 200,
    description: 'All mindmaps where returned successfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  mindMaps() {
    return this.mindMapService.findAll();
  }

  @Get('mindmaps/:uuid')
  @ApiOperation({ summary: 'Get generated mindmap by uuid' })
  @ApiResponse({
    status: 200,
    description: 'All mindmaps where returned successfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiParam({
    name: 'uuid',
    required: true,
    description: 'uuid of the mindmap',
    schema: { oneOf: [{ type: 'string' }] },
  })
  mindMapsById(@Param() params: { uuid: string }) {
    return this.mindMapService.findOne(params.uuid as UUID);
  }

  @Get('health')
  @ApiOperation({ summary: 'Service Health Check' })
  @ApiResponse({
    status: 200,
    description: 'Service works fine',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  healthCheck() {
    return { status: 'ok' };
  }
}
