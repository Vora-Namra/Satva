import { z } from "zod";

export const appointment_list_query_schema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const book_appointment_schema = z.object({
  doctor_id: z.number().positive(),
  slot_date: z.string().date(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/),
  appointment_type: z.enum(["IN_PERSON", "TELEMEDICINE"]),
  chief_complaint: z.string().max(1000).optional(),
  amount: z.number().positive(),
  payment_method: z.string().min(2).max(50),
});

export const reschedule_appointment_schema = z.object({
  slot_date: z.string().date(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/),
});

export const cancel_appointment_schema = z.object({
  reason: z.string().min(3).max(500),
});

export const doctor_slots_schema = z.object({
  doctor_id: z.coerce.number().positive(),
  date: z.string().date(),
});
