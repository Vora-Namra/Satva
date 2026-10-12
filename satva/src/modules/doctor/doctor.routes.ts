import { Router } from "express";
import { Routes } from "../../common/interfaces/routes.interfaces.js";
import { DoctorController } from "./doctor.controller.js";
import { doctorAuth } from "../../common/middlewares/auth.middleware.js";
import { uploadDoctorProfile, uploadMedicalRecords } from "../../utils/multer.js";




export class DoctorRoutes implements Routes{  

path:string='/doctor'
router:Router=Router()
doctorController=new DoctorController()

constructor(){
    this.init()
}

private init():void{
                        
    // use doctorAuth
    this.router.get('/get-doctor',doctorAuth,this.doctorController.getDoctor)
    this.router.get('/get-appointment',doctorAuth,this.doctorController.getAppointmentByDate)
    this.router.get('/get-dashboard-data',doctorAuth,this.doctorController.getDoctorDashboard)
    this.router.get('/get-weekly-schedule',doctorAuth,this.doctorController.getWeeklySchedule)
    this.router.get("/get-patient-list",doctorAuth,this.doctorController.getPatientList)
    this.router.get('/get-patient-all-medical-records/:patient_id',doctorAuth,this.doctorController.getPatientAllMedicalRecords)
    this.router.get('/get-patient-all-medical-record-data/:appointment_id',doctorAuth,this.doctorController.getPatientMedicalData)
    this.router.get("/get-specialities",doctorAuth,this.doctorController.getSpecialites)
    this.router.post('/post-weekly-schedule',doctorAuth,this.doctorController.postWeeklySchedule)
    this.router.post('/post-medical-records',doctorAuth,uploadMedicalRecords.array('files'),this.doctorController.postPatientMedicalRecords)
    
    this.router.post("/profile/update",doctorAuth,uploadDoctorProfile.single('profile_image'),this.doctorController.postProfileData)
    this.router.get("/get-hospital-details",doctorAuth,this.doctorController.getHospitalDetails)
    this.router.patch("/appointment-status-update",doctorAuth,this.doctorController.updateAppointmentStatus)
    this.router.post('/apply-doctor-leave',doctorAuth,this.doctorController.postLeaves)
    this.router.delete("/cancel-doctor-leave",doctorAuth,this.doctorController.deleteLeaves)

} 


}