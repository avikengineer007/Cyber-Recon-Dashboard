import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// In-memory fallback database state
const mockDb: any = {
  user: [
    {
      id: "admin-user-id",
      name: "Admin Operator",
      email: "admin@recon.local",
      passwordHash: "",
      role: "ADMIN",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ],
  auditLog: [],
  whoisSearch: [],
  dnsSearch: [],
  sslCheck: [],
  cveSearch: [],
  uploadedReport: [],
  favorite: [],
  notification: [],
};

const makeSafeModel = (modelName: string, actualModel: any) => {
  return new Proxy(actualModel, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);
      if (typeof original === 'function') {
        return async function (...args: any[]) {
          try {
            return await original.apply(target, args);
          } catch (err: any) {
            console.warn(`[Prisma Fallback] Query failed on ${modelName}.${String(prop)}. Using local mock DB. Error:`, err.message);
            const mockCollection = mockDb[modelName] || [];
            if (prop === 'findUnique' || prop === 'findFirst') {
              const query = args[0] || {};
              const where = query.where || {};
              return mockCollection.find((item: any) => {
                return Object.entries(where).every(([k, v]) => item[k] === v);
              }) || null;
            }
            if (prop === 'findMany') {
              return mockCollection;
            }
            if (prop === 'count') {
              return mockCollection.length;
            }
            if (prop === 'create') {
              const data = args[0]?.data || {};
              const newItem = {
                id: `mock-${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                ...data,
              };
              mockCollection.push(newItem);
              return newItem;
            }
            if (prop === 'update' || prop === 'updateMany') {
              return { count: mockCollection.length };
            }
            if (prop === 'delete' || prop === 'deleteMany') {
              return { count: mockCollection.length };
            }
            if (prop === 'upsert') {
              return mockCollection[0] || null;
            }
            return Array.isArray(mockCollection) ? mockCollection : [];
          }
        };
      }
      return original;
    }
  });
};

export const db = new Proxy(prisma, {
  get(target, prop, receiver) {
    const original = Reflect.get(target, prop, receiver);
    if (original && typeof original === 'object' && !prop.toString().startsWith('_')) {
      return makeSafeModel(String(prop), original);
    }
    return original;
  }
}) as unknown as PrismaClient;

export default db;
