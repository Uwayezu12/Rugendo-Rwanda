import { PrismaClient } from '@prisma/client';

// Singleton — reuse the same PrismaClient instance across the app
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

export default prisma;
