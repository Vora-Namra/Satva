import { error } from "console";
import { z } from "zod";

export const update_patient_profile_schema = z.object({
  first_name: z.string().min(2).max(100).optional(),
  last_name: z.string().min(2).max(100).optional(),

  address_line1: z.string().max(255).optional(),
  address_line2: z.string().max(255).optional(),

  blood_group: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional(),

  profile_path: z.string().optional(),

  is_insured: z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
    .transform((v) => v === true || v === "true" || v === "1")
    .optional(),
  policy_number: z.string().max(100).optional(),
  policy_company: z.string().max(150).optional(),
  policy_document_path: z.string().optional(),
});

export const add_family_member_schema = z.object({
  relation: z.string().min(2).max(50),
  first_name: z.string().min(2).max(100),
  last_name: z.string().min(2).max(100),

  dob: z.string().date().nullish(),

  mobile: z
    .string()
    .regex(/^[0-9]{10,15}$/)
    .nullish(),
  email: z.string().email().nullish(),
});

export const update_family_member_schema = add_family_member_schema.partial();

export const pagination_query_schema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const search_doctors_schema = z.object({
  name: z.string().optional(),
  specialty: z.string().optional(),

  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),

  hospital_id: z.coerce.number().positive().optional(),

  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),

  offset: z.coerce.number().min(0).optional(),
});

export const doctor_slots_schema = z.object({
  doctor_id: z.coerce.number().positive(),
  date: z.string().date(),
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

export const notification_query_schema = z.object({
  unread: z.enum(["true", "false"]).optional(),
});
