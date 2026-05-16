// Force un environnement de test isolé : SQLite en mémoire pour ne pas polluer la BDD dev.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./prisma/test.db';
process.env.PORT = process.env.PORT ?? '0';
