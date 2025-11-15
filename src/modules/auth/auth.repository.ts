import { prisma } from '../../lib/db.js';
import { UserStatus } from '@prisma/client';

/**
 * Authentication repository
 * Handles database operations for authentication
 */

export const authRepository = {
  /**
   * Create a new user
   */
  async createUser(data: { email: string; password: string; name: string }) {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  },

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  /**
   * Find user by ID
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        emailVerified: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
      },
    });
  },

  /**
   * Update user's failed login attempts
   */
  async updateFailedLoginAttempts(userId: string, attempts: number) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        lastFailedLoginAt: new Date(),
      },
    });
  },

  /**
   * Lock user account
   */
  async lockAccount(userId: string, lockUntil: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: lockUntil,
      },
    });
  },

  /**
   * Reset failed login attempts
   */
  async resetFailedLoginAttempts(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lastLoginAt: new Date(),
      },
    });
  },

  /**
   * Create password reset token
   */
  async createPasswordResetToken(data: { userId: string; token: string; expiresAt: Date }) {
    return prisma.passwordResetToken.create({
      data,
    });
  },

  /**
   * Find valid password reset token
   */
  async findPasswordResetToken(token: string) {
    return prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  },

  /**
   * Mark password reset token as used
   */
  async markTokenAsUsed(tokenId: string) {
    return prisma.passwordResetToken.update({
      where: { id: tokenId },
      data: { used: true },
    });
  },

  /**
   * Update user password
   */
  async updatePassword(userId: string, hashedPassword: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  },
};
