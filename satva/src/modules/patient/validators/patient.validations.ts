import { z } from "zod";

export const updateProfileSchema = z
  .object({
    first_name: z.string().trim().min(2).max(50).optional(),
    last_name: z.string().trim().min(2).max(50).optional(),
    address_line1: z.string().trim().optional(),
    address_line2: z.string().trim().optional(),
    blood_group: z.string().trim().max(10).optional(),
    is_insured: z.union([z.boolean(), z.number(), z.string()]).optional(),
    country_code: z.string().trim().optional(),
    mobile: z.string().trim().optional(),
    dob: z.string().trim().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    policy_number: z.string().trim().optional(),
    policy_company: z.string().trim().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const addFamilyMemberSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required").max(50),
  lastName: z.string().trim().min(2, "Last name is required").max(50),
  relation: z.string().trim().min(2, "Relation is required"),
  dob: z.string().trim().optional(),
  mobile: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email").optional(),
});

export type AddFamilyMemberInput = z.infer<typeof addFamilyMemberSchema>;

export const updateFamilyMemberSchema = z
  .object({
    first_name: z.string().trim().min(2).max(50).optional(),
    last_name: z.string().trim().min(2).max(50).optional(),
    relation: z.string().trim().min(2).optional(),
    dob: z.string().trim().optional(),
    mobile: z.string().trim().optional(),
    email: z.string().trim().email("Invalid email").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  });

export type UpdateFamilyMemberInput = z.infer<typeof updateFamilyMemberSchema>;

export const bookAppointmentSchema = z.object({
  doctorId: z.coerce.number().int().positive("Doctor ID is required"),
  slotDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, should be YYYY-MM-DD"),
  startTime: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format, should be HH:MM"),
  appointmentType: z.enum(["IN_PERSON", "TELEMEDICINE"]),
  chiefComplaint: z.string().trim().optional(),
  amount: z.coerce.number().positive("Amount is required"),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

export const rescheduleAppointmentSchema = z.object({
  slotDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, should be YYYY-MM-DD"),
  startTime: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format, should be HH:MM"),
});

export type RescheduleAppointmentInput = z.infer<
  typeof rescheduleAppointmentSchema
>;

export const cancelAppointmentSchema = z.object({
  reason: z.string().trim().min(5, "Please provide a valid reason").optional(),
});

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

export const searchDoctorsSchema = z.object({
  name: z.string().trim().optional(),
  specialty: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  hospitalId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export type SearchDoctorsInput = z.infer<typeof searchDoctorsSchema>;
