/**
 * Task Test Fixtures
 * Provides factory functions for creating test task data
 */

export interface TaskFixture {
  id?: string;
  title: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed';
  userId: string;
}

/**
 * Create default test task data
 */
export function createTaskData(userId: string, overrides?: Partial<TaskFixture>): TaskFixture {
  return {
    title: 'Test Task',
    description: 'This is a test task',
    status: 'pending',
    userId,
    ...overrides,
  };
}

/**
 * Create multiple test tasks for a user
 */
export function createMultipleTasks(userId: string, count: number): TaskFixture[] {
  return Array.from({ length: count }, (_, i) => ({
    title: `Test Task ${i + 1}`,
    description: `Description for task ${i + 1}`,
    status: 'pending' as const,
    userId,
  }));
}

/**
 * Create task with different statuses
 */
export function createTasksByStatus(userId: string) {
  return {
    pending: createTaskData(userId, { title: 'Pending Task', status: 'pending' }),
    inProgress: createTaskData(userId, { title: 'In Progress Task', status: 'in-progress' }),
    completed: createTaskData(userId, { title: 'Completed Task', status: 'completed' }),
  };
}

/**
 * Create task with missing required fields
 */
export function createTaskWithMissingFields(): Partial<TaskFixture> {
  return {
    // Missing title and userId
    description: 'Task without required fields',
  };
}

/**
 * Create task with invalid data
 */
export function createTaskWithInvalidData(userId: string): Partial<TaskFixture> {
  return {
    title: '', // Empty title
    userId,
  };
}

/**
 * Create task for update testing
 */
export function createTaskUpdateData(): Partial<TaskFixture> {
  return {
    title: 'Updated Task Title',
    description: 'Updated description',
    status: 'in-progress',
  };
}

/**
 * Create task with long description
 */
export function createTaskWithLongDescription(userId: string): TaskFixture {
  return {
    title: 'Task with Long Description',
    description: 'A'.repeat(1000), // Very long description
    status: 'pending',
    userId,
  };
}

/**
 * Create task with minimal data
 */
export function createMinimalTask(userId: string): Omit<TaskFixture, 'id' | 'description' | 'status'> {
  return {
    title: 'Minimal Task',
    userId,
  };
}
