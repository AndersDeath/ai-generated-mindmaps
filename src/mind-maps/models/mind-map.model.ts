export interface MindMapV1 {
  subject: string;
  topic: string;
  schemaVersion: number;
  subtopics: SubTopicV1[];
}

export interface SubTopicV1 {
  name: string;
  subtopics?: SubTopicV1[];
}

export interface MindMapOpenAIResponse {
  subject: string;
  topic: string;
  mindMap: MindMapV1 | null;
  status: MIND_MAP_CREATION_STATUS;
}

export enum MIND_MAP_CREATION_STATUS {
  SUCCESS = 'Success',
  FAILURE = 'Failure',
}
