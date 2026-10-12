import { catchAsync } from "../../common/helpers/catch-async.js";
import { Request,Response } from "express";
export class StaffPageController{
    renderDoctorsPage = catchAsync(async(req:Request,res:Response)=>{
        res.render('staff/doctors');
    })
      renderPatientsPage = catchAsync(async(req:Request,res:Response)=>{
        res.render('staff/patients');
    })
    renderAppointments = catchAsync(async(req:Request,res:Response)=>{
        res.render('staff/appointments');
    })
       renderSingleAppointmentPage = catchAsync(async(req:Request,res:Response)=>{
        res.render('staff/view_single_appointment');
    })
    renderSingleDoctorPage = catchAsync(async(req:Request,res:Response)=>{
        res.render('staff/view_single_doctor')
    })
    renderSinglePatientPage = catchAsync(async(req:Request,res:Response)=>{
        res.render('staff/view_single_patient')
    })
}