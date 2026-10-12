import { RowDataPacket } from "mysql2";
import { query } from "../../database/connection.js";
import { ICreateAppointmentData, IPaymentData, IStatusHistoryData, INotificationData } from "./appointment.interface.js";

export class AppointmentRepository {
  async getPatientIdByUserId(user_id: number): Promise<number | null> {
    const result: any = await query(`select patient_id from patients where user_id = ?`, [user_id]);
    return result.length ? result[0].patient_id : null;
  }

  async getDoctorIdByUserId(user_id: number): Promise<number | null> {
    const result: any = await query(`select doctor_id from doctors where user_id = ?`, [user_id]);
    return result.length ? result[0].doctor_id : null;
  }

  async getUserIdByDoctorId(doctor_id : number) : Promise<number | null>{
    const result = await query(`select user_id from doctors where doctor_id = ?`,[doctor_id]) as RowDataPacket;
    return result.length ? result[0].user_id as number: null;
  }

  async isSlotTaken(doctor_id: number, slot_date: string, start_time: string): Promise<boolean> {
    const result: any = await query(
      `select appointment_id from appointments where doctor_id = ? and slot_date = ? and start_time = ? and appointment_status not in ('CANCELLED', 'REJECTED')`,
      [doctor_id, slot_date, start_time]
    );

    return result.length > 0;
  }

  async getDoctorSchedule(doctor_id: number, date: string): Promise<any> {
    const result: any = await query(
      `select * from doctor_schedules where doctor_id = ? and working_date = ?`,
      [doctor_id, date]
    );
    return result.length ? result[0] : null;
  }

  async createAppointment(data: ICreateAppointmentData): Promise<number> {
    const result: any = await query(
      `insert into appointments (doctor_id, patient_id, slot_date, start_time, end_time, appointment_type, chief_complaint, confirmation_no) values (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.doctor_id, data.patient_id, data.slot_date, data.start_time, data.end_time, data.appointment_type, data.chief_complaint, data.confirmation_no]
    );
    return result.insertId;
  }

  async createPayment(data: IPaymentData): Promise<number> {

    console.log("this is data :", data);
    
    const result: any = await query(
      `insert into payments (appointment_id, amount, payment_method, status, transaction_id) values (?, ?, ?, ?, ?)`,
      [data.appointment_id, data.amount, data.payment_method, data.status, data.transaction_id]
    );
    return result.insertId;
  }

  async updateAppointmentStatus(appointment_id: number, status: string): Promise<void> {
    await query(`update appointments set appointment_status = ? where appointment_id = ?`, [status, appointment_id]);
  }

  async logStatusHistory(data: IStatusHistoryData): Promise<void> {
    await query(
      `insert into appointment_status_history (appointment_id, old_status, new_status, changed_by_user_id, remarks) values (?, ?, ?, ?, ?)`,
      [data.appointment_id, data.old_status, data.new_status, data.changed_by_user_id, data.remarks]
    );
  }

  async createNotification(data: INotificationData): Promise<void> {
    await query(
      `insert into notifications (user_id, notification_type, notification_message, sent_at) values (?, ?, ?, utc_timestamp())`,
      [data.user_id, data.title, data.message]
    );
  }

  async getAppointmentById(appointment_id: number): Promise<any> {
    const result: any = await query(`select * from appointments where appointment_id = ?`, [appointment_id]);
    return result.length ? result[0] : null;                
  }

  async rescheduleAppointment(appointment_id: number, data: { slot_date: string; start_time: string; end_time: string }): Promise<void> {
    await query(
      `update appointments set slot_date = ?, start_time = ?, end_time = ?, appointment_status = 'RESCHEDULED' where appointment_id = ?`,
      [data.slot_date, data.start_time, data.end_time, appointment_id]
    );
  }

  async getPaymentByAppointment(appointment_id: number): Promise<any> {
    const result: any = await query(`select * from payments where appointment_id = ?`, [appointment_id]);
    return result.length ? result[0] : null;
  }

  async markPaymentRefunded(payment_id: number): Promise<void> {
    await query(`update payments set status = 'REFUNDED' where payment_id = ?`, [payment_id]);
  }

  async getAppointmentsByPatient(patient_id: number, status?: string): Promise<any> {
    const params: any[] = [patient_id];
    let statusFilter = "";
    if (status) {
      statusFilter = "and a.appointment_status = ?";
      params.push(status.toUpperCase());
    }
    return query(
      `select
        a.appointment_id, a.doctor_id, a.slot_date, a.start_time, a.end_time,
        a.appointment_type, a.appointment_status, a.chief_complaint, a.confirmation_no,
        d.first_name as doctor_first_name, d.last_name as doctor_last_name,
        d.consultation_fee, d.currency_code, d.profile_path as doctor_photo,
        t.meeting_link,
        h.hospital_name,
        group_concat(distinct s.specialty_name separator ', ') as specialties,
        p.status as payment_status, p.amount as payment_amount
        from appointments a
        join doctors d on a.doctor_id = d.doctor_id
        join hospitals h on d.hospital_id = h.hospital_id
        left join doctor_specialties ds on d.doctor_id = ds.doctor_id
        left join specialties s on ds.specialty_id = s.specialty_id
        left join payments p on a.appointment_id = p.appointment_id
        left join telemedicine_sessions t on a.appointment_id = t.appointment_id

        where a.patient_id = ? ${statusFilter}
        group by a.appointment_id
        order by a.slot_date desc, a.start_time desc`,
      params,
    );
  }

  async getAppointmentsByPatientPaginated(patient_id: number, status?: string, pagination?: { page: number; limit: number }) {
    const page = Math.max(1, pagination?.page || 1);
    const limit = Math.max(1, pagination?.limit || 10);
    const offset = (page - 1) * limit;
    const safeLimit = Number(limit) || 10;
    const safeOffset = Number(offset) || 0;
    const params: any[] = [patient_id];
    let statusFilter = "";

    if (status) {
      statusFilter = "and a.appointment_status = ?";
      params.push(status.toUpperCase());
    }

    const rows = (await query(
      `select
        a.appointment_id, a.doctor_id, a.slot_date, a.start_time, a.end_time,
        a.appointment_type, a.appointment_status, a.chief_complaint, a.confirmation_no,
        d.first_name as doctor_first_name, d.last_name as doctor_last_name,
        d.consultation_fee, d.currency_code, d.profile_path as doctor_photo,
        t.meeting_link,
        h.hospital_name,
        group_concat(distinct s.specialty_name separator ', ') as specialties,
        p.status as payment_status, p.amount as payment_amount
        from appointments a
        join doctors d on a.doctor_id = d.doctor_id
        join hospitals h on d.hospital_id = h.hospital_id
        left join doctor_specialties ds on d.doctor_id = ds.doctor_id
        left join specialties s on ds.specialty_id = s.specialty_id
        left join payments p on a.appointment_id = p.appointment_id
        left join telemedicine_sessions t on a.appointment_id = t.appointment_id
        where a.patient_id = ? ${statusFilter}
        group by a.appointment_id
        order by a.slot_date desc, a.start_time desc
        limit ${safeLimit} offset ${safeOffset}`,
      params,
    )) as RowDataPacket[];

    const totalRows = (await query(
      `select count(*) as total from appointments a where a.patient_id = ? ${statusFilter}`,
      params,
    )) as RowDataPacket[];

    return { rows, total: Number(totalRows[0]?.total || 0) };
  }


  async isDoctorOnLeave(doctor_id: number, date: string): Promise<boolean> {
    const result: any = await query(
      `select leave_id from doctor_leaves where doctor_id = ? and ? between from_date and to_date`,
      [doctor_id, date]
    );
    return result.length > 0;
  }

  async getBookedSlots(doctor_id: number, date: string): Promise<string[]> {
    const result: any = await query(
        `select time_format(start_time, '%H:%i') as start_time
        from appointments
        where doctor_id = ?
          and slot_date = ?
          and appointment_status not in ('CANCELLED', 'REJECTED')`,
        [doctor_id, date]
    );
    return result.map((r: any) => r.start_time);
  }

  async findDoctorAppointments(doctor_id: number, date: string): Promise<any> {
    return await query(`select * from appointments where doctor_id = ? and slot_date = ?`, [doctor_id, date]);
  }

  async DoctorDashBoardData(doctor_id: number): Promise<any> {
    const totalAppointments: any = await query(`select count(*) as count from appointments where doctor_id = ?`, [doctor_id]);
    const upcomingAppointments: any = await query(`select count(*) as count from appointments where doctor_id = ? and appointment_status in ('CONFIRMED', 'RESCHEDULED') and slot_date >= curdate()`, [doctor_id]);
    const rescheduledAppointments: any = await query(`select count(*) as count from appointments where doctor_id = ? and appointment_status = 'RESCHEDULED'`, [doctor_id]);
    const cancelledAppointments: any = await query(`select count(*) as count from appointments where doctor_id = ? and appointment_status = 'CANCELLED'`, [doctor_id]);

    return {
      'TOTAL APPOINTMENT': totalAppointments[0].count,
      'UPCOMING': upcomingAppointments[0].count,
      'RESCHEDULED': rescheduledAppointments[0].count,
      'CANCELLED': cancelledAppointments[0].count,
    };
  }
}