import { Router } from "express";
import { AdminPageController } from "./admin.page.controller.js";
import { Routes } from "../../common/interfaces/routes.interfaces.js";

export class AdminPageRoutes implements Routes {
  path = "/admin";
  router = Router();
  private page = new AdminPageController();

  constructor() {
    this.init();
  }

  private init(): void {
    this.router.get('/audit-logs', this.page.renderAuditLogsPage);
    this.router.get('/doctors', this.page.renderDoctorsPage);
    this.router.get('/staffs', this.page.renderStaffPage);
    this.router.get('/add-doctor', this.page.renderAddDoctorPage);
    this.router.get('/patients', this.page.renderPatientsPage);
    this.router.get('/doctor/:doctorId', this.page.renderSingleDoctorPage);
    this.router.get('/appointments', this.page.renderAppointmentsPage);
    this.router.get('/patients/:patientId', this.page.renderSinglePatientPage);
    this.router.get('/settings', this.page.renderSettingsPage);
    this.router.get('/appointments/:appointment_id', this.page.renderSingleAppointmentPage);
    this.router.get('/add-staff', this.page.renderAddStaffPage);
    this.router.get('/staff/:staff_id', this.page.renderViewSingleStaff)
    this.router.get("/login", this.page.renderLoginPage)
  }
}