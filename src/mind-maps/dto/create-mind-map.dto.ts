import { MindMapV1 } from './../models/mind-map.model';
import { MindMap } from '../entities/mind-map.entity';

export const createMindMapDto = (rawData: MindMap): Partial<MindMap> => {
  return {
    subject: rawData.subject,
    topic: rawData.topic,
    mindMap: rawData.mindMap as MindMapV1,
  };
};
