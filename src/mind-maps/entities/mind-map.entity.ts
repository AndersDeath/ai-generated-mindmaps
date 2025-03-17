import { UUID } from 'crypto';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class MindMap {
  @PrimaryGeneratedColumn('uuid')
  uuid: UUID;

  @Column()
  subject: string;

  @Column()
  topic: string;

  @Column('jsonb', { nullable: false, default: {} })
  mindMap: any;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  dataCreate?: Date;
}
