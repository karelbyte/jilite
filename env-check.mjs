import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const cols = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name='File' ORDER BY ordinal_position`);
  const names = cols.map((c) => c.column_name).join(', ');
  console.log('File columns:', names);
} finally {
  await prisma.$disconnect();
}
