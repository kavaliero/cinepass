import { Router } from 'express';
import { z } from 'zod';
import { AGE_BRACKETS, FILM_STATUSES } from '@cinepass/shared';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/error.js';

export const filmsRouter: Router = Router();

const ListQuerySchema = z.object({
  ageBracket: z.enum(AGE_BRACKETS).optional(),
  status: z.enum(FILM_STATUSES).optional(),
  search: z.string().trim().optional(),
});

const UpdateFilmSchema = z.object({
  status: z.enum(FILM_STATUSES).optional(),
  notes: z.string().nullable().optional(),
});

const IdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * GET /api/films
 * Query: ?ageBracket=6-8&status=TO_WATCH&search=harry
 */
filmsRouter.get('/', async (req, res, next) => {
  try {
    const q = ListQuerySchema.parse(req.query);
    const films = await prisma.film.findMany({
      where: {
        ageBracket: q.ageBracket,
        status: q.status,
        title: q.search ? { contains: q.search } : undefined,
      },
      orderBy: [{ ageBracket: 'asc' }, { title: 'asc' }],
    });
    res.json({ films, count: films.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/films/stats
 * Compte par tranche d'âge et par statut.
 */
filmsRouter.get('/stats', async (_req, res, next) => {
  try {
    const [byBracket, byStatus, total] = await Promise.all([
      prisma.film.groupBy({ by: ['ageBracket'], _count: true }),
      prisma.film.groupBy({ by: ['status'], _count: true }),
      prisma.film.count(),
    ]);
    res.json({
      total,
      byBracket: Object.fromEntries(byBracket.map((b) => [b.ageBracket, b._count])),
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/films/:id
 * Met à jour status et/ou notes. Pose `watchedAt = now` quand status devient WATCHED.
 */
filmsRouter.patch('/:id', async (req, res, next) => {
  try {
    const { id } = IdParamSchema.parse(req.params);
    const patch = UpdateFilmSchema.parse(req.body);

    const existing = await prisma.film.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Film not found');

    const updated = await prisma.film.update({
      where: { id },
      data: {
        ...patch,
        watchedAt:
          patch.status === 'WATCHED' && existing.status !== 'WATCHED'
            ? new Date()
            : patch.status && patch.status !== 'WATCHED'
              ? null
              : undefined,
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
