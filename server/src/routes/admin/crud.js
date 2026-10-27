import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError, notFound } from '../../utils/http.js';
import { escapeRegex } from '../../utils/helpers.js';

const toBool = (v) => (v === 'true' ? true : v === 'false' ? false : v);

/**
 * Generic admin CRUD router: list (search + filter + pagination), get, create, update, delete.
 * `prepare(data, existingDoc?)` can mutate data before save (e.g. add a slug).
 * `beforeDelete(doc)` can throw to block a delete.
 */
export function crudRouter({
  Model,
  createSchema,
  updateSchema,
  searchFields = ['name'],
  filterFields = [],
  sort = { createdAt: -1 },
  populate = [],
  prepare,
  beforeDelete,
  afterDelete,
}) {
  const router = Router();

  router.param('id', (_req, _res, next, id) =>
    /^[a-f\d]{24}$/i.test(id) ? next() : next(new HttpError(400, 'Invalid id'))
  );

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const filter = {};
      const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
      if (q) filter.$or = searchFields.map((f) => ({ [f]: { $regex: escapeRegex(q), $options: 'i' } }));
      for (const f of filterFields) {
        const v = req.query[f];
        if (typeof v === 'string' && v !== '') filter[f] = toBool(v);
      }
      const [items, total] = await Promise.all([
        Model.find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .populate(populate),
        Model.countDocuments(filter),
      ]);
      res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = await Model.findById(req.params.id).populate(populate);
      if (!doc) throw notFound();
      res.json({ item: doc });
    })
  );

  router.post(
    '/',
    validate(createSchema),
    asyncHandler(async (req, res) => {
      const data = prepare ? await prepare(req.body, null) : req.body;
      const doc = await Model.create(data);
      res.status(201).json({ item: doc });
    })
  );

  router.patch(
    '/:id',
    validate(updateSchema || createSchema.partial()),
    asyncHandler(async (req, res) => {
      const doc = await Model.findById(req.params.id);
      if (!doc) throw notFound();
      const data = prepare ? await prepare(req.body, doc) : req.body;
      doc.set(data);
      await doc.save();
      res.json({ item: doc });
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = await Model.findById(req.params.id);
      if (!doc) throw notFound();
      if (beforeDelete) await beforeDelete(doc);
      await doc.deleteOne();
      if (afterDelete) await afterDelete(doc);
      res.json({ ok: true });
    })
  );

  return router;
}
