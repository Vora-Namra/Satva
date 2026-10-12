import { Router } from "express";
import { Routes } from "../../common/interfaces/routes.interfaces.js";
import { HospitalController } from "./hospital.controller.js";
import { validateRequestBody } from "../../common/middlewares/validation.middleware.js";
import {
  createHospitalSchema,
  updateHospitalSchema,
} from "./validators/hospital.validator.js";
import { superAdminAuth } from "../../common/middlewares/auth.middleware.js";

export class HospitalRoutes implements Routes {
  path: string = "/hospital";
  router: Router = Router();
  hospitalController = new HospitalController();

  constructor() {
    this.initializationRoutes();
  }

  private initializationRoutes(): void {
    this.router.get("/list", superAdminAuth, this.hospitalController.getHospitalsList);

    this.router.post(
      "/create-hospital",
      superAdminAuth,
      validateRequestBody(createHospitalSchema),
      this.hospitalController.postCreateHospital,
    );

    this.router.put(
      "/edit-hospital/:id",
      superAdminAuth,
      validateRequestBody(updateHospitalSchema),
      this.hospitalController.putEditHospital,
    );
  }
}
