import z from "zod";
//! Install this library for phone number validation for internation users. Please do npm install
import { isValidPhoneNumber } from "libphonenumber-js";
export const userRegisterSchema = z
  .object({
    first_name: z.string().trim().min(1, "Fitst name is required "),
    last_name: z.string().trim().min(1, "Last name is required"),
    country_code: z
      .string()
      .regex(
        /^\+[1-9]\d{0,2}$/,
        "Country code must start with + followed by digits",
      ),
    mobile: z.string().trim().min(1, "Phone number is required"),
    address_line1: z
      .string()
      .trim()
      .min(1, "First Line of address is required"),
    address_line2: z.string().trim().optional(),
    email: z.string().trim().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(50, "Password is too long")
      .regex(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
        "Must include uppercase, lowercase, digit and special character",
      ),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], {
      message: "Please select a valid gender",
    }),
    dob: z.coerce
      .date()
      .min(new Date("1900-01-01"), {
        message: "Date of birth must be after 1900",
      })
      .max(new Date(), { message: "Date of birth cannot be in the future" }),
  })
  .refine((data) => isValidPhoneNumber(`${data.country_code}${data.mobile}`), {
    message: "Invalid phone number",
    path: ["mobile"],
  });


export const userProfileSchema=z.object({
    first_name: z.string().trim().min(1, "Fitst name is required "),
    last_name: z.string().trim().min(1, "Last name is required"),
    country_code: z
      .string()
      .regex(
        /^\+[1-9]\d{0,2}$/,
        "Country code must start with + followed by digits",
      ),
    mobile: z.string().trim().min(1, "Phone number is required"),
    address_line1: z
      .string()
      .trim()
      .min(1, "First Line of address is required"),
    address_line2: z.string().trim().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], {
      message: "Please select a valid gender",
    }),
    dob: z.coerce
      .date()
      .min(new Date("1900-01-01"), {
        message: "Date of birth must be after 1900",
      })
      .max(new Date(), { message: "Date of birth cannot be in the future" }),
  })
  .refine((data) => isValidPhoneNumber(`${data.country_code}${data.mobile}`), {
    message: "Invalid phone number",
    path: ["mobile"],
  });

//* This line will create a type for req.body for the user register
export type UserRegisterSchema = z.infer<typeof userRegisterSchema>;

export const userLoginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password is too long")
    .regex(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      "Must include uppercase, lowercase, digit and special character",
    ),
});

//* This line will create a type for req.body for the user login
export type UserLoginSchema = z.infer<typeof userLoginSchema>;

//* This is the schema for the google auth
export const googleLoginSchema = z.object({
  email: z.string().email(),
  google_id: z.string(),
  first_name: z.string(),
  last_name: z.string().optional(),
  profile_picture: z.string().url().optional(),
});

export type GoogleLoginSchema = z.infer<typeof googleLoginSchema>;
