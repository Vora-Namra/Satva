import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password is too long")
    .regex(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      "Must include uppercase, lowercase, digit and special character",
    ),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const seedSuperAdminSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password is too long")
    .regex(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      "Must include uppercase, lowercase, digit and special character",
    ),
});

export type SeedSuperAdminInput = z.infer<typeof seedSuperAdminSchema>;

export const createAdminSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "First name is required")
    .max(50, "First name cannot exceed 50 characters"),

  last_name: z
    .string()
    .trim()
    .min(2, "Last name is required")
    .max(50, "Last name cannot exceed 50 characters"),

  email: z.string().trim().email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password is too long")
    .regex(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      "Must include uppercase, lowercase, digit and special character",
    ),

  hospital_id: z.coerce.number().int().positive("Hospital is required"),

  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;

export const updateAdminSchema = z
  .object({
    first_name: z.string().trim().min(2).max(50).optional(),

    last_name: z.string().trim().min(2).max(50).optional(),

    email: z.string().trim().email("Invalid email").optional(),

    hospital_id: z.coerce.number().int().positive().optional(),

    status: z.enum(["Active", "Inactive"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
