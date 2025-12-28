import { z } from 'zod';

export const SkiptestValidations = {
  create: z.object({
    name: z.string(),
  }),

  update: z.object({
    name: z.string().optional(),
  }),
};
