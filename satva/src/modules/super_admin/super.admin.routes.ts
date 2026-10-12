import { Router } from "express";
import { Routes } from "../../common/interfaces/routes.interfaces.js";
import { SuperAdminController } from "./super.admin.controller.js";
validateRequestBody;
import {
  createAdminSchema,
  loginSchema,
  seedSuperAdminSchema,
  updateAdminSchema,
} from "./validators/superadmin.crud.validations.js";
import { validateRequestBody } from "../../common/middlewares/validation.middleware.js";
import { superAdminAuth } from "../../common/middlewares/auth.middleware.js";

export class SuperAdminRoutes implements Routes {
  path: string = "/super-admin";
  router: Router = Router();
  superAdminController = new SuperAdminController();

  constructor() {
    this.initializationRoutes();
  }

  private initializationRoutes(): void {

    this.router.post(
      "/login",
      validateRequestBody(loginSchema),
      this.superAdminController.postLogin,
    );
    this.router.post(
      "/seed-super-admin",
      validateRequestBody(seedSuperAdminSchema),
      this.superAdminController.seedSuperAdmin,
    );


    this.router.get("/list", superAdminAuth, this.superAdminController.getAdminsList);

    // Admin CRUD routes

    this.router.post(
      "/create-admin",
      superAdminAuth,
      validateRequestBody(createAdminSchema),
      this.superAdminController.postCreateAdmin,
    );


    this.router.put(
      "/edit-admin/:id",
      superAdminAuth,
      validateRequestBody(updateAdminSchema),
      this.superAdminController.putEditAdmin,
    );
  }
}
