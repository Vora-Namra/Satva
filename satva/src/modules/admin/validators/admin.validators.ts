import { z } from "zod";

export const addDoctorSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required").max(50),
  lastName: z.string().trim().min(2, "Last name is required").max(50),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password is too long")
    .regex(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      "Must include uppercase, lowercase, digit and special character"
    ),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "Male", "Female", "Other", "male", "female", "other"]).transform(val => val.toUpperCase()),
  bio: z.string().trim().optional(),
  consultationFee: z.coerce.number().positive("Fee must be greater than 0"),
  experienceYears: z.coerce.number().int().nonnegative("Experience must be 0 or more"),
  specialties: z.array(z.coerce.number().int().positive()).optional(),
  qualifications: z.array(
    z.object({
      degree: z.string().trim().min(1, "Degree is required"),
      college_name: z.string().trim().min(1, "College name is required"),
      graduation_year: z.coerce.number().int().optional().nullable(),
    })
  ).optional(),
});

export const editDoctorSchema = z.object({
  firstName: z.string().trim().min(2).max(50).optional(),
  lastName: z.string().trim().min(2).max(50).optional(),
  email: z.string().trim().email("Invalid email").optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "OTHERS", "Male", "Female", "Other", "male", "female", "other"]).optional().transform(val => val ? val.toUpperCase() : val),
  bio: z.string().trim().optional(),
  consultationFee: z.coerce.number().positive().optional(),
  experienceYears: z.coerce.number().int().nonnegative().optional(),
  specialties: z.array(z.coerce.number().int().positive()).optional(),
  qualifications: z.array(
    z.object({
      degree: z.string().trim().min(1, "Degree is required"),
      college_name: z.string().trim().min(1, "College name is required"),
      graduation_year: z.coerce.number().int().optional().nullable(),
    })
  ).optional(),
});

export const toggleDoctorStatusSchema = z.object({
  is_deactivated: z.union([z.boolean(), z.coerce.number()]),
});

export const updateHospitalSettingsSchema = z.object({
  hospital_name: z.string().trim().min(2, "Hospital name is required").max(100),
  email: z.string().trim().email("Please enter a valid email address"),
  address_line1: z.string().trim().min(1, "Address is required"),
  address_line2: z.string().trim().optional(),
  contact_number: z.string().trim().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
});

export const addStaffSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required").max(50),
  lastName: z.string().trim().min(2, "Last name is required").max(50),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password is too long")
    .regex(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      "Must include uppercase, lowercase, digit and special character"
    ),
  gender: z.enum(["MALE", "FEMALE", "OTHERS", "OTHER", "Male", "Female", "Other", "male", "female", "other"]).transform(val => val.toUpperCase()),
  dob: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date of birth format",
  }),
  staff_role: z.enum(["RECEPTIONIST", "NURSE", "Receptionist", "Nurse"]).transform(val => val.toUpperCase()),
  contact_number: z.string().trim().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
  address_line1: z.string().trim().min(1, "Address is required"),
  address_line2: z.string().trim().optional(),
});