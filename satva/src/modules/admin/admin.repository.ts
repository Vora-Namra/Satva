import { query } from "../../database/connection.js";
import { AuditPayload } from "./interfaces/audit.interface.js";
import { Hospital } from "./interfaces/hospital.interface.js";

export class AdminRepository {

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

  async fetchHospitalIdFromAdminId(user_id: number) {
    const rows: any = await query(`select hospital_id from admins where user_id= ?`, [user_id]);
    return rows[0];
  }


async fetchPatientsByHospital(
  hospital_id: number,
  filters: {
    search?:     string | undefined;
    gender?:     string | undefined;
    is_insured?: boolean | undefined;
    page:        number;
    limit:       number;
  }
) {
  const { search, gender, is_insured, page, limit } = filters;
  const offset = (page - 1) * limit;

  const conditions: string[] = ['d.hospital_id = ?'];
  const params: any[]        = [hospital_id];

  if (search) {
    conditions.push('(p.first_name LIKE ? OR p.last_name LIKE ? OR p.mobile LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (gender) {
    conditions.push('p.gender = ?');
    params.push(gender);
  }

  if (is_insured !== undefined) {
    conditions.push('p.is_insured = ?');
    params.push(is_insured ? 1 : 0);
  }

  const WHERE = `WHERE ${conditions.join(' AND ')}`;

  const safeLimit  = Number(limit)  || 10;
  const safeOffset = Number(offset) || 0;

  const rows = await query(
    `SELECT DISTINCT
       p.*
     FROM patients p
     JOIN appointments a ON p.patient_id = a.patient_id
     JOIN doctors      d ON a.doctor_id  = d.doctor_id
     ${WHERE}
     ORDER BY p.first_name ASC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  const totalRows: any = await query(
    `SELECT COUNT(DISTINCT p.patient_id) AS total
     FROM patients p
     JOIN appointments a ON p.patient_id = a.patient_id
     JOIN doctors      d ON a.doctor_id  = d.doctor_id
     ${WHERE}`,
    params
  );

  return { rows, total: totalRows[0]?.total ?? 0 };
}

  async insertDoctorQualifications(
    doctor_id: number,
    qualifications: { degree: string; college_name: string; graduation_year: number }[]
  ): Promise<void> {
    for (const q of qualifications) {
      await query(
        `INSERT INTO doctor_qualifications (doctor_id, degree, graduation_year, college_name)
       VALUES (?, ?, ?, ?)`,
        [
          Number(doctor_id),
          String(q.degree),
          q.graduation_year ? Number(q.graduation_year) : null,
          q.college_name ? String(q.college_name) : null,
        ]
      );
    }
  }

  async insertDoctorSpecialties(
    doctor_id: number,
    specialties: number[]
  ): Promise<void> {
    for (const specialty_id of specialties) {
      await query(
        `INSERT INTO doctor_specialties (doctor_id, specialty_id)
       VALUES (?, ?)`,
        [Number(doctor_id), Number(specialty_id)]
      );
    }
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
    doctor.specialties = specialties;
    doctor.qualifications = qualifications;

    return doctor;
  }

  async editDoctor(doctor_id: number, data: { [key: string]: any }) {
    const doctorFields: { [key: string]: any } = {};
    if (data.firstName) doctorFields.first_name = data.firstName;
    if (data.lastName) doctorFields.last_name = data.lastName;
    if (data.gender) doctorFields.gender = data.gender;
    if (data.experienceYears !== undefined) doctorFields.experience_years = data.experienceYears;
    if (data.consultationFee !== undefined) doctorFields.consultation_fee = data.consultationFee;
    if (data.bio) doctorFields.bio = data.bio;

    if (Object.keys(doctorFields).length > 0) {
      const setClause = Object.keys(doctorFields).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(doctorFields), doctor_id];
      await query(`UPDATE doctors SET ${setClause} WHERE doctor_id = ?`, values);
    }

    if (data.email) {
      const doctorUser: any = await query(`SELECT user_id FROM doctors WHERE doctor_id = ?`, [doctor_id]);
      if (doctorUser[0]) {
        await query(`UPDATE users SET email = ? WHERE user_id = ?`, [data.email, doctorUser[0].user_id]);
      }
    }

    // Handle qualifications: delete old ones and insert new ones
    if (data.qualifications) {
      await query(`DELETE FROM doctor_qualifications WHERE doctor_id = ?`, [doctor_id]);
      if (data.qualifications.length > 0) {
        await this.insertDoctorQualifications(
          doctor_id,
          data.qualifications
        );
      }
    }

    // Handle specialties: delete old ones and insert new ones
    if (data.specialties) {
      await query(`DELETE FROM doctor_specialties WHERE doctor_id = ?`, [doctor_id]);
      if (data.specialties.length > 0) {
        await this.insertDoctorSpecialties(
          doctor_id,
          data.specialties
        );
      }
    }

    // Return the updated doctor with all details
    return await this.getDoctorById(doctor_id);
  }
  async addAuditLogs(payload: AuditPayload) {
    const rows = await query(`Insert into audit_logs (performed_by_user_id,action,entity_name,entity_id,ip_address) values (?,?,?,?,?)`, [payload.performed_by_user_id, payload.action, payload.entity_name, payload.entity_id, payload.ip_address ?? null]);
    return rows;
  }

  async showLogs(hospital_id: number) {
    const rows = await query(`
      
      SELECT
  al.audit_id,
  al.action,
  al.entity_name,
  al.entity_id, 
  al.ip_address,
  al.created_at,
  u.email     AS performed_by_email,
  u.role      AS performed_by_role,
  CONCAT(
    COALESCE(a.first_name, d.first_name, 'Unknown'),
    ' ',
    COALESCE(a.last_name,  d.last_name,  '')
  )           AS performed_by_name

FROM audit_logs al
LEFT JOIN users   u ON al.performed_by_user_id = u.user_id
LEFT JOIN admins  a ON u.user_id = a.user_id  AND a.hospital_id = ?
LEFT JOIN doctors d ON u.user_id = d.user_id  AND d.hospital_id = ?

WHERE (
  a.hospital_id = ?  
  OR
  d.hospital_id = ? 
)

ORDER BY al.created_at DESC
      
      `, [hospital_id, hospital_id, hospital_id, hospital_id])
  }


  async fetchAppointments(hospital_id: number) {
    const rows = await query(`SELECT 
    a.appointment_id,
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    a.start_time,
    a.appointment_type,
    a.appointment_status,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name
FROM appointments a 
INNER JOIN doctors d ON a.doctor_id = d.doctor_id 
LEFT JOIN patients p ON a.patient_id = p.patient_id

WHERE d.hospital_id = ? order by a.start_time ; `, [hospital_id]);
    return rows;
  };

  async fetchAuditLogs(hospital_id: number) {
    const rows = await query(`
    SELECT
  al.audit_id,
  al.action,
  al.entity_name,
  al.entity_id,
  al.ip_address,
  al.created_at,
  u.email    AS performed_by_email,
  u.role     AS performed_by_role,
  CONCAT(
    COALESCE(adm.first_name, doc.first_name, pat.first_name, 'Unknown'),
    ' ',
    COALESCE(adm.last_name,  doc.last_name,  pat.last_name,  '')
  )          AS performed_by_name

FROM audit_logs al
LEFT JOIN users   u   ON al.performed_by_user_id = u.user_id

-- check if user is admin of this hospital
LEFT JOIN admins  adm ON u.user_id = adm.user_id AND adm.hospital_id =?

-- check if user is doctor of this hospital
LEFT JOIN doctors doc ON u.user_id = doc.user_id AND doc.hospital_id = ?

-- check if user is a patient who has visited this hospital
-- patient → appointments → doctor → hospital
LEFT JOIN patients pat ON u.user_id = pat.user_id
LEFT JOIN appointments apt ON apt.patient_id = pat.patient_id
LEFT JOIN doctors doc2 ON apt.doctor_id = doc2.doctor_id AND doc2.hospital_id = ?

WHERE (
  adm.hospital_id  = ?   -- is admin of this hospital
  OR doc.hospital_id = ?  -- is doctor of this hospital
  OR doc2.hospital_id = ?  -- is patient who visited this hospital
)

GROUP BY al.audit_id   -- prevent duplicate rows from patient multi-appointments

ORDER BY al.created_at DESC
    `, [hospital_id, hospital_id, hospital_id, hospital_id, hospital_id, hospital_id]);
    return rows;
  }

  async fetchSpecialties() {
    const specialties = await query(`select * from specialties`, []);
    return specialties;
  }

  async updateDoctorStatus(doctorId: number, is_deactivated: number) {
    const result = await query(
      `
            update doctors set is_deactivated = ? where doctor_id = ?
            `, [is_deactivated, doctorId]
    );
    return result;
  }

  async fetchPatientDetailsById(patient_id: number) {
    const patient = await query(`select * from patients where patient_id = ?`, [patient_id]);
    return patient;
  }

  async fetchHospitalDetails(hospital_id: number) {
    const hospital = await query(`select * from hospitals where hospital_id = ?`, [hospital_id]);
    return hospital;
  }

  async updateSettings(hospital_id: number, payload: Hospital) {
    const hospital = await query(`update hospitals set hospital_name = ?,email=?,address_line1=?,address_line2=?,contact_number=? where hospital_id = ?`, [payload.hospital_name, payload.email, payload.address_line1, payload.address_line2, payload.contact_number, hospital_id]);
    return hospital;
  }

  async fetchStatsOfHospital(hospital_id: number) {
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
      `, [hospital_id]);
    return stats;
  }


  async fetchAppointmentDetails(appointment_id: number) {
    const appointment = await query(`SELECT
    a.appointment_id,
    a.slot_date,
    a.start_time,
    a.end_time,
    a.appointment_type,
    a.appointment_status,
    a.chief_complaint,
    a.confirmation_no,
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    p.mobile AS patient_mobile,
    pay.status AS payment_status,
    pay.amount AS payment_amount,
    t.meeting_link,
    (SELECT remarks FROM appointment_status_history WHERE appointment_id = a.appointment_id ORDER BY created_at DESC LIMIT 1) AS reason
FROM appointments a
INNER JOIN doctors d ON a.doctor_id = d.doctor_id
LEFT JOIN patients p ON a.patient_id = p.patient_id
LEFT JOIN payments pay ON a.appointment_id = pay.appointment_id
LEFT JOIN telemedicine_sessions t ON a.appointment_id = t.appointment_id
WHERE a.appointment_id = ?;`, [appointment_id]);
    return appointment;
  }


  async fetchStaffs(hospital_id: number) {
    const staffs = await query(`select * from staff where hospital_id= ?`, [hospital_id]);
    return staffs;

  }

  async getStaffById(staff_id: number) {
    const staff = await query(`select * from staff where staff_id = ? `, [staff_id]);
    return staff;
  }

}