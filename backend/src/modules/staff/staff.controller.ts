import { Request,Response } from "express";  
import { catchAsync } from "../../common/helpers/catch-async.js";
import { AuthRequest } from "../../common/middlewares/auth.middleware.js";
import { StaffService } from "./staff.service.js";
import { generalResponse } from "../../common/helpers/general-response.js";
import { calculatePercentageChange } from "../admin/utils/stats.utils.js";
  
  export class StaffController{
private staffService = new StaffService();
private async getHospitalIdFromReq(req: Request): Promise<number> {
    const user_id    = (req as AuthRequest).user.id;
    console.log(user_id)
    const hospital_id = await this.staffService.getHospitalId(user_id);
    if (!hospital_id) throw new Error('Hospital not found for this admin');
    return hospital_id;
  }


 fetchDoctors = catchAsync(async (req: Request, res: Response) => {
  const user_id     = (req as AuthRequest).user.id;
  const hospital_id = await this.staffService.getHospitalId(user_id);

  const result = await this.staffService.fetchDoctorsByHospitalId(hospital_id, req.query as any);

  generalResponse({
    res,
    data:       result,
    message:    'Doctors fetched successfully',
    statusCode: 200,
  });
});

     fetchPatients = catchAsync(async (req: Request, res: Response) => {
        const hospital_id = await this.getHospitalIdFromReq(req);
        const patients = await this.staffService.fetchPatients(hospital_id);
    generalResponse({ res,
         data: patients, 
         message: "Patients fetched successfully",
          statusCode: 200 });
  });


  fetchStatsOfHospital = catchAsync(async (req: Request, res: Response) =>  {
     const hospital_id = await this.getHospitalIdFromReq(req);
  
    const statsArray:any = await this.staffService.fetchStats(hospital_id);
    
    // 1. Safely extract the single stats object from the database array result
    const rawStats = statsArray && statsArray.length > 0 ? statsArray[0] : null;
  
    if (!rawStats) {
       generalResponse({
        res,
        data: {
          today_appointments: 0, appt_change: '0%',
          active_patients: 0, patients_change: '0%',
          revenue_today: '0.00', revenue_change: '0%',
          active_doctors: 0, doctors_change: '0%'
        },
        message: `No stats found for this hospital.`,
        statusCode: 200
      });
    }
  
    // 2. Map and compute percentage changes exactly as expected by public/js/stats.js
    const formattedStats = {
      today_appointments: rawStats.today_appointments,
      appt_change: calculatePercentageChange(rawStats.today_appointments, rawStats.yesterday_appointments),
  
      active_patients: rawStats.active_patients,
      patients_change: calculatePercentageChange(rawStats.active_patients, rawStats.patients_yesterday),
  
      revenue_today: rawStats.revenue_today, // Kept as string format "300.00" for your NumberFormatter on frontend
      revenue_change: calculatePercentageChange(rawStats.revenue_today, rawStats.revenue_yesterday),
  
      active_doctors: rawStats.active_doctors,
      doctors_change: calculatePercentageChange(rawStats.active_doctors, rawStats.doctors_yesterday)
    };
  
    // 3. Dispatch structured clean data back
    generalResponse({
      res,
      data: formattedStats,
      message: `Stats fetched and formatted successfully`,
      statusCode: 200
    });
  });
  
  
fetchAppointments = catchAsync(async (req: Request, res: Response) => {
  const user_id      = (req as AuthRequest).user.id;
  const hospital_id  = await this.staffService.getHospitalId(user_id);

  const result = await this.staffService.fetchAppointments(hospital_id, req.query as any);

  generalResponse({
    res,
    data:       result,
    message:    'Appointments fetched successfully',
    statusCode: 200,
  });
});
    

fetchAppointment = catchAsync(async(req:Request,res:Response)=>{
  const appointment_id = Number(req.params.appointment_id);
  const appointment = await this.staffService.fetchAppointment(appointment_id);
  generalResponse({
    res,
    data:appointment,
    message:'Appointment fetched successfully',
    statusCode:200
  })
})

 viewDoctor = catchAsync (async(req:Request,res:Response)=>{
        const doctor_id =  Number(req.params.doctorId);
        const doctor = await this.staffService.fetchDoctorFromId(doctor_id);
        generalResponse({
            res,
            data:doctor,
            message:"Doctor Fetched from ID",
            statusCode:200
        })
    })

     fetchPatientDetails = catchAsync(async(req:Request,res:Response)=>{
        const patient_id = Number(req.params.patientId);
        const patient = await this.staffService.fetchPatientDetails(patient_id);
        generalResponse({
            res,
            data:patient,
            message:`Patient Fetched successfully`,
            statusCode:200
        })
    })


getAppointmentByConfirmationNo = catchAsync(async (req: Request, res: Response) => {
  const { confirmation_no } = req.params;
  const appointment = await this.staffService.getAppointmentByConfirmationNo(String(confirmation_no));

  if (!appointment) {
     generalResponse({ res, data: null, message: 'No appointment found', statusCode: 404 });
  }

  generalResponse({ res, data: appointment, message: 'Appointment fetched', statusCode: 200 });
});

checkInPatient = catchAsync(async (req: Request, res: Response) => {
  const appointment_id = Number(req.params.appointment_id);
  const result = await this.staffService.checkInPatient(appointment_id);
  generalResponse({ res, data: result, message: 'Patient checked in successfully', statusCode: 200 });
});



markPaymentDone = catchAsync(async (req: Request, res: Response) => {
  const appointment_id = Number(req.params.appointment_id);
  const result = await this.staffService.markPaymentDone(appointment_id);

  generalResponse({ res, data: result, message: 'Payment marked as done', statusCode: 200 });
});

markNoShow = catchAsync(async (req: Request, res: Response) => {
  const appointment_id = Number(req.params.appointment_id);
  const result = await this.staffService.markNoShow(appointment_id);
  generalResponse({ res, data: result, message: 'Marked as no show', statusCode: 200 });
});

  }