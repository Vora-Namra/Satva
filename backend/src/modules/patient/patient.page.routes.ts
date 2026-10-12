import { Router } from "express";
import { Routes } from "../../common/interfaces/routes.interfaces.js";
import { PatientPageController } from "./patient.page.controller.js";

export class PatientPageRoutes implements Routes {
  path = "/patient";
  router = Router();
  private page = new PatientPageController();

  constructor() {
    this.init();
  }

  private init(): void {
    // this.router.use(authenticate, isPatient);
    this.router.get("/dashboard", this.page.renderDashboard);
    this.router.get("/profile", this.page.renderProfile);
    this.router.get("/doctors/:doctorId", this.page.renderDoctorProfile);
    this.router.get("/doctors", this.page.renderDoctors);
    this.router.get("/notifications", this.page.renderNotifications);
    this.router.get("/payments", this.page.renderPayments);
    this.router.get("/records/:recordId", this.page.renderRecordDetails);
    this.router.get("/records", this.page.renderRecords);
    this.router.get("/my-appointments",this.page.renderMyAppointments);
    this.router.get("/book-appointment",this.page.renderBookAppointments)


  }
}
