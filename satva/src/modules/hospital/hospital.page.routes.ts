import { Router } from "express";
import { Routes } from "../../common/interfaces/routes.interfaces.js";
import { HospitalPageController } from "./hospital.page.controller.js";

export class HospitalPageRoutes implements Routes {
  path = "/hospital";
  router = Router();
  private page = new HospitalPageController();

  constructor() {
    this.init();
  }

  private init(): void {
    this.router.get("/list", this.page.getHospitalsList);
    this.router.get("/create-hospital", this.page.getCreateHospital);
    this.router.get("/edit-hospital/:id", this.page.getEditHospital);
    this.router.get("/view-hospital/:id", this.page.getViewHospital);
  }
}
