import { Router } from "express";
import { Routes } from "../../common/interfaces/routes.interfaces.js";
import { AuthController } from "./auth.controller.js";
import passport from './utils/googleauth.js'
import { authenticate } from "../../common/middlewares/auth.middleware.js";
import { sign } from "./utils/jwt.js";
import  { rateLimit } from "express-rate-limit";


  let limiter = rateLimit({
    max:30,  // max 30 request allowed from a particular IP
    windowMs:10*60*1000, // in 10 minutes
    message:"We have received too many requests from this IP, Please try again later."
  })

export class AuthRoutes implements Routes {
  path: string = "/auth";
  router: Router = Router();
  authController = new AuthController();

  constructor() {
    this.initializationRoutes();
  }


  private initializationRoutes(): void {
    this.router.use(limiter)
    this.router.post("/register-doctor", this.authController.registerDoctor);
    this.router.post("/register-admin", this.authController.registerAdmin);
    this.router.post("/register", this.authController.register);
    this.router.post("/login", this.authController.login);
    this.router.get("/refresh", this.authController.refresh);

    this.router.post("/sendOtp", this.authController.sendOtp);
    this.router.post("/reset-password", this.authController.resetPassword);      
    this.router.post("/send-otp", this.authController.sendOtp);
    this.router.get('/google', passport.authenticate('google', {
      scope: [
        'profile',
        'email',
        //  'https://www.googleapis.com/auth/user.phonenumbers.read',
        //  'https://www.googleapis.com/auth/user.birthday.read',
        // 'https://www.googleapis.com/auth/user.gender.read',

      ]
    }))
    this.router.get('/country', this.authController.getCountryCodes);


    this.router.get('/google/callback', passport.authenticate('google', {
      failureRedirect: '/login'
    }), (req, res) => {
      const user = req.user as any;
      const token = sign({
        id: user.user_id,
        email: user.email,
        role: user.role,
      });
      
      // Redirect to login page with the token to be intercepted by frontend
      res.redirect(`/login?token=${token}`);
    });


    this.router.get("/check-status", authenticate, this.authController.checkStatus);
    this.router.post("/logout", authenticate, this.authController.logout);

  }
}
