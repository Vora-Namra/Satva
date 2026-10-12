import { Router } from "express";
import { Routes } from "../../common/interfaces/routes.interfaces.js";
import { StaffController } from "./staff.controller.js";
import { AdminController } from "../admin/admin.controller.js";
import { staffAuth } from "../../common/middlewares/auth.middleware.js";
import { validateRequestBody } from "../../common/middlewares/validation.middleware.js";
import { paymentStatusSchema } from "./validators/staff.validators.js";

export class StaffRoutes implements Routes {
  path: string = "/staff";
  router: Router = Router();
  staffController = new StaffController();

  constructor() {
    this.initializationRoutes();
  }
  private initializationRoutes(): void {
    // use this way for
    // this.router.post('/register',middleware,this.contoller.register)
    this.router.use(staffAuth);
    this.router.get('/fetchDoctors', this.staffController.fetchDoctors)
    this.router.get('/fetchPatients', this.staffController.fetchPatients)
    this.router.get('/stats', this.staffController.fetchStatsOfHospital)
    this.router.get('/fetchAppointments', this.staffController.fetchAppointments)
    this.router.get('/appointments/:appointment_id', this.staffController.fetchAppointment);
    this.router.get('/doctors/:doctorId', this.staffController.viewDoctor);
        this.router.get('/patients/:patientId',this.staffController.fetchPatientDetails);
this.router.get('/appointments/confirm/:confirmation_no',  this.staffController.getAppointmentByConfirmationNo);
this.router.put('/appointments/:appointment_id/checkin',   this.staffController.checkInPatient);
this.router.put('/appointments/:appointment_id/payment', validateRequestBody(paymentStatusSchema), this.staffController.markPaymentDone);
this.router.put('/appointments/:appointment_id/noshow', this.staffController.markNoShow);


  }

}