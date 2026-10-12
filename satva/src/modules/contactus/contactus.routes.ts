import { Router } from "express";
import { Routes } from "../../common/interfaces/routes.interfaces.js";
import { ContactUsController } from "./contactus.controller.js";
import { superAdminAuth } from "../../common/middlewares/auth.middleware.js";

export class ContactUsRoutes implements Routes {
  path: string = "/contactus";
  router: Router = Router();
  private contactUsController = new ContactUsController();

  constructor() {
    this.initializationRoutes();
  }

  private initializationRoutes(): void {
    // Public route to submit contact us form
    this.router.post("/", this.contactUsController.postMessage);
    
    // Protected routes for super admin dashboard
    this.router.get("/", superAdminAuth, this.contactUsController.getMessages);
    this.router.patch("/:id/status", superAdminAuth, this.contactUsController.patchStatus);
    this.router.delete("/:id", superAdminAuth, this.contactUsController.deleteMessage);
    this.router.post("/:id/reply", superAdminAuth, this.contactUsController.postReply);
  }
}
