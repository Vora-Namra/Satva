import { Router } from "express";
import { Routes } from "../../common/interfaces/routes.interfaces.js";
import { AdminController } from "./admin.controller.js";
import { adminAuth } from "../../common/middlewares/auth.middleware.js";
import { validateRequestBody } from "../../common/middlewares/validation.middleware.js";
import {
  addDoctorSchema,
  editDoctorSchema,
  toggleDoctorStatusSchema,
  updateHospitalSettingsSchema,
  addStaffSchema,
} from "./validators/admin.validators.js";


export class AdminRoutes implements Routes {
  path: string = "/admin";
  router: Router = Router();
  adminController = new AdminController();

  constructor() {
    this.initializationRoutes();
  }
  private initializationRoutes(): void {
    // use this way for
    // this.router.post('/register',middleware,this.contoller.register)
    this.router.use(adminAuth)
    this.router.get('/showDoctors', this.adminController.fetchDoctors);
    this.router.post('/addDoctor', validateRequestBody(addDoctorSchema), this.adminController.addDoctor);
    this.router.get('/doctors/:doctorId', this.adminController.viewDoctor);
    this.router.get('/fetchpatients', this.adminController.fetchPatients)
    this.router.put('/doctors/:doctorId', validateRequestBody(editDoctorSchema), this.adminController.editDoctor);
    this.router.get('/fetchAppointments', this.adminController.fetchAppointments);
    this.router.get('/fetchAuditLogs', this.adminController.fetchAuditLogs);
    this.router.get('/fetchSpecialties', this.adminController.fetchSpecialties);
    this.router.put('/toggleDoctorStatus/:id', validateRequestBody(toggleDoctorStatusSchema), this.adminController.toggleDoctorStatus);
    this.router.get('/patients/:patientId',this.adminController.fetchPatientDetails);
    this.router.get('/hospital',this.adminController.fetchHospitalDetails);
    this.router.put('/hospital', validateRequestBody(updateHospitalSettingsSchema), this.adminController.updateHospitalSettings);
    this.router.get('/stats',this.adminController.fetchStatsOfHospital);
    this.router.get('/appointments/:appointment_id',this.adminController.fetchAppointment);
    this.router.post('/addStaff', validateRequestBody(addStaffSchema), this.adminController.addStaff);
    this.router.get('/fetchStaff',this.adminController.fetchStaff);
    this.router.get('/getStaffById/:staff_id',this.adminController.getStaffById)
    
  }

}