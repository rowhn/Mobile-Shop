import { HttpError } from '../utils/http.js';

// Validates and replaces req[source] with the parsed (typed, stripped) value.
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
      const first = errors[0];
      return next(
        new HttpError(400, first ? `${first.path ? first.path + ': ' : ''}${first.message}` : 'Invalid input', errors)
      );
    }
    req[source] = result.data;
    next();
  };
