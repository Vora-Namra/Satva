
import {
  AppointmentStatus,
  IDoctorDetails,
  IDoctorLeave,
  IDoctorNotification,
  IDoctorRecordsFill,
  IDoctorSchedule,
  IMedicalAttachments,
  IMedicalRecords,
  IPrescriptionItems,
  IPrescriptions,
} from "./doctor.interface.js";
import { DoctorRepo } from "./doctor.repository.js";
import {
  BadRequestException,
  InternalServerException,
  NotFoundException,
 
} from "../../common/helpers/http-exception.js";
import { getNextWeekStartingDay } from "./utils/doctor.utilts.js";
import { AuditService } from "../../services/audit.service.js";


export class DoctorService {
  private doctorRepo = new DoctorRepo();
  private auditService = new AuditService();


  async getDoctor(user_id: number) {
    const doctorDetails = await this.doctorRepo.findDoctorByUserID(user_id);
    const docQualifictionDetail =
      await this.doctorRepo.findDoctorQualificationByDoctorID(
        doctorDetails.doctor_id,
      );
    const docSpecialities =
      await this.doctorRepo.findDoctorSpecialitesByDoctorID(
        doctorDetails.doctor_id,
      );
    return { doctorDetails, docQualifictionDetail, docSpecialities };
  }

  async getSpecialties(search: string) {
    const specialities_list = await this.doctorRepo.findSpecialities(search);
    return { specialities_list };
  }

  async getDoctorId(user_id: number) {
    if (!user_id) {
      throw new NotFoundException("user not found");
    }
    const doctorDetails = await this.doctorRepo.findDoctorByUserID(user_id);
    return doctorDetails.doctor_id;
  }

  async getAppointmentByDate(user_id: number,appointment_date:string) {
    const doctor_id = await this.getDoctorId(user_id);
    const date = appointment_date?appointment_date:new Date().toISOString();
    const current_date = String(date.split("T")[0]);
    const appointment_list = await this.doctorRepo.findDoctorAppointments(
      doctor_id,
      current_date,
    );
    return { appointment_list };
  }

  async getDoctorDashboardData(user_id: number) {
    const doctor_id = await this.getDoctorId(user_id);
    const dashboard_data = await this.doctorRepo.DoctorDashBoardData(doctor_id);

    return { dashboard_data };
  }

  async getWeeklySchedule(user_id: number) {
    const doctor_id = await this.getDoctorId(user_id);
    const start_date = getNextWeekStartingDay();

    const weekScheduleList = await this.doctorRepo.findDoctorScheduleByDoctorID(
      doctor_id,
      start_date,
    );
    const doctorLeavesSchedule=await this.doctorRepo.findDoctorLeavesByDoctorId(doctor_id)

    return { weekScheduleList ,doctorLeavesSchedule};
  }

  async setWeeklySchedule(data: IDoctorSchedule,user_id:number) {
    if (!data) {
      throw new NotFoundException("Data is empty");
    }
    const doctor_id=await this.getDoctorId(user_id)

    const result = await this.doctorRepo.insertORUpdateDoctorSchedule(data,doctor_id);

    await this.auditService.log({
      performed_by_user_id: user_id,
      action: "SET_WEEKLY_SCHEDULE",
      entity_name: "doctor",
      entity_id: String(user_id),
      ip_address:"127.0.0.1"
    });

    return { result };
  }

  async setLeaves(data: IDoctorLeave, user_id: number) {
  const doctor_id: number = await this.getDoctorId(user_id);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilNextMonday = ((8 - dayOfWeek) % 7) || 7;

  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilNextMonday);
  nextMonday.setHours(0, 0, 0, 0); // normalize to midnight

  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  nextSunday.setHours(23, 59, 59, 999); // end of day

  const fromDate = new Date(data.from_date);
  const toDate = new Date(data.to_date);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new BadRequestException('Invalid date format');
  }

  const isWithinNextWeek =
    fromDate >= nextMonday &&
    toDate <= nextSunday &&
    fromDate <= toDate;

  if (!isWithinNextWeek) {
    throw new BadRequestException('Leave can only be applied for next week');
  }

  const checkIsLeaveExistsBetween: boolean =
    await this.doctorRepo.checkLeaveExistBetween(data.from_date, data.to_date, doctor_id);

  if (checkIsLeaveExistsBetween) {
    throw new BadRequestException(
      'Your start date or end date overlaps with an existing leave. Cancel that leave first.',
    );
  }

  await this.auditService.log({
      performed_by_user_id: user_id,
      action: "SET_DOCTOR_LEAVES",
      entity_name: "doctor",
      entity_id: String(user_id),
      ip_address:"127.0.0.1"
    });

  const result = await this.doctorRepo.insertDoctorLeaves(data, doctor_id);
  return { result };
}

  async getDoctorNotification(doctor_id: number) {
    const notifications =
      await this.doctorRepo.findDoctorNotification(doctor_id);
    return { notifications };
  }

  async insertDoctorNotification(data: IDoctorNotification) {
    const result = await this.doctorRepo.insertDoctorNotification(data);
    return { result };
  }

  async insertMedicalRecords(medical_records: IMedicalRecords) {
    const record_id = await this.doctorRepo.insertMedicalRecords(medical_records);

    return record_id ;
  }

  async insertMedicalRecordsAttachments(
   record_id:number,files:Express.Multer.File[]
  ) 
    { 
      const data=files.map((f)=>([record_id,f.filename,f.path]))
    const result = await this.doctorRepo.insertMedicalRecordsAttactments(data);

    return { result };
  }

  async insertPrescriptions(data: IPrescriptions) {
    const prescription_id = await this.doctorRepo.insertPrescription(data);
    return prescription_id;
  }

  async insertPrescriptionItems(data: IPrescriptionItems[],prescription_id:number) {
    const prescription_items=data.map((d)=>([prescription_id,d.medicine_name,d.dosage,d.frequency,d.duration,d.instructions]))

    const result = await this.doctorRepo.insertPrescriptionItems(prescription_items);
    return { result };
  }

  async getPatientList(user_id: number) {
    const doctor_id = await this.getDoctorId(user_id);
    const result = await this.doctorRepo.fetchPatientList(doctor_id);
    return { result };
  }

  async getPatientAllMedicalRecords(user_id: number, patient_id: number) {
    const doctor_id = await this.getDoctorId(user_id);

    const result = await this.doctorRepo.fetchPatientAllMedicalRecords(
      patient_id,
      doctor_id,
    );
    return { result };
  }

  async getPatientAllMedicalAttachments(record_id: number) {
    const result =
      await this.doctorRepo.fetchPatientMedicalAttachments(record_id);

    return { medical_attachments:result };
  }

  async getPatientMedicalRecordAllPrescription(record_id: number) {
    const prescription =
      await this.doctorRepo.fetchPatientPrescriptions(record_id);
    const prescription_items =
      await this.doctorRepo.fetchPatientPrescriptionsItems(
        prescription.prescription_id,
      );

    return { prescription, prescription_items };
  }

  async postProfileUpdateData(data: any, file: any) {
    const doctor_details=data.doctor_details

    let profile_path=file?.path || 'uploads/doctor_profile/default.png'
    if(!file){
      const result=await this.doctorRepo.getFileDetails(doctor_details.doctor_id)
      if(!result){
        throw new NotFoundException('Image Url Not Found')
      }
      profile_path=result.profile_path
    }
    const docDetail: IDoctorDetails = {
      first_name: doctor_details.first_name,
      last_name: doctor_details.last_name,
      experience_years: Number(doctor_details.experience_years),
      consultation_fee: Number(doctor_details.consultation_fee),
      bio: doctor_details.bio,
        profile_path:profile_path,
      doctor_id:doctor_details.doctor_id
    };

    // unlink files in doctor_proifle
  
    const docQualifictionDetail=data.qualifications.map((q:any,i:number)=>[doctor_details.doctor_id,q.degree,q.graduation_year,q.college_name])
    const docSpecialities=data.specialties.map((q:any,i:number)=>[doctor_details.doctor_id,q.specialty_id])

    const doc_detail_result=await this.doctorRepo.updateDoctorDetail(docDetail)
    const doc_qualification_result=await this.doctorRepo.updateDoctorQualifications(docQualifictionDetail)
    const doctor_specialties_result=await this.doctorRepo.updateDoctorSpecialities(docSpecialities)

    await this.auditService.log({
      performed_by_user_id: data.user_id,
      action: "DOCTOR_PROFILE_UPDATE",
      entity_name: "doctor",
      entity_id: String(data.user_id),
      ip_address:"127.0.0.1"
    });
    
    return {doc_detail_result,doc_qualification_result,doctor_specialties_result}


  }


  async getHospitalDetails(user_id:number){

    const hospital_details=await this.doctorRepo.getHosptialDetails(user_id)
    return {hospital_details}
  }

  async updateAppointmentStatus(user_id:number,appointment_id:number,appointment_status:string){

  if(!appointment_status || appointment_status==='' || appointment_status==undefined){
    throw new BadRequestException('Appointment Status not found')
  }

  if(!appointment_id || appointment_id===undefined){
    throw new BadRequestException("Appointment Id Not Found")
  }

    if(!(appointment_status in AppointmentStatus)){
      throw new BadRequestException('Status type does not exists')
    }
        
    const doctor_id=await this.getDoctorId(user_id)
    

    if(appointment_status==AppointmentStatus.IN_PROGRESS){
      // check if there is still doctor is taking consultation
      const {progress_status}=await this.doctorRepo.getInProgressStatus(doctor_id)
      if(progress_status){
       
        throw new BadRequestException("Please Complete the Existing Consultation or Click the Button to Complete")
      }
    }
    
    const isUpdated=await this.doctorRepo.setAppointmentStatus(appointment_id,appointment_status);

    await this.auditService.log({
      performed_by_user_id: user_id,
      action: "UPDATE_APPOINTMENT_STATUS",
      entity_name: "appointment",
      entity_id: String(user_id),
      ip_address:"127.0.0.1"
    });

    return {isUpdated}

  }



  async deleteLeave(leave_id:number){

    const result =await this.doctorRepo.cancelLeave(leave_id)
    return {result }
  }


  async postRecords(payload:IDoctorRecordsFill, files?:any){

    if(!payload.appointment_id){
      throw new BadRequestException('Appointment Id Missing')
    }
    const {patient_id,doctor_id}=await this.doctorRepo.getPatientAndDoctorIdByAppointmentId(payload.appointment_id)
    if(!patient_id || !doctor_id){
      throw new InternalServerException("Enable to find Patient or Doctor")
    }
    const record_id=await this.insertMedicalRecords({doctor_id:Number(doctor_id),patient_id:Number(patient_id),appointment_id:payload.appointment_id,diagnosis:payload.diagnosis,examination_notes:payload.examination_notes})
    if(!record_id){
      throw new InternalServerException('Enable to insert data')
    }
    const prescription_id=await this.insertPrescriptions({record_id:record_id,notes:payload.notes})
    if(!prescription_id){
      throw new InternalServerException('Enable to insert data')
    }
  
    if(payload.prescription_items!=undefined){
    const result=await this.insertPrescriptionItems(payload.prescription_items,prescription_id)
    }
   

    if(files.length>0){
    const result1=await this.insertMedicalRecordsAttachments(record_id,files)   
    }


    return {}
  }


  async getMedicalRecords(appointment_id:number){

    if(!appointment_id){
      throw new BadRequestException('Appointment Id not found')
    } 
    console.log(appointment_id)
    const result =await this.doctorRepo.getMedicalRecordsByAppointmentId(appointment_id)
    return result

  }

  async getPatientAllAppointmentByDoctor(user_id: number, patient_id: number) {
    const doctor_id = await this.getDoctorId(user_id);

    const result = await this.doctorRepo.fetchPatientAllAppointmentByDoctor(
      patient_id,
      doctor_id,
    );
    return { result };
  }
}
