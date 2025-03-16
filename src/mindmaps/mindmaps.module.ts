import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mindmap } from './entities/mindmaps.entity';
import { MindmapsController } from './mindmaps.controller';
import { MindmapService } from './services/mindmap.service';
import { CsvService } from 'src/mindmaps/services/csv.service';
import { OpenaiService } from 'src/mindmaps/services/openai.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([Mindmap]), HttpModule],
  controllers: [MindmapsController],
  providers: [MindmapService, OpenaiService, CsvService],
})
export class MindmapsModule {}
