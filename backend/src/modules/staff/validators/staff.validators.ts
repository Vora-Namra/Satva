import { z } from "zod";

export const paymentStatusSchema = z.object({
  status: z.enum(["SUCCESS"]).optional(),
});
