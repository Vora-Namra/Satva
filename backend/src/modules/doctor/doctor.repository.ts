import { Console } from "winston/lib/winston/transports/index.js";
import { HttpException, InternalServerException } from "../../common/helpers/http-exception.js";
import { query, query2 } from "../../database/connection.js";
import {
  IDoctorDetails,
  IDoctorLeave,
  IDoctorNotification,
  IDoctorSchedule,
  IMedicalAttachments,
  IMedicalRecordAmmendment,
  IMedicalRecords,
  IPrescriptionItems,
  IPrescriptions,
} from "./doctor.interface.js";
import { QueryResult, ResultSetHeader, RowDataPacket } from "mysql2";

export class DoctorRepo {
  async findDoctorByUserID(user_id: number) {
    const rows: any = await query(
      `
            select * from doctors where user_id=? `,
      [user_id],
    );

    return rows[0];
  }

  async findDoctorQualificationByDoctorID(doctor_id: number) {
    const rows: any = await query(
      `
            select degree,graduation_year,college_name from doctor_qualifications where 
            doctor_id=?`,
      [doctor_id],
    );

    return rows;
  }

  async findDoctorSpecialitesByDoctorID(doctor_id:number){

    const rows:any=await query(` 
      select s.specialty_id,s.specialty_name from doctor_specialties d 
      inner join specialties s 
      on d.specialty_id=s.specialty_id 
      and d.doctor_id=?;
      `,[doctor_id])
      return rows

  }


  async findSpecialities(search:string){

    const rows:any =await query(`select * from specialties where specialty_name like ?`,[`%${search}%`])
    return rows
  }

  async findDoctorScheduleByDoctorID(doctor_id: number, start_date: string) {
    const rows: any = await query(
      `     
            select working_from,working_to,date_format(working_date,'%Y-%m-%d') as working_date,slot_duration
            from doctor_schedules 
            where doctor_id=? and working_date >=?`,
      [doctor_id, start_date],
    );

    return rows;
  }
  
  async findDoctorAppointments(doctor_id: number, slot_date: string) {
    const rows: any = await query(
      `
    with cte as(select a.appointment_id,a.slot_date,SUBSTRING(a.start_time,1,5) as start_time,
    SUBSTRING(a.end_time,1,5) as end_time,a.appointment_type,a.appointment_status,a.chief_complaint,
    a.confirmation_no,a.created_at,CONCAT(p.first_name,' ',p.last_name) as 'patient_name',timestampdiff(year,p.dob,current_date) as age,p.patient_id 
    from appointments a 
    inner join patients p on a.patient_id=p.patient_id 
    where a.doctor_id=? and slot_date=?)
    select c.* , case 
    when c.appointment_type='TELEMEDICINE' then ts.meeting_link 
    else ''
    end as link
    from cte c left join telemedicine_sessions ts on c.appointment_id=ts.appointment_id 
    order by  c.start_time; `,
      [doctor_id, slot_date],
    );

    return rows;
  }

  async insertORUpdateDoctorSchedule(data: IDoctorSchedule,doctor_id:number) {
    const result: any = await query(
      `insert into doctor_schedules(doctor_id,working_date,working_from,working_to,slot_duration)
         values (?,?,?,?,?) as new_row
         on duplicate key update
         doctor_id=new_row.doctor_id,
         working_date=new_row.working_date,
         working_from=new_row.working_from,
         working_to=new_row.working_to,
         slot_duration=new_row.slot_duration
         `,
      [
        doctor_id,
        data.working_date,
        data.working_from,
        data.working_to,
        data.slot_duration,
      ],
    );

    return result;
  }

  async insertDoctorLeaves(data: IDoctorLeave,doctor_id:number) {
    const result: any = await query(
      `insert into doctor_leaves(doctor_id,from_date,to_date,reason)
        values(?,?,?,?)`,
      [doctor_id, data.from_date, data.to_date, data.reason],
    );
  }

  async DoctorDashBoardData(doctor_id: number) {
    const rows: any = await query(
      `    
select 
	COUNT(a.appointment_status)-COALESCE(SUM(CASE WHEN a.appointment_status='CANCELLED' THEN 1 WHEN a.appointment_status='RESCHEDULED' THEN 1 ELSE 0 END),0) as 'TOTAL APPOINTMENT',
    COUNT(CASE WHEN a.appointment_status = 'CONFIRMED' OR a.appointment_status='CHECKED_IN' THEN 1 END) AS 'UPCOMING',
    COUNT(CASE WHEN a.appointment_status = 'CANCELLED' THEN 1 END) AS 'CANCELLED',
    COUNT(CASE WHEN a.appointment_status = 'RESCHEDULED' THEN 1 END) AS 'RESCHEDULED'
 from appointments a inner join doctors d on a.doctor_id=d.doctor_id and a.slot_date=current_date where d.doctor_id=?;`,
      [doctor_id],
    );

    return rows[0];
  }

  async findDoctorNotification(doctor_id: number) {
    const rows: any = await query(
      `
        select doctor_id,
        notification_type,
        notification_message,
        sent_at 
        notifications where doctor_id=? and is_read=false 
        order by created_at desc;
        `,
      [doctor_id],
    );

    return rows[0];
  }

  async insertDoctorNotification(data: IDoctorNotification) {
    const rows: any = await query(
      `
    
    insert into notifications(doctor_id,notification_type,notification_message)
    values(?,?,?)
    `,
      [data.doctor_id, data.notification_type, data.notification_message],
    );
  }

  async insertMedicalRecords(data: IMedicalRecords) {
    const result: any = await query(
      `
        
        insert into medical_records(appointment_id,
        doctor_id,patient_id,diagnosis,examination_notes)
        values(?,?,?,?,?)
        `,
      [
        data.appointment_id,
        data.doctor_id,
        data.patient_id,
        data.diagnosis,
        data.examination_notes,
      ],
    );

    return result.insertId;
  }

  async insertMedicalRecordsAttactments(data:any) {
    const result: any = await query2(
      `
        insert into medical_record_attachments
        (record_id,file_name,file_path)
        values ?
        `,
      [data],
    );

    return result[0];
  }

  async insertMedicalRecordAmmendment(data: IMedicalRecordAmmendment) {
    const result: any = await query(
      `
        
        insert into medical_record_ammendments(record_id,ammended_by_doctor_id,
        field_name,old_value,new_value,reason) values (?,?,?,?,?,?)
        
        `,
      [
        data.record_id,
        data.ammended_doctor_id,
        data.field_name,
        data.old_value,
        data.new_value,
        data.reason,
      ],
    );

    return result[0];
  }

  async insertPrescription(data: IPrescriptions) {
    const result: ResultSetHeader = await query(
      `insert into prescriptions(record_id,notes) 
        values(?,?)`,
      [data.record_id, data.notes],
    ) as ResultSetHeader;

    return result.insertId;
  }

  async insertPrescriptionItems(data:(string|number)[][]) {
    const result: any = await query2(
      `insert into prescription_items(prescription_id,medicine_name,dosage,
        frequency,duration,instructions) values ?`,
      [data],
    );

    return result[0];
  }

  async fetchPatientMedicalRecords(patient_id: number) {
    const rows: any = await query(
      `

        select p.prescription_id,m.record_id,a.appointment_id,m.diagnosis,
        m.examination_notes,
        concat(d.first_name,d.last_name) as 'Doctor Name',
        a.slot_date 
        from medical_records m 
        inner join doctors d on m.doctor_id=d.doctor_id 
        inner join appointments a on a.appointment_id=m.appointment_id 
        inner join prescriptions p on m.record_id=p.record_id
        where m.patient_id=?
        order by a.slot_date desc
        `,
      [patient_id],
    );

    return rows[0];
  }

  async fetchPatientAppointmentAttachment(appointment_id: number) {
    const rows: any = await query(
      `
      select a.appointment_id,a.document_name,a.document_path 
      from appointment_documents a
      where a.appointment_id=?
      order by a.uploaded_at desc
    `,
      [appointment_id],
    );

    return rows[0];
  }

  async fetchPatientMedicalRecordAttachment(appointment_id: number) {
    const rows: any = await query(
      `
    
    select mr.file_name,mr.file_path from 
    medical_records m 
    inner join medical_record_attachments mr
    on m.record_id=mr.record_id and m.appointment_id=?
    `,
      [appointment_id],
    );

    return rows[0];
  }

  async fetchDoctorStatus(doctor_id: number) {
    const rows: any = await query(
      `
      select from, to ,status_date,reason,status from doctor_status where doctor_id=?
      `,
      [doctor_id],
    );

    return rows[0];
  }

  async fetchPatientList(doctor_id: number) {
    const rows: any = await query(
      `
    select p.patient_id,p.first_name,p.last_name,p.blood_group,timestampdiff(year, p.dob, curdate()) as age ,p.gender  from patients p where exists(
    select 1 from appointments a where a.patient_id=p.patient_id and a.doctor_id=?)`,
      [doctor_id],
    );

    return rows;
  }

  async fetchPatientAllMedicalRecords(patient_id: number, doctor_id: number) {
    // this fetches all medical records
    const rows: any = await query(
      `
     select m.record_id,m.diagnosis,m.examination_notes,
     date_format(m.created_at,'%Y-%m-%d') from medical_records m where m.patient_id=? and m.doctor_id=?
      `,
      [patient_id, doctor_id],
    );

    return rows;
  }

  async fetchPatientMedicalAttachments(record_id: number) {
    // this fethces all medical records data like attachments

    const rows: any = await query(
      `select file_name,file_path from medical_record_attachments where record_id=?`,
      [record_id],
    );
    

    return rows;
  }

  async fetchPatientPrescriptions(record_id: number) {
    // this fetches all prescription from record_id

    const rows: any = await query(
      `select prescription_id,notes from prescriptions where record_id=?`,
      [record_id],
    );
    return rows[0];
  }

  async fetchPatientPrescriptionsItems(prescription_id:number){

      const rows:any=await query(`
        select medicine_name,dosage,frequency,duration,instructions 
        from prescription_items where prescription_id=?
        `,[prescription_id])

        return rows
  }

  async updateDoctorDetail(data:IDoctorDetails){

    const result=await query(`update doctors set first_name=?, 
      last_name=?,
      experience_years=?,
      consultation_fee=?,
      bio=? ,
      profile_path=? 
      where doctor_id=?`,[
        data.first_name,
        data.last_name,
        data.experience_years,
        data.consultation_fee,
        data.bio,
        data.profile_path,
        data.doctor_id
      ])
     
      
      return result
  
  }

  async updateDoctorQualifications(data:any){
  
    const result =await query(`delete from doctor_qualifications where doctor_id=?`,[data[0][0]])

    if(!result){
      throw new InternalServerException('Unable to update')
    }
    else{
    const result1=await query2(`insert into doctor_qualifications(doctor_id,degree,graduation_year,college_name) values?`,[data])
      return result1
    }

  }

  async updateDoctorSpecialities(data:any){
   
    const result=await query(`delete from doctor_specialties where doctor_id=?`,[data[0][0]])

    if(!result){
      throw new InternalServerException(`unable to update Specialites`)
    }
    else{
      const result1=await query2(`insert into doctor_specialties(doctor_id,specialty_id) values?`,[data])
      return result1
    }

  }

async getFileDetails(doctor_id:number){
  const rows:RowDataPacket[]=await query(`Select profile_path from doctors where doctor_id=?`,[doctor_id]) as RowDataPacket[]
  return rows[0]
}

async getHosptialDetails(user_id:number){
  const rows=await query(`Select d.doctor_id, d.hospital_id,h.hospital_name from hospitals h inner join doctors d on d.hospital_id=h.hospital_id where d.user_id=?`,[user_id]) as RowDataPacket[]
  return rows[0]
}

async getInProgressStatus(doctor_id:number):Promise<{progress_status:number}>{

  const rows=await query(`Select count(*) as progress_status from appointments where doctor_id=? and appointment_status='IN_PROGRESS and slot_date=current_date'`,[doctor_id]) as RowDataPacket[]
  return {progress_status:rows[0]?.progress_status??0}
}

async setAppointmentStatus(appointment_id:number,appointment_status:string){
  const result =await query('Update appointments set appointment_status=? where appointment_id=?',[appointment_status,appointment_id]) as ResultSetHeader
  return result 
}

async findDoctorLeavesByDoctorId(doctor_id:number){

  const rows=await query('select leave_id,from_date, to_date ,reason from doctor_leaves where doctor_id=? and to_date>=current_date',[doctor_id]) as RowDataPacket

  return rows

}

async cancelLeave(leave_id:number){

  const result=await query(`Delete from doctor_leaves where leave_id= ?`,[leave_id]) as ResultSetHeader
  return result 

}

async checkLeaveExistBetween(from_date:Date,to_date:Date,doctor_id:number):Promise<boolean>{

  const result=await query(`
    SELECT COUNT(*) as isExist
FROM doctor_leaves 
WHERE doctor_id = ? 
  AND (
    ? BETWEEN from_date AND to_date
    OR 
    ? BETWEEN from_date AND to_date
  );
    
    `,[doctor_id,from_date,to_date]) as RowDataPacket

   if(!result || result==undefined){
    return false 
   }
   return result[0].isExist?true:false
}

async getPatientAndDoctorIdByAppointmentId(appointment_id:number){
  const rows =await query(`select patient_id,doctor_id from appointments where appointment_id=?`,[appointment_id]) as RowDataPacket

  return rows[0]

}

async getMedicalRecordsByAppointmentId(appointment_id:number){
  const rows =await query("select record_id,doctor_id,patient_id,diagnosis,examination_notes from medical_records where appointment_id=?",[appointment_id]) as RowDataPacket
  return rows[0]
}

 async fetchPatientAllAppointmentByDoctor(patient_id: number, doctor_id: number) {
    
    const rows: any = await query(
      `
     select appointment_id,slot_date, chief_complaint,appointment_type from appointments where patient_id=? and doctor_id=?
      `,
      [patient_id, doctor_id],
    );

    return rows;
  }


}
