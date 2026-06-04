import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({});

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword,
    },
    create: {
      name: 'Quản Trị Viên',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
    },
  });

  console.log('Đã tạo/cập nhật tài khoản Admin:', admin.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
