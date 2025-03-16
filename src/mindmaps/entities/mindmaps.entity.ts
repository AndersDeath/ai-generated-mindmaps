import { UUID } from 'crypto';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Mindmap {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column()
  subject: string;

  @Column()
  topic: string;

  @Column('jsonb', { nullable: false, default: {} })
  mindmap: any;
}
