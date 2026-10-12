import { Request,Response } from "express"
import { AuthRequest } from "../../common/middlewares/auth.middleware.js"
import path from "node:path"

export class DoctorPageController{

    renderDashboard=(req:Request,res:Response)=>{
        res.render("doctor/dashboard",{user:(req as any).user})
    }

    renderProfile=(req:Request,res:Response)=>{
        res.render("doctor/doctor-profile",{user:(req as any).user})
    }

    renderEditProfile=(req:Request,res:Response)=>{
        res.render("doctor/edit-profile",{user:(req as any).user})
    }

    renderDoctorLogin=(req:Request,res:Response)=>{
        res.render("doctor/doctorLogin")
    }

    renderCreateMedicalRecords=(req:Request,res:Response)=>{

        res.render("doctor/create_medical_records")
    }

    renderViewMedicalRecordsByAppointment=(req:Request,res:Response)=>{

        res.render("doctor/view_medical_record")
    }
    renderFile=(req:Request,res:Response)=>{
       
        const file_path=req.query.file_path || ''
        const file_location=path.join(import.meta.dirname+'../../../../'+file_path)
        res.sendFile(file_location)
    }

    renderPatientMedicalRecords=(req:Request,res:Response)=>{

        res.render("doctor/patient_view_medical_record")
    }
    
}