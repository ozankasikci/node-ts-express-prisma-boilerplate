import { prisma } from '../setup';
import { hash } from 'bcrypt';

/**
 * Seed database with test user
 */
export async function seedUser(userData: {
  id?: string;
  email: string;
  password: string;
  name: string;
}) {
  const hashedPassword = await hash(userData.password, 10);

  const user = await prisma.user.create({
    data: {
      id: userData.id,
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
    },
  });

  return { ...user, password: hashedPassword };
}

/**
 * Seed database with test task
 */
export async function seedTask(taskData: {
  id?: string;
  type: string;
  userId: string;
  parameters?: any;
  status?: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
}) {
  const task = await prisma.task.create({
    data: {
      id: taskData.id,
      type: taskData.type,
      userId: taskData.userId,
      parameters: taskData.parameters || {},
      status: taskData.status || 'QUEUED',
    },
  });

  return task;
}

/**
 * Clear all users from database
 */
export async function clearUsers() {
  await prisma.user.deleteMany();
}

/**
 * Clear all tasks from database
 */
export async function clearTasks() {
  await prisma.task.deleteMany();
}

/**
 * Clear all data from database
 */
export async function clearDatabase() {
  await prisma.taskResult.deleteMany();
  await prisma.task.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Get user by email from database
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Get user by ID from database
 */
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

/**
 * Get task by ID from database
 */
export async function getTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
  });
}

/**
 * Get all tasks for a user
 */
export async function getTasksByUserId(userId: string) {
  return prisma.task.findMany({
    where: { userId },
  });
}

/**
 * Count total users in database
 */
export async function countUsers(): Promise<number> {
  return prisma.user.count();
}

/**
 * Count total tasks in database
 */
export async function countTasks(): Promise<number> {
  return prisma.task.count();
}
