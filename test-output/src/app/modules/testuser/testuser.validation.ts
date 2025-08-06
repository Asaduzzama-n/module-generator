import { z } from 'zod';

export const TestuserValidations = {
  create: z.object({
    name: z.string(),
    email: z.string(),
    age: z.number(),
    status: z.string(),
  }),

  update: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    age: z.number().optional(),
    status: z.string().optional(),
  }),
};
