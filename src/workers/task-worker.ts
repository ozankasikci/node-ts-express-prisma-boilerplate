import { Worker, Job } from 'bullmq';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';
import { tasksRepository } from '../modules/tasks/tasks.repository.js';
import { TaskStatus } from '@prisma/client';
import { connectDb, disconnectDb } from '../lib/db.js';
import { queueJobsTotal } from '../lib/metrics.js';

/**
 * BullMQ worker process
 * Processes background tasks from the queue
 */

interface TaskJobData {
  taskId: string;
  userId: string;
  parameters: Record<string, unknown>;
}

// Connect to database
await connectDb();

const connection = {
  host: new URL(config.redis.url).hostname,
  port: parseInt(new URL(config.redis.url).port || '6379'),
};

/**
 * Task processor
 * Handles different task types
 */
async function processTask(job: Job<TaskJobData>) {
  const { taskId, parameters } = job.data;

  logger.info({ taskId, jobId: job.id, type: job.name }, 'Processing task');

  try {
    // Update task status to PROCESSING
    await tasksRepository.updateStatus(taskId, TaskStatus.PROCESSING, {
      startedAt: new Date(),
    });

    // Process based on task type
    let result;
    switch (job.name) {
      case 'echo':
        result = await processEchoTask(job);
        break;
      case 'delay':
        result = await processDelayTask(job);
        break;
      default:
        throw new Error(`Unknown task type: ${job.name}`);
    }

    // Update task status to COMPLETED
    await tasksRepository.updateStatus(taskId, TaskStatus.COMPLETED, {
      completedAt: new Date(),
      progress: 100,
    });

    // Create task result
    await tasksRepository.createResult({
      taskId,
      outputPath: `/results/${taskId}.json`,
      metadata: result,
      storageSize: BigInt(JSON.stringify(result).length),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    queueJobsTotal.inc({ queue: 'tasks', status: 'completed' });
    logger.info({ taskId, jobId: job.id }, 'Task completed successfully');

    return result;
  } catch (error) {
    logger.error({ taskId, jobId: job.id, error }, 'Task failed');

    // Update task status to FAILED
    await tasksRepository.updateStatus(taskId, TaskStatus.FAILED, {
      completedAt: new Date(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    queueJobsTotal.inc({ queue: 'tasks', status: 'failed' });
    throw error;
  }
}

/**
 * Echo task processor
 * Simply returns the input parameters
 */
async function processEchoTask(job: Job<TaskJobData>) {
  const { parameters } = job.data;
  return {
    type: 'echo',
    input: parameters,
    processedAt: new Date().toISOString(),
  };
}

/**
 * Delay task processor
 * Waits for specified duration then completes
 */
async function processDelayTask(job: Job<TaskJobData>) {
  const { parameters } = job.data;
  const delay = (parameters.delay as number) || 5000; // Default 5 seconds

  await new Promise((resolve) => setTimeout(resolve, delay));

  return {
    type: 'delay',
    delay,
    processedAt: new Date().toISOString(),
  };
}

/**
 * Create and start worker
 */
const worker = new Worker('tasks', processTask, {
  connection,
  concurrency: config.worker.concurrency,
  autorun: true,
});

worker.on('ready', () => {
  logger.info('Worker ready');
});

worker.on('active', (job) => {
  logger.info({ jobId: job.id, type: job.name }, 'Job active');
  queueJobsTotal.inc({ queue: 'tasks', status: 'active' });
});

worker.on('completed', (job, result) => {
  logger.info({ jobId: job.id, type: job.name }, 'Job completed');
});

worker.on('failed', (job, error) => {
  if (job) {
    logger.error({ jobId: job.id, type: job.name, error }, 'Job failed');
  } else {
    logger.error({ error }, 'Job failed (no job data)');
  }
});

worker.on('error', (error) => {
  logger.error({ error }, 'Worker error');
});

/**
 * Graceful shutdown
 */
async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down worker');

  await worker.close();
  logger.info('Worker closed');

  await disconnectDb();

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

logger.info({ concurrency: config.worker.concurrency }, 'Task worker started');
