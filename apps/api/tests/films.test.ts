import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { execSync } from 'node:child_process';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();

beforeAll(() => {
  // Reset la BDD de test avant la suite (rapide car SQLite local)
  execSync('pnpm prisma migrate reset --force --skip-seed', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });
});

describe('Films CRUD', () => {
  it('lists empty films initially', async () => {
    const res = await request(app).get('/api/films');
    expect(res.status).toBe(200);
    expect(res.body.films).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  it('updates a film status', async () => {
    const film = await prisma.film.create({
      data: {
        title: 'Test Film',
        year: 2020,
        director: 'Test Director',
        ageBracket: '6-8',
      },
    });
    const res = await request(app)
      .patch(`/api/films/${String(film.id)}`)
      .send({ status: 'WATCHED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('WATCHED');
    expect(res.body.watchedAt).not.toBeNull();
  });

  it('returns 404 for unknown film', async () => {
    const res = await request(app).patch('/api/films/999999').send({ status: 'WATCHED' });
    expect(res.status).toBe(404);
  });

  it('rejects invalid status', async () => {
    const film = await prisma.film.create({
      data: {
        title: 'Another Film',
        year: 2021,
        director: 'X',
        ageBracket: '9-12',
      },
    });
    const res = await request(app)
      .patch(`/api/films/${String(film.id)}`)
      .send({ status: 'INVALID' });
    expect(res.status).toBe(400);
  });
});
