import z from "zod";

export const doctorScheduleSchema = z.object({
  working_date: z.coerce.date(),

  working_from: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      "Invalid time format"
    ),

  working_to: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      "Invalid time format"
    ),

  slot_duration: z
    .number()
    .int()
    .positive("Slot duration must be positive")
})
.refine(
  (data) => data.working_from < data.working_to,
  {
    message: "Working end time must be after working start time",
    path: ["working_to"]
  }
);

export type DoctorScheduleSchema =
  z.infer<typeof doctorScheduleSchema>;



export const doctorLeaveSchema = z.object({
  from_date: z.coerce.date(),

  to_date: z.coerce.date(),

  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .max(255)
});

export type DoctorLeaveSchema =
  z.infer<typeof doctorLeaveSchema>;



export const medicalRecordSchema = z.object({
  patient_id: z
    .number()
    .int()
    .positive(),

  appointment_id: z
    .number()
    .int()
    .positive(),

  diagnosis: z
    .string()
    .trim()
    .min(1, "Diagnosis is required"),

  examination_notes: z
    .string()
    .trim()
    .min(1, "Examination notes are required")
});

export type MedicalRecordSchema =
  z.infer<typeof medicalRecordSchema>;



export const medicalAttachmentSchema = z.object({
  record_id: z
    .number()
    .int()
    .positive(),

  file_name: z
    .string()
    .trim()
    .min(1, "File name is required"),

  file_path: z
    .string()
    .trim()
    .min(1, "File path is required")
});

export type MedicalAttachmentSchema =
  z.infer<typeof medicalAttachmentSchema>;



export const medicalRecordAmendmentSchema = z.object({
  record_id: z
    .number()
    .int()
    .positive(),

  field_name: z
    .string()
    .trim()
    .min(1, "Field name is required"),

  old_value: z
    .string()
    .trim(),

  new_value: z
    .string()
    .trim(),

  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
});

export type MedicalRecordAmendmentSchema =
  z.infer<typeof medicalRecordAmendmentSchema>;



export const prescriptionSchema = z.object({
  record_id: z
    .number()
    .int()
    .positive(),

  notes: z
    .string()
    .trim()
    .optional()
});

export type PrescriptionSchema =
  z.infer<typeof prescriptionSchema>;



export const prescriptionItemSchema = z.object({
  prescription_id: z
    .number()
    .int()
    .positive(),

  medicine_name: z
    .string()
    .trim()
    .min(1, "Medicine name is required"),

  dosage: z
    .string()
    .trim()
    .min(1, "Dosage is required"),

  frequency: z
    .string()
    .trim()
    .min(1, "Frequency is required"),

  duration: z
    .string()
    .trim()
    .min(1, "Duration is required"),

  instructions: z
    .string()
    .trim()
    .optional()
});

export type PrescriptionItemSchema =
  z.infer<typeof prescriptionItemSchema>;