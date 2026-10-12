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

export interface IGetDoctorSlots {
  doctor_id: number;
  date: string;
}

export interface IAppointmentListQuery {
  status?: string;
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

export interface IAppointment {
  appointment_id: number;
  doctor_id: number;
  patient_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  appointment_type: "IN_PERSON" | "TELEMEDICINE";
  appointment_status: string;
  chief_complaint?: string;
  confirmation_no: string;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateAppointmentData {
  doctor_id: number;
  patient_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  appointment_type: "IN_PERSON" | "TELEMEDICINE";
  chief_complaint?: string | undefined;
  confirmation_no: string;
}

export interface IPaymentData {
  appointment_id: number;
  amount: number;
  payment_method: string;
  status: "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";
  transaction_id: string;
}

export interface IStatusHistoryData {
  appointment_id: number;
  old_status: string | null;
  new_status: string;
  changed_by_user_id: number;
  remarks?: string;
}

export interface INotificationData {
  user_id: number;
  title: string;
  message: string;
}

export interface IAvailableSlotsResponse {
  available: boolean;
  doctor_id?: number;
  date?: string;
  day_name?: string;
  slot_duration_minutes?: number;
  working_from?: string;
  working_to?: string;
  total_slots?: number;
  booked_count?: number;
  available_slots?: string[];
  slots?: string[];
  reason?: string;
}
