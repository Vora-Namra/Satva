import {Router} from 'express'
import { Routes } from '../../common/interfaces/routes.interfaces.js'
import { DoctorPageController } from './doctor.page.controller.js';



export class DoctorPageRoutes implements Routes{
path='/doctor';
router=Router();
private page =new DoctorPageController()

constructor(){
    this.init()
}

private init():void{
    this.router.get("/dashboard",this.page.renderDashboard)
    this.router.get("/profile",this.page.renderProfile)
    this.router.get('/profile/edit',this.page.renderEditProfile)
    this.router.get("/login",this.page.renderDoctorLogin)
    this.router.get("/create-medical-record",this.page.renderCreateMedicalRecords)
    this.router.get("/view-medical-record/:appointment_id",this.page.renderViewMedicalRecordsByAppointment)
    this.router.get("/view-file",this.page.renderFile)
    this.router.get("/view-patient-medical-records",this.page.renderPatientMedicalRecords)

}
 
}