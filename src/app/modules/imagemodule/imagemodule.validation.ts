import { z } from 'zod';

export const ImagemoduleValidations = {
  create: z.object({
    image: z.string(),
  }),

  update: z.object({
    image: z.string().optional(),
  }),
};
