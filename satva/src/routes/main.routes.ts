import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes.js";
import { Routes } from "../common/interfaces/routes.interfaces.js";
import { PatientRoutes } from "../modules/patient/patient.routes.js";
import { AdminRoutes } from "../modules/admin/admin.routes.js";
import { DoctorRoutes } from "../modules/doctor/doctor.routes.js";
import { SuperAdminRoutes } from "../modules/super_admin/super.admin.routes.js";
import { HospitalRoutes } from "../modules/hospital/hospital.routes.js";
import { TelemedicineRoutes } from "../modules/telemedicine/telemedicine.routes.js";
import { AppointmentRoutes } from "../modules/appointment/appointment.routes.js";
import { NotificationRouter } from "../modules/notification/notification.route.js";
import { StaffRoutes } from "../modules/staff/staff.routes.js";
import { ContactUsRoutes } from "../modules/contactus/contactus.routes.js";

export function buildApiRouter(): Router {
  const router = Router();

  const routes: Routes[] = [
    // add all routes here
    new AuthRoutes(),
    new PatientRoutes(),
    new AdminRoutes(),
    new DoctorRoutes(),
    new SuperAdminRoutes(),
    new HospitalRoutes(),
    new TelemedicineRoutes(),
    new AppointmentRoutes(),
    new NotificationRouter(),
    new StaffRoutes(),
    new ContactUsRoutes()

  ];

  router.get("/", (req, res) => {
    res.render("index");
  });

  routes.forEach((route) => {
    router.use(route.path, route.router);
  });


  return router;
}
