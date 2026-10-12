import { Router } from "express";
import { Routes } from "../../common/interfaces/routes.interfaces.js";
import { StaffPageController } from "./staff.page.controller.js";

export class StaffPageRoutes implements Routes {
  path = "/staff";
  router = Router();
private page = new StaffPageController();

  constructor() {
    this.init();
  }

  private init(): void {
    this.router.get('/doctors',this.page.renderDoctorsPage)
    this.router.get('/patients',this.page.renderPatientsPage)
    this.router.get('/appointments',this.page.renderAppointments)
    this.router.get('/appointments/:appointment_id',this.page.renderSingleAppointmentPage);
    this.router.get('/doctor/:doctorId',this.page.renderSingleDoctorPage);
    this.router.get('/patients/:patientId',this.page.renderSinglePatientPage);

  }
}