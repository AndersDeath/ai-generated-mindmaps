import { InjectRepository } from '@nestjs/typeorm';
import { Mindmap } from '../entities/mindmaps.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class MindmapService {
  constructor(
    @InjectRepository(Mindmap)
    private readonly mindmapRepository: Repository<Mindmap>,
  ) {}

  save(mindmaps: Mindmap[]): Promise<Mindmap[]> {
    return this.mindmapRepository.save(mindmaps);
  }

  findAll(): Promise<Mindmap[]> {
    return this.mindmapRepository.find();
  }

  findOne(id: UUID): Promise<Mindmap | null> {
    return this.mindmapRepository.findOneBy({ id });
  }

  async remove(id: UUID): Promise<void> {
    await this.mindmapRepository.delete(id);
  }
}
