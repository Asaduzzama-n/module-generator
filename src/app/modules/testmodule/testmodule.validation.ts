import { z } from 'zod';

export const TestmoduleValidations = {
  create: z.object({
    name: z.string(),
    email: z.string(),
  }),

  update: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
  }),
};
