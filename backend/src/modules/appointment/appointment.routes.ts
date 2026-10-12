import { Router } from "express";
import { AppointmentController } from "./appointment.controller.js";
import { authenticate, patientAuth, doctorAuth } from "../../common/middlewares/auth.middleware.js";
import { validateRequestBody, validateRequestQuery } from "../../common/middlewares/validation.middleware.js";
import { appointment_list_query_schema, book_appointment_schema, cancel_appointment_schema, doctor_slots_schema, reschedule_appointment_schema } from "./validators/appointment.validators.js";

export class AppointmentRoutes {
  public path = "/appointments";
  public router = Router();
  private controller = new AppointmentController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Common logged in users
    this.router.get("/slots", authenticate, validateRequestQuery(doctor_slots_schema), this.controller.getAvailableSlots);

    // Patient routes
    this.router.post("/", patientAuth, validateRequestBody(book_appointment_schema), this.controller.bookAppointment);
    this.router.get("/patient", patientAuth, this.controller.getAppointments);
    this.router.get(
      "/patient/paginated",
      patientAuth,
      validateRequestQuery(appointment_list_query_schema),
      this.controller.getAppointmentsPaginated,
    );
    this.router.patch("/:id/reschedule",patientAuth, validateRequestBody(reschedule_appointment_schema),  this.controller.rescheduleAppointment);
    this.router.patch("/:id/cancel", patientAuth,  validateRequestBody(cancel_appointment_schema),this.controller.cancelAppointment);

    // Doctor routes
    this.router.get("/doctor/today", doctorAuth, this.controller.getDoctorTodaysAppointments);
    this.router.get("/doctor/dashboard", doctorAuth, this.controller.getDoctorDashboardData);
  }
}