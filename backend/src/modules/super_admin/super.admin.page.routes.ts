import { Router } from "express";
import { Routes } from "../../common/interfaces/routes.interfaces.js";
import { SuperAdminPageController } from "./super.admin.page.controller.js";

export class SuperAdminPageRoutes implements Routes {
  path = "/super-admin";
  router = Router();
  private page = new SuperAdminPageController();

  constructor() {
    this.init();
  }

  private init(): void {
    this.router.get("/login", this.page.getLogin);
    this.router.get("/dashboard", this.page.dashboard);
    this.router.get("/create-admin", this.page.getCreateAdmin);
    this.router.get("/edit-admin/:id", this.page.getEditAdmin);
    this.router.get("/view-admin/:id", this.page.getViewAdmin);
  }
}
