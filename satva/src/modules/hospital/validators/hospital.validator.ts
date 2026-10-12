import parsePhoneNumberFromString from "libphonenumber-js";
import z, { object } from "zod";

const phoneNumberSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      const phone = parsePhoneNumberFromString(value);
      return phone?.isValid() ?? false;
    },
    {
      message: "Please enter a valid phone number",
    },
  );

export const createHospitalSchema = z.object({
  hospital_name: z
    .string()
    .trim()
    .min(3, "Hospital name must be at least 3 characters")
    .max(100, "Hospital name cannot exceed 100 characters"),

  email: z.string().trim().email("Please enter a valid email address"),

  address_line1: z
    .string()
    .trim()
    .min(5, "Address Line 1 is required")
    .max(255, "Address Line 1 cannot exceed 255 characters"),

  address_line2: z
    .string()
    .trim()
    .max(255, "Address Line 2 cannot exceed 255 characters")
    .optional()
    .or(z.literal("")),

  contact_number: phoneNumberSchema,
});

export type CreateHospitalInput = z.infer<typeof createHospitalSchema>;

export const updateHospitalSchema = z
  .object({
    hospital_name: z.string().trim().min(3).max(100).optional(),

    email: z
      .string()
      .trim()
      .email("Please enter a valid email address")
      .optional(),

    address_line1: z.string().trim().min(5).max(255).optional(),

    address_line2: z.string().trim().max(255).optional(),

    contact_number: phoneNumberSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export type UpdateHospitalInput = z.infer<typeof updateHospitalSchema>;
