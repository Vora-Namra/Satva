import { Router } from "express";
import { Routes } from "../../common/interfaces/routes.interfaces.js";
import { TelemedicineController } from "./telemedicine.controller.js";
import { doctorAuth, patientAuth } from "../../common/middlewares/auth.middleware.js";

export class TelemedicineRoutes implements Routes {
  path: string = "/telemedicine";
  router: Router = Router();
  telemedicineController = new TelemedicineController();

  constructor() {
    this.init();
  }

  private init(): void {
    this.router.post(
      "/",
      doctorAuth,
      this.telemedicineController.createTelemedicineSession
    );

    this.router.get(
      "/:sessionId",
      doctorAuth,
      this.telemedicineController.getTelemedicineSessionById
    );
    this.router.get(
      "/appointment/:appointmentId",
      doctorAuth,
      this.telemedicineController.getTelemedicineSessionByAppointmentId
    );

    this.router.get(
      "/patient/:patientId",
      doctorAuth,
      this.telemedicineController.getTelemedicineSessionsByPatientId
    );

    this.router.get(
      "/doctor/:doctorId",
      doctorAuth,
      this.telemedicineController.getTelemedicineSessionsByDoctorId
    );

    this.router.patch(
      "/:sessionId/start",
      doctorAuth,
      this.telemedicineController.startTelemedicineSession
    );

    this.router.patch(
      "/:sessionId/end",
      doctorAuth,
      this.telemedicineController.endTelemedicineSession
    );

    this.router.patch(
      "/:sessionId/status",
      doctorAuth,
      this.telemedicineController.updateTelemedicineSessionStatus
    );

    this.router.patch(
      "/:sessionId/meeting-link",
      doctorAuth,
      this.telemedicineController.updateTelemedicineMeetingLink
    );
  }
}