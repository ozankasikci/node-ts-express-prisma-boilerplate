/**
 * TypeScript interfaces for tasks module
 */

export interface TaskSubmitInput {
  type: string;
  parameters: Record<string, unknown>;
  priority?: number;
}

export interface TaskResponse {
  id: string;
  type: string;
  status: string;
  priority: number;
  progress: number;
  submittedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface TaskResultResponse {
  id: string;
  taskId: string;
  outputPath: string;
  metadata: Record<string, unknown>;
  storageSize: bigint;
  createdAt: Date;
  expiresAt: Date;
}
