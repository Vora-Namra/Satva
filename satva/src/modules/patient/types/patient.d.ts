import { RowDataPacket } from "mysql2";

export interface IPaginationQuery {
  page?: number;
  limit?: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IPatient {
  patient_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  country_code: string;
  mobile: string;
  address_line1?: string | null;
  address_line2?: string | null;
  blood_group?: string | null;
  profile_path?: string | null;
  dob: Date;
  gender: "MALE" | "FEMALE" | "OTHER";
  is_insured: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IUpdatePatientProfile {
  first_name?: string;
  last_name?: string;
  address_line1?: string;
  address_line2?: string;
  blood_group?: string;
  profile_path?: string;
  is_insured?: boolean;
  policy_number?: string;
  policy_company?: string;
  policy_document_path?: string;
}

export interface IAddFamilyMember {
  relation: string;
  first_name: string;
  last_name: string;
  dob?: string | null | null;
  mobile?: string | null | null;
  email?: string | null | null;
}

export interface IUpdateFamilyMember {
  relation?: string;
  first_name?: string;
  last_name?: string;
  dob?: string | null | null;
  mobile?: string | null | null;
  email?: string | null | null;
}

export interface ISearchDoctorsQuery {
  name?: string;
  specialty?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  hospital_id?: number;
  limit?: number;
  offset?: number;
}

export interface IGetDoctorSlots {
  doctor_id: number;
  date: string;
}

export interface IBookAppointment {
  doctor_id: number;
  slot_date: string;
  start_time: string;
  appointment_type: "IN_PERSON" | "TELEMEDICINE";
  chief_complaint?: string;
  amount: number;
  payment_method: string;
}

export interface IRescheduleAppointment {
  slot_date: string;
  start_time: string;
}

export interface ICancelAppointment {
  reason: string;
}

export interface INotificationsQuery {
  unread?: "true" | "false";
}



