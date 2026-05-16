// Force un environnement de test isolé : SQLite en mémoire pour ne pas polluer la BDD dev.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./prisma/test.db';
// PORT inutile en tests (supertest injecte directement, pas de listen()), mais
// la config zod le valide a l'import. On met un port valide pour ne pas crasher.
process.env.PORT = process.env.PORT ?? '3099';
