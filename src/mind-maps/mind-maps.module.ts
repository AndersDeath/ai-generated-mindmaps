import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MindMap } from './entities/mind-map.entity';
import { MindMapsController } from './mind-maps.controller';
import { MindMapService } from './services/mind-map.service';
import { CsvService } from 'src/mind-maps/services/csv.service';
import { OpenaiService } from 'src/mind-maps/services/openai.service';

@Module({
  imports: [TypeOrmModule.forFeature([MindMap])],
  controllers: [MindMapsController],
  providers: [MindMapService, OpenaiService, CsvService],
})
export class MindMapsModule {}
