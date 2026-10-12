import { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { generalResponse } from "../../common/helpers/general-response.js";

export class AuthPageController {
  authService = new AuthService();

  showLoginPage = async (req: Request, res: Response) => {
    res.render("auth/user_login");
  };

  showRegisterPage = async (req: Request, res: Response) => {
    res.render("auth/user_register");
  };

  showEnterOtpPage = async (req: Request, res: Response) => {
    res.render("auth/enter-otp-page");
  };

  SendOtpPage = async (req: Request, res: Response) => {
    res.render("auth/forgot-password-page");
  };

  showMail = async (req: Request, res: Response) => {
    try {
      if (!req.session.email) {
        return res.redirect("/forgot-password");
      }

      const otpResult = await this.authService.getLatestOtpService(req.session.email);
      if (!otpResult) {
        return res.redirect("/forgot-password");
      }

      return res.render("auth/show-otp", {
        otp_code: otpResult,
      });
    } catch (e) {
      console.log(e);
      return generalResponse({
        res,
        data: null,
        message: "Failed to load OTP page",
        statusCode: 500,
      });
    }
  };

  showAboutPage = async(req:Request,res:Response)=>{
    res.render("about")
  }

  showContactPage = async(req:Request,res:Response)=>{
    res.render("contact")
  }

  showIndex=async(req:Request,res:Response)=>{
    res.render("index")
  }

}