import { InjectRepository } from '@nestjs/typeorm';
import { MindMap } from '../entities/mind-map.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class MindMapService {
  constructor(
    @InjectRepository(MindMap)
    private readonly mindMapRepository: Repository<MindMap>,
  ) {}

  save(mindMaps: Partial<MindMap>[]): Promise<MindMap[]> {
    return this.mindMapRepository.save(mindMaps);
  }

  findAll(): Promise<MindMap[]> {
    return this.mindMapRepository.find();
  }

  findOne(uuid: UUID): Promise<MindMap | null> {
    return this.mindMapRepository.findOneBy({ uuid });
  }

  async remove(uuid: string): Promise<void> {
    await this.mindMapRepository.delete(uuid);
  }
}
