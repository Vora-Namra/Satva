import { Router } from "express";
import { Routes } from "../../common/interfaces/routes.interfaces.js";
import { PatientController } from "./patient.controller.js";
import {
  authenticate,
  isPatient,
} from "../../common/middlewares/auth.middleware.js";
import { patientProfileAndInsuranceUpload } from "./utils/patientProfileandMulterUpload.js";
import {
  update_patient_profile_schema,
  add_family_member_schema,
  update_family_member_schema,
  search_doctors_schema,
  notification_query_schema,
  pagination_query_schema,
} from "./validations/patient.validation.js";
import {
  validateRequestBody,
  validateRequestQuery,
} from "../../common/middlewares/validation.middleware.js";

export class PatientRoutes implements Routes {
  path = "/patient";
  router = Router();
  private patient = new PatientController();

  constructor() {
    this.init();
  }

  private init(): void {
    // patient routes require authentication + PATIENT role
    this.router.use(authenticate, isPatient);

    // Profile routes
    this.router.get("/profile", this.patient.getProfile);
    this.router.patch(
      "/profile",
      patientProfileAndInsuranceUpload,
      validateRequestBody(update_patient_profile_schema),
      this.patient.updateProfile,
    );

    // Family members routes
    this.router.get("/family", this.patient.getFamilyMembers);
    this.router.post(
      "/family",
      validateRequestBody(add_family_member_schema),
      this.patient.addFamilyMember,
    );
    this.router.patch(
      "/family/:memberId",
      validateRequestBody(update_family_member_schema),
      this.patient.updateFamilyMember,
    );
    this.router.delete("/family/:memberId", this.patient.deleteFamilyMember);

    //  Doctor search routes
    this.router.get(
      "/doctors",
      validateRequestQuery(search_doctors_schema),
      this.patient.searchDoctors,
    );
    this.router.get(
      "/doctors/paginated",
      validateRequestQuery(search_doctors_schema),
      this.patient.searchDoctorsPaginated,
    );
    this.router.get("/doctors/:doctorId", this.patient.getDoctorDetail);

    // Payments
    this.router.get("/payments", this.patient.getPaymentHistory);
    this.router.get(
      "/payments/paginated",
      validateRequestQuery(pagination_query_schema),
      this.patient.getPaymentHistoryPaginated,
    );

    //Hospital
    this.router.get("/hospitals",this.patient.getHospitals);

    // Medical records
    this.router.get("/records", this.patient.getMedicalHistory);
    this.router.get(
      "/records/paginated",
      validateRequestQuery(pagination_query_schema),
      this.patient.getMedicalHistoryPaginated,
    );
    this.router.get("/records/:recordId", this.patient.getMedicalRecord);

    this.router.get(
      "/records/:id/summary",this.patient.getMedicalRecordSummary,
    );
  }
}
