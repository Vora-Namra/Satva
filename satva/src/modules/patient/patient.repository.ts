import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { query } from "../../database/connection.js";
import {
  type IPatient,
} from "./types/patient.js";

type SearchDoctorsFilters = {
  name?: string | undefined;
  specialty?: string | undefined;
  gender?: string | undefined;
  hospital_id?: number | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
};

type UpdatePatientProfileDto = Partial<
  Pick<
    IPatient,
    | "first_name"
    | "last_name"
    | "address_line1"
    | "address_line2"
    | "blood_group"
    | "profile_path"
    | "is_insured"
  >
>;                                      

export class PatientRepository {
  async getPatientByUserId(userId: number) {
    const rows = (await query(
      "select p.*, u.email, u.is_active, u.is_email_verified from patients p join users u on p.user_id = u.user_id where p.user_id = ?",
      [userId],
    )) as RowDataPacket[];
    console.log(rows);

    return rows[0] ?? null;
  }

  async getPatientIdByUserId(userId: number) {
    const rows = (await query(
      `select patient_id from patients where user_id = ?`,
      [userId],
    )) as RowDataPacket[];

    return rows[0]?.patient_id ?? null;
  }

  async updateProfile(patientId: number, data: UpdatePatientProfileDto) {
    const entries = Object.entries(data).filter(
      ([, value]) => value !== undefined,
    );

    if (!entries.length) {
      return;
    }

    const fields = entries.map(([key]) => `${key} = ?`).join(", ");

    const values = entries.map(([, value]) => value);

    return query(
      `
        update patients
        set ${fields},
            updated_at = utc_timestamp()
        where patient_id = ?
        `,
      [...values, patientId],
    );
  }

  async updateFamilyMember(
    memberId: number,
    patientId: number,
    data: Partial<{
      relation: string;
      first_name: string;
      last_name: string;
      dob: string;
      mobile: string;
      email: string;
    }>,
  ) {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return;
    const fields = entries.map(([k]) => `${k} = ?`).join(", ");
    const values = entries.map(([, v]) => v);
    return query(
      `update family_members set ${fields}, updated_at = UTC_TIMESTAMP()
       where member_id = ? and patient_id = ?`,
      [...values, memberId, patientId],
    );
  }

  async deleteFamilyMember(memberId: number, patientId: number) {
    return query(
      `delete from family_members where member_id = ? and patient_id = ?`,
      [memberId, patientId],
    );
  }

  async getInsuranceByPatientId(patientId: number | string) {
    const rows: any = (await query(
      `
    select *
    from patient_insurance_details
    where patient_id = ?
    limit 1
    `,
      [patientId],
    )) as RowDataPacket[];

    return rows[0] ?? null;
  }

  async updateInsuranceDetails(
    patientId: number | string,
    data: {
      policyNumber: string;
      policyCompany: string;
      policyDocumentPath?: string | null;
    },
  ) {
    const existing = await this.getInsuranceByPatientId(patientId);

    if (existing) {
      await query(
        `
      update patient_insurance_details
      set
        policy_number = ?,
        policy_company = ?,
        policy_document_path = ?,
        updated_at = utc_timestamp()
      where patient_id = ?
      `,
        [
          data.policyNumber,
          data.policyCompany,
          data.policyDocumentPath ?? null,
          patientId,
        ],
      );

      return this.getInsuranceByPatientId(patientId);
    }

    const result = (await query(
      `
    insert into patient_insurance_details (
      patient_id,
      policy_number,
      policy_company,
      policy_document_path
    )
    values (?, ?, ?, ?)
    `,
      [
        patientId,
        data.policyNumber,
        data.policyCompany,
        data.policyDocumentPath ?? null,
      ],
    )) as ResultSetHeader;

    return result;
  }

  async deleteInsuranceDetails(patientId: number | string) {
    return query(
      `
    delete from patient_insurance_details
    where patient_id = ?
    `,
      [patientId],
    );
  }

  async countFamilyMembers(patientId: number | string) {
    const rows = (await query(
      `
    select count(*) as total
    from family_members
    where patient_id = ?
    `,
      [patientId],
    )) as RowDataPacket[];

    return Number(rows[0]?.total || 0);
  }

  async getFamilyMembers(patientId: number) {
    return query(
      "select * from family_members where patient_id = ? order by created_at asc",
      [patientId],
    ) as RowDataPacket;
  }



  async addFamilyMember(
    patientId: number | string,
    data: {
      relation: string;
      first_name: string;
      last_name: string;
      dob?: string | null;
      mobile?: string | null;
      email?: string | null;
    },
  ) {
    const total = await this.countFamilyMembers(patientId);
    if (total >= 3) {
      throw new Error("Maximum 3 family members are allowed");
    }

    const result = (await query(
      `
    insert into family_members
      (patient_id, relation, first_name, last_name, dob, mobile, email)
    values
      (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        patientId,
        data.relation,
        data.first_name,
        data.last_name,
        data.dob ?? null,
        data.mobile ?? null,
        data.email ?? null,
      ],
    )) as ResultSetHeader;

    return result;
  }

  async searchDoctors(filters: SearchDoctorsFilters) {
    const conditions: string[] = ["d.is_deactivated = FALSE"];
    const params: any[] = [];

    const name = filters.name?.trim();
    const specialty = filters.specialty?.trim();
    const gender = filters.gender?.trim();
    const hospital_id = filters.hospital_id;
    const limit = Number.isFinite(filters.limit)
      ? Math.max(1, Math.min(filters.limit as number, 50))
      : 20;
    const offset = Number.isFinite(filters.offset)
      ? Math.max(0, filters.offset as number)
      : 0;

    if (name) {
      conditions.push(`
      (
        d.first_name like ?
        or d.last_name like ?
        or concat(d.first_name, ' ', d.last_name) like ?
      )
    `);
      params.push(`%${name}%`, `%${name}%`, `%${name}%`);
    }

    if (specialty) {
      conditions.push("s.specialty_name LIKE ?");
      params.push(`%${specialty}%`);
    }

    if (gender) {
      conditions.push("d.gender = ?");
      params.push(gender.toUpperCase());
    }

    if (hospital_id) {
      conditions.push("d.hospital_id = ?");
      params.push(hospital_id);
    }

    const whereClause = conditions.join(" AND ");

    return query(
      `
    select distinct
      d.doctor_id,
      d.first_name,
      d.last_name,
      d.gender,
      d.experience_years,
      d.consultation_fee,
      d.currency_code,
      d.rating,
      d.bio,
      d.profile_path,
      h.hospital_name,
      group_concat(
        distinct s.specialty_name
        order by s.specialty_name
        separator ', '
      ) as specialties
    from doctors d
    join hospitals h
      on d.hospital_id = h.hospital_id
    left join doctor_specialties ds
      on d.doctor_id = ds.doctor_id
    left join specialties s
      on ds.specialty_id = s.specialty_id
    where ${whereClause}
    group by d.doctor_id
    order by coalesce(d.rating, 0) desc
    limit ${limit} offset ${offset}
    `,
      params,
    );
  }

  async searchDoctorsPaginated(filters: SearchDoctorsFilters) {
    const conditions: string[] = ["d.is_deactivated = FALSE"];
    const params: any[] = [];

    const name = filters.name?.trim();
    const specialty = filters.specialty?.trim();
    const gender = filters.gender?.trim();
    const hospital_id = filters.hospital_id;
    const page = Number.isFinite(filters.page) ? Math.max(1, filters.page as number) : 1;
    const limit = Number.isFinite(filters.limit)
      ? Math.max(1, Math.min(filters.limit as number, 50))
      : 20;
    const offset = (page - 1) * limit;

    if (name) {
      conditions.push(`
      (
        d.first_name like ?
        or d.last_name like ?
        or concat(d.first_name, ' ', d.last_name) like ?
      )
    `);
      params.push(`%${name}%`, `%${name}%`, `%${name}%`);
    }

    if (specialty) {
      conditions.push("s.specialty_name LIKE ?");
      params.push(`%${specialty}%`);
    }

    if (gender) {
      conditions.push("d.gender = ?");
      params.push(gender.toUpperCase());
    }

    if (hospital_id) {
      conditions.push("d.hospital_id = ?");
      params.push(hospital_id);
    }

    const whereClause = conditions.join(" AND ");

    const rows = (await query(
      `
    select distinct
      d.doctor_id,
      d.first_name,
      d.last_name,
      d.gender,
      d.experience_years,
      d.consultation_fee,
      d.currency_code,
      d.rating,
      d.bio,
      d.profile_path,
      h.hospital_name,
      group_concat(
        distinct s.specialty_name
        order by s.specialty_name
        separator ', '
      ) as specialties
    from doctors d
    join hospitals h
      on d.hospital_id = h.hospital_id
    left join doctor_specialties ds
      on d.doctor_id = ds.doctor_id
    left join specialties s
      on ds.specialty_id = s.specialty_id
    where ${whereClause}
    group by d.doctor_id
    order by coalesce(d.rating, 0) desc
    limit ${limit} offset ${offset}
    `,
      params,
    )) as RowDataPacket[];

    const totalRows = (await query(
      `
    select count(*) as total from (
      select d.doctor_id
      from doctors d
      join hospitals h on d.hospital_id = h.hospital_id
      left join doctor_specialties ds on d.doctor_id = ds.doctor_id
      left join specialties s on ds.specialty_id = s.specialty_id
      where ${whereClause}
      group by d.doctor_id
    ) as doctor_count
    `,
      params,
    )) as RowDataPacket[];

    return { rows, total: Number(totalRows[0]?.total || 0) };
  }

  async getDoctorById(doctorId: number) {
    const rows = (await query(
      `select
         d.*,
         h.hospital_name, h.address_line1 as hospital_address,
         group_concat(distinct s.specialty_name order by s.specialty_name separator ', ') as specialties,
         group_concat(distinct concat(dq.degree, ' (', ifnull(dq.graduation_year,''), ')') separator ' | ') as qualifications
       from doctors d
       join hospitals h on d.hospital_id = h.hospital_id
       left join doctor_specialties ds on d.doctor_id = ds.doctor_id
       left join specialties s on ds.specialty_id = s.specialty_id
       left join doctor_qualifications dq on d.doctor_id = dq.doctor_id
       where d.doctor_id = ? and d.is_deactivated = false
       group by d.doctor_id`,
      [doctorId],
    )) as RowDataPacket;
    console.log(rows);
    return rows[0] ?? null;
  }

  //  Medical records
  async getMedicalHistory(patientId: number) {
    return query(
      `select
            mr.record_id, mr.appointment_id, mr.diagnosis, mr.examination_notes,
            mr.created_at as record_date,
            d.first_name as doctor_first_name, d.last_name as doctor_last_name,
            a.slot_date, a.appointment_type,
            pr.prescription_id, pr.notes as prescription_notes,
            group_concat(
            distinct concat(pi.medicine_name,'|',pi.dosage,'|',pi.frequency,'|',pi.duration)
            separator ';;'
            ) as medicines
            from medical_records mr
            join doctors d on mr.doctor_id = d.doctor_id
            join appointments a on mr.appointment_id = a.appointment_id
            left join prescriptions pr on mr.record_id = pr.record_id
            left join prescription_items pi on pr.prescription_id = pi.prescription_id
            where mr.patient_id = ?
            group by mr.record_id
            order by mr.created_at desc`,
      [patientId],
    );
  }

  async getMedicalHistoryPaginated(patientId: number, pagination: { page: number; limit: number }) {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.max(1, pagination.limit || 10);
    const offset = (page - 1) * limit;
    const safeLimit = Number(limit) || 10;
    const safeOffset = Number(offset) || 0;

    const rows = (await query(
      `select
            mr.record_id, mr.appointment_id, mr.diagnosis, mr.examination_notes,
            mr.created_at as record_date,
            d.first_name as doctor_first_name, d.last_name as doctor_last_name,
            a.slot_date, a.appointment_type,
            pr.prescription_id, pr.notes as prescription_notes,
            group_concat(
            distinct concat(pi.medicine_name,'|',pi.dosage,'|',pi.frequency,'|',pi.duration)
            separator ';;'
            ) as medicines
            from medical_records mr
            join doctors d on mr.doctor_id = d.doctor_id
            join appointments a on mr.appointment_id = a.appointment_id
            left join prescriptions pr on mr.record_id = pr.record_id
            left join prescription_items pi on pr.prescription_id = pi.prescription_id
            where mr.patient_id = ?
            group by mr.record_id
            order by mr.created_at desc
            limit ${safeLimit} offset ${safeOffset}`,
      [patientId],
    )) as RowDataPacket[];

    const totalRows = (await query(
      `select count(*) as total from (
        select mr.record_id
        from medical_records mr
        where mr.patient_id = ?
        group by mr.record_id
      ) as record_count`,
      [patientId],
    )) as RowDataPacket[];

    return { rows, total: Number(totalRows[0]?.total || 0) };
  }

  async getMedicalRecordById(recordId: number, patientId: number) {
    const rows = (await query(
      `select
            mr.*,
            d.first_name as doctor_first_name, d.last_name as doctor_last_name,
            a.slot_date, a.start_time, a.appointment_type,
            pr.prescription_id, pr.notes as prescription_notes
            from medical_records mr
            join doctors d on mr.doctor_id = d.doctor_id
            join appointments a on mr.appointment_id = a.appointment_id
            left join prescriptions pr on mr.record_id = pr.record_id
            where mr.record_id = ? and mr.patient_id = ?`,
      [recordId, patientId],
    )) as RowDataPacket[];
    if (!rows[0]) return null;

    const prescriptionItems = (await query(
      `select pi.* from prescription_items pi
        join prescriptions pr on pi.prescription_id = pr.prescription_id
        where pr.record_id = ?`,
      [recordId],
    )) as RowDataPacket[];

    const attachments = (await query(
      `select * from medical_record_attachments where record_id = ?`,
      [recordId],
    )) as RowDataPacket[];
 
    return { ...rows[0], prescriptionItems, attachments };
  }

  async getPaymentHistory(patientId: number) {
    return query(
      `select
        p.payment_id, p.amount, p.payment_method, p.status, p.transaction_id,
        a.appointment_id, a.slot_date, a.start_time, a.end_time,
        a.appointment_type, a.appointment_status, a.chief_complaint
        from payments p
        join appointments a on p.appointment_id = a.appointment_id
        where a.patient_id = ?
        order by p.created_at desc`,
      [patientId],
    );
  }

  async getPaymentHistoryPaginated(patientId: number, pagination: { page: number; limit: number }) {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.max(1, pagination.limit || 10);
    const offset = (page - 1) * limit;
    const safeLimit = Number(limit) || 10;
    const safeOffset = Number(offset) || 0;

    const rows = (await query(
      `select
        p.payment_id, p.amount, p.payment_method, p.status, p.transaction_id,
        a.appointment_id, a.slot_date, a.start_time, a.end_time,
        a.appointment_type, a.appointment_status, a.chief_complaint
        from payments p
        join appointments a on p.appointment_id = a.appointment_id
        where a.patient_id = ?
        order by p.created_at desc
        limit ${safeLimit} offset ${safeOffset}`,
      [patientId],
    )) as RowDataPacket[];

    const totalRows = (await query(
      `select count(*) as total from payments p join appointments a on p.appointment_id = a.appointment_id where a.patient_id = ?`,
      [patientId],
    )) as RowDataPacket[];

    return { rows, total: Number(totalRows[0]?.total || 0) };
  }

  async getHospitals() {
    const rows = await query('SELECT * FROM hospitals ORDER BY hospital_name ASC') as RowDataPacket[];
    return rows;
  }
}
