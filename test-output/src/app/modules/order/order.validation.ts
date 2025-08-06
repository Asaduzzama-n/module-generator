import { z } from 'zod';

const itemsItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
});

export const OrderValidations = {
  create: z.object({
    customer: z.string(),
    items: z.array(itemsItemSchema),
    status: z.string(),
    totalAmount: z.number(),
  }),

  update: z.object({
    customer: z.string().optional(),
    items: z.array(itemsItemSchema).optional(),
    status: z.string().optional(),
    totalAmount: z.number().optional(),
  }),
};
