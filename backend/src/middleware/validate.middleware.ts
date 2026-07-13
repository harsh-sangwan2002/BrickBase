import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiException } from './errorHandler.middleware';

type Target = 'body' | 'query' | 'params';

export function validate(schema: AnyZodObject, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req[target] = schema.parse(req[target]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        throw new ApiException(400, 'VALIDATION_ERROR', message);
      }
      throw err;
    }
  };
}
