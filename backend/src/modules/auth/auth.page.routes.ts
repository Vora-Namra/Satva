import { Router } from "express";
import { AuthPageController } from "./auth.page.controller.js";
import { AuthController } from "./auth.controller.js";

export class AuthPageRoutes {
  public path = "/";
  public router = Router();

  private page = new AuthPageController();
  private authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/register", this.page.showRegisterPage);
    this.router.get("/login", this.page.showLoginPage);

    this.router.get("/forgot-password", this.page.SendOtpPage);
    this.router.post("/send-otp", this.authController.sendOtp);

    this.router.get("/show-email", this.page.showMail);
    this.router.get("/enter-otp", this.page.showEnterOtpPage);
    this.router.get("/about",this.page.showAboutPage)
    this.router.get("/contact",this.page.showContactPage)
    this.router.get("/",this.page.showIndex)
  }
}