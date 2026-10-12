import { Filters } from "../admin/interfaces/filters.interface.js";
import { StaffRepository } from "./staff.repository.js";

export class StaffService{
   private staffRepo = new StaffRepository();


   async getHospitalId (user_id : number){
      const {hospital_id} = await this.staffRepo.fetchHospitalIdFromStaffId(user_id);
      return hospital_id;
     }

     // staff.service.ts

async fetchDoctorsByHospitalId(hospital_id: number, query: {
  search?:         string;
  specialty_id?:   string;
  is_deactivated?: string;
  page?:           string;
  limit?:          string;
}) {
  const filters = {
    search:         query.search,
    specialty_id:   query.specialty_id ? Number(query.specialty_id) : undefined,
    is_deactivated: query.is_deactivated !== undefined
      ? query.is_deactivated === 'true'
      : undefined,
    page:  Number(query.page)  || 1,
    limit: Number(query.limit) || 10,
  };

  const { rows, total } = await this.staffRepo.fetchDoctorsByHospitalId(hospital_id, filters);

  return {
    data:  rows,
    total: Number(total),
    page:  filters.page,
    limit: filters.limit,
  };
}

     async fetchPatients(hospital_id: number) {
    return await this.staffRepo.fetchPatientsByHospital(hospital_id);
  }

   async fetchStats(hospital_id:number){
    const stats = await this.staffRepo.fetchStatsOfHospital(hospital_id);
    return stats;
  }

   
async fetchAppointments(hospital_id: number, query: {
  date?:      string;
  doctor_id?: string;
  status?:    string;
  page?:      string;
  limit?:     string;
}) {
  const filters:Filters = {
    date:      query.date,
    doctor_id: query.doctor_id ? Number(query.doctor_id) : undefined,
    status:    query.status,
    page:      Number(query.page)  || 1,
    limit:     Number(query.limit) || 10,
  };

  const { rows, total } = await this.staffRepo.fetchAppointments(hospital_id, filters);

  return {
    data:  rows,
    total: Number(total),
    page:  filters.page,
    limit: filters.limit,
  };
}
  async fetchAppointment(appointment_id:number){
    const appointment = await this.staffRepo.fetchAppointmentDetails(appointment_id);
    return appointment;
  }
  async fetchDoctorFromId(doctor_id:number){
  const doctor =  await this.staffRepo.getDoctorById(doctor_id);
  return doctor;
  }

   async fetchPatientDetails(patient_id:number){
    const patient= await this.staffRepo.fetchPatientDetailsById(patient_id);
    return patient;
  }

  // staff.service.ts

async getAppointmentByConfirmationNo(confirmation_no: string) {
  return await this.staffRepo.findAppointmentByConfirmationNo(confirmation_no);
}

async checkInPatient(appointment_id: number) {
  const appointment = await this.staffRepo.findAppointmentById(appointment_id);

  if (!appointment) throw new Error('Appointment not found');

  // block check in if payment not done
  if (appointment.payment_status !== 'SUCCESS') {
    console.log(appointment.payment_status)
    throw new Error('Payment is pending. Cannot check in patient.');
  }


  // block if status not CONFIRMED
  if (appointment.appointment_status !== 'CONFIRMED') {
    throw new Error(`Cannot check in. Current status is ${appointment.appointment_status}`);
  }

  await this.staffRepo.updateAppointmentStatus(appointment_id, 'CHECKED_IN');
  await this.staffRepo.insertStatusHistory({
    appointment_id,
    old_status:         'CONFIRMED',
    new_status:         'CHECKED_IN',
    changed_by_user_id: null,
    remarks:            'Patient checked in at reception',
  });

  return await this.staffRepo.findAppointmentById(appointment_id);
}

// staff.service.ts

async markPaymentDone(appointment_id: number) {
  try {
     await this.staffRepo.updatePaymentStatus(appointment_id, 'SUCCESS');
  return await this.staffRepo.findAppointmentById(appointment_id);
  } catch (error) {
      console.log(error)
  }
 
}

async markNoShow(appointment_id: number) {
  await this.staffRepo.updateAppointmentStatus(appointment_id, 'NO_SHOW');
  await this.staffRepo.insertStatusHistory({
    appointment_id,
    old_status:         'CONFIRMED',
    new_status:         'NO_SHOW',
    changed_by_user_id: null,
    remarks:            'Patient did not arrive',
  });
  return await this.staffRepo.findAppointmentById(appointment_id);
}


}