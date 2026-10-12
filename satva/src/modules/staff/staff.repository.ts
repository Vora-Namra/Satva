import { query } from "../../database/connection.js";
import { Filters } from "../admin/interfaces/filters.interface.js";


export class StaffRepository{

  async fetchHospitalIdFromStaffId(user_id:number){
        const rows:any = await query(`select hospital_id from staff where user_id= ?`,[user_id]);
        return rows[0];
    }

  // staff.repo.ts

async fetchDoctorsByHospitalId(
  hospital_id: number,
  filters: {
    search?:         string | undefined;
    specialty_id?:   number | undefined;
    is_deactivated?: boolean | undefined;
    page:            number;
    limit:           number;
  }
) {
  const { search, specialty_id, is_deactivated, page, limit } = filters;
  const offset = (page - 1) * limit;

  const conditions: string[] = ['d.hospital_id = ?'];
  const params: any[]        = [hospital_id];

  if (search) {
    conditions.push('(d.first_name LIKE ? OR d.last_name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (specialty_id) {
    conditions.push(`d.doctor_id IN (
      SELECT doctor_id FROM doctor_specialties WHERE specialty_id = ?
    )`);
    params.push(specialty_id);
  }

  if (is_deactivated !== undefined) {
    conditions.push('d.is_deactivated = ?');
    params.push(is_deactivated ? 1 : 0);
  }

  const WHERE = `WHERE ${conditions.join(' AND ')}`;

  // ✅ LIMIT and OFFSET interpolated directly as numbers — NOT as ? placeholders
  const safeLimit  = Number(limit)  || 10;
  const safeOffset = Number(offset) || 0;

  const rows = await query(
    `SELECT
       d.*,
       u.email,
       d.profile_path
     FROM doctors d
     JOIN users u ON d.user_id = u.user_id
     ${WHERE}
     ORDER BY d.first_name ASC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  const totalRows:any = await query(
    `SELECT COUNT(*) AS total
     FROM doctors d
     ${WHERE}`,
    params
  );

  return { rows, total: totalRows[0]?.total ?? 0 };
}

      async fetchPatientsByHospital(hospital_id: number) {
    const rows= await query(
      `SELECT DISTINCT p.*
FROM patients p
JOIN appointments a  ON p.patient_id  = a.patient_id
JOIN doctors d       ON a.doctor_id   = d.doctor_id
WHERE d.hospital_id  = ? `, 
      [hospital_id]
    );
    return rows;
  }

      async fetchStatsOfHospital(hospital_id:number){
     const stats = await query(`
      SELECT 
    -- 1. Today's Appointments vs Yesterday's Appointments
    COUNT(CASE WHEN DATE(a.start_time) = CURRENT_DATE() THEN 1 END) AS today_appointments,
    COUNT(CASE WHEN DATE(a.start_time) = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY) THEN 1 END) AS yesterday_appointments,

    -- 2. Total Active Patients vs Registered Patients Yesterday
    COUNT(DISTINCT CASE WHEN p.created_at <= NOW() THEN p.patient_id END) AS active_patients,
    COUNT(DISTINCT CASE WHEN p.created_at < CURRENT_DATE() THEN p.patient_id END) AS patients_yesterday,

    -- 3. Today's Revenue vs Yesterday's Revenue
    COALESCE(SUM(CASE WHEN DATE(a.start_time) = CURRENT_DATE() AND a.appointment_status = 'COMPLETED' THEN d.consultation_fee ELSE 0 END), 0) AS revenue_today,
    COALESCE(SUM(CASE WHEN DATE(a.start_time) = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY) AND a.appointment_status = 'COMPLETED' THEN d.consultation_fee ELSE 0 END), 0) AS revenue_yesterday,

    -- 4. Active Doctors vs Total Doctors Registered Yesterday
    COUNT(DISTINCT CASE WHEN d.is_deactivated = FALSE THEN d.doctor_id END) AS active_doctors,
    COUNT(DISTINCT CASE WHEN d.created_at < CURRENT_DATE() THEN d.doctor_id END) AS doctors_yesterday

FROM doctors d
LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
LEFT JOIN patients p ON a.patient_id = p.patient_id
WHERE d.hospital_id = ?;
      `,[hospital_id]) ;
      return stats;
    } 
     

// staff.repo.ts

async fetchAppointments(hospital_id: number, filters: Filters) {
  const { date, doctor_id, status, page, limit } = filters;
  const offset = (page - 1) * limit;

  const conditions: string[] = ['d.hospital_id = ?'];
  const params: any[]        = [hospital_id];

  if (date) {
    conditions.push('a.slot_date = ?');
    params.push(date);
  } else {
    conditions.push('a.slot_date = CURDATE()');
  }

  if (doctor_id) {
    conditions.push('a.doctor_id = ?');
    params.push(doctor_id);
  }

  if (status) {
    conditions.push('a.appointment_status = ?');
    params.push(status);
  }

  const WHERE = `WHERE ${conditions.join(' AND ')}`;

  // ✅ LIMIT and OFFSET interpolated directly as numbers — NOT as ? placeholders
  const safeLimit  = Number(limit)  || 10;
  const safeOffset = Number(offset) || 0;

  const rows = await query(
    `SELECT
       a.appointment_id, a.doctor_id,
       CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
       a.slot_date, a.start_time, a.end_time,
       a.appointment_type, a.appointment_status, a.confirmation_no,
       a.patient_id,
       CONCAT(p.first_name, ' ', p.last_name) AS patient_name
     FROM appointments a
     INNER JOIN doctors  d ON a.doctor_id  = d.doctor_id
     LEFT  JOIN patients p ON a.patient_id = p.patient_id
     ${WHERE}
     ORDER BY a.start_time ASC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  const totalRows:any = await query(
    `SELECT COUNT(*) AS total
     FROM appointments a
     INNER JOIN doctors d ON a.doctor_id = d.doctor_id
     ${WHERE}`,
    params
  );

  return { rows, total: totalRows[0]?.total ?? 0 };
}
 async fetchAppointmentDetails(appointment_id:number){
      const appointment = await query(`SELECT 
    a.appointment_id,
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    a.start_time,
    a.appointment_type,
    a.appointment_status,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name
FROM appointments a 
INNER JOIN doctors d ON a.doctor_id = d.doctor_id 
LEFT JOIN patients p ON a.patient_id = p.patient_id
WHERE a.appointment_id = ?;`,[appointment_id]);
return appointment;
    }

     async getDoctorById(doctor_id: number) {
  // Basic doctor + user info
  const rows: any = await query(
    `SELECT
       d.*,
       u.email,
       u.role,
       u.is_active,
       u.is_email_verified
     FROM doctors d
     JOIN users u ON d.user_id = u.user_id
     WHERE d.doctor_id = ?`,
    [doctor_id]
  );

  if (!rows[0]) return null;

  const doctor = rows[0];

  // Specialties
  const specialties = await query(
    `SELECT s.specialty_id, s.specialty_name
     FROM doctor_specialties ds
     JOIN specialties s ON ds.specialty_id = s.specialty_id
     WHERE ds.doctor_id = ?`,
    [doctor_id]
  );

  // Qualifications
  const qualifications = await query(
    `SELECT qualification_id, degree, college_name, graduation_year
     FROM doctor_qualifications
     WHERE doctor_id = ?`,
    [doctor_id]
  );

  // Attach to doctor object
  doctor.specialties    = specialties;
  doctor.qualifications = qualifications;

  return doctor;
}
async fetchPatientDetailsById(patient_id:number){
      const patient = await query(`select * from patients where patient_id = ?`,[patient_id]);
      return patient;
    }


async findAppointmentByConfirmationNo(confirmation_no: string) {
  const rows:any = await query(
    `SELECT
       a.*,
       CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
       p.mobile                                AS patient_mobile,
       p.blood_group                           AS patient_blood_group,
       CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
       pay.status                              AS payment_status,
       pay.amount                              AS payment_amount,
       pay.payment_method
     FROM appointments a
     JOIN patients  p   ON a.patient_id   = p.patient_id
     JOIN doctors   d   ON a.doctor_id    = d.doctor_id
     LEFT JOIN payments pay ON a.appointment_id = pay.appointment_id
     WHERE a.confirmation_no = ?`,
    [confirmation_no]
  );
  return rows[0] ?? null;
}

async findAppointmentById(appointment_id: number) {   
  const rows:any = await query(
    `SELECT
       a.*,
       CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
       p.mobile                                AS patient_mobile,
       CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
       pay.status                              AS payment_status,
       pay.amount                              AS payment_amount
     FROM appointments a
     JOIN patients  p   ON a.patient_id   = p.patient_id
     JOIN doctors   d   ON a.doctor_id    = d.doctor_id
     LEFT JOIN payments pay ON a.appointment_id = pay.appointment_id
     WHERE a.appointment_id = ?`,
    [appointment_id]
  );
  return rows[0] ?? null;
}

async updateAppointmentStatus(appointment_id: number, status: string) {
  await query(
    `UPDATE appointments SET appointment_status = ? WHERE appointment_id = ?`,
    [status, appointment_id]
  );
}

async insertStatusHistory(data: {
  appointment_id:     number;
  old_status:         string;
  new_status:         string;
  changed_by_user_id: number | null;
  remarks:            string | null;
}) {
  await query(
    `INSERT INTO appointment_status_history
       (appointment_id, old_status, new_status, changed_by_user_id, remarks)
     VALUES (?, ?, ?, ?, ?)`,
    [data.appointment_id, data.old_status, data.new_status, data.changed_by_user_id, data.remarks]
  );
}

      
async updatePaymentStatus(appointment_id: number, status: string) {
  console.log(status,appointment_id)
  await query(
    `UPDATE payments SET status = ? WHERE appointment_id = ?`,
    
    [status, appointment_id]
  );
}

} 