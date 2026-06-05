import prisma from '../../db';

export class AuthRepository {
  async findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  }
}

export const authRepository = new AuthRepository();
