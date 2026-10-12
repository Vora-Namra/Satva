import e from "express";

// export enum WorkingDay {
//   MONDAY = 'MONDAY',
//   TUESDAY = 'TUESDAY',
//   WEDNESDAY = 'WEDNESDAY',
//   THURSDAY = 'THURSDAY',
//   FRIDAY = 'FRIDAY',
//   SATURDAY = 'SATURDAY',
//   SUNDAY = 'SUNDAY'
// }

export interface IDoctorSchedule {
  
  working_date: Date;
  working_from: string;
  working_to: string;
  slot_duration: number;
}

export interface IDoctorNotification {
  doctor_id: number;
  notification_type: string;
  notification_message: string;
}

export interface IDoctorLeave {
  from_date: Date;
  to_date: Date;
  reason: string;
}

export interface IMedicalRecords {
  doctor_id: number;
  patient_id: number;
  appointment_id: number;
  diagnosis: string;
  examination_notes: string;
}

export interface IMedicalAttachments {
  record_id:number,
  file_name: string;
  file_path: string;
}

export interface IMedicalRecordAmmendment {
  record_id: number;
  ammended_doctor_id: number;
  field_name: string;
  old_value: string;
  new_value: string;
  reason: string;
}

export interface IPrescriptions {
  record_id: number;
  notes: string;
}

export interface IPrescriptionItems {
  prescription_id?:number
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface IDoctorDetails {
  doctor_id: number;
  first_name: string;
  last_name: string;
  experience_years: number;
  consultation_fee: number;
  bio: string;
  profile_path?: string;
}

export enum AppointmentStatus {
  PAYMENT_PENDING = "PAYMENT_PENDING",
  CONFIRMED = "CONFIRMED",
  CHECKED_IN = "CHECKED_IN",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  RESCHEDULED = "RESCHEDULED",
  NO_SHOW = "NO_SHOW",
}

export interface IDoctorRecordsFill{
  appointment_id:number,
   examination_notes: string,
  diagnosis:string,
  prescription_items:IPrescriptionItems[],
  notes:string
}