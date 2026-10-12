import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../common/helpers/catch-async.js";
import { generalResponse } from "../../common/helpers/general-response.js";
import { AuthService } from "./auth.service.js";
import { HttpException } from "../../common/helpers/http-exception.js";
import { country } from "../../common/countryCodes.js";
import { AuthRequest } from "../../common/middlewares/auth.middleware.js";

export class AuthController {
  private authService = new AuthService();

  //SERVING STATIC PAGES

  login = catchAsync(async (req: Request, res: Response) => {

    const { refreshToken, ...data } = await this.authService.login(req.body);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });
    generalResponse({
      res,
      data: data,
      message: "Logged in Successfully",
      statusCode: 200,
    });
  });

  registerDoctor = catchAsync(async (req: Request, res: Response) => {
    const result = await this.authService.registerDoctor(req.body);

    generalResponse({
      res,
      data: result,
      message: "Doctor Registration Successful",
      statusCode: 201,
    });
  });

  registerAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await this.authService.registerAdmin(req.body);

    generalResponse({
      res,
      data: result,
      message: "Admin Registration Successful",
      statusCode: 201,
    });
  });

  register = catchAsync(async (req: Request, res: Response) => {
    const result = await this.authService.register(req.body);
    generalResponse({
      res,
      data: result,
      message: "Registration Successfull",
      statusCode: 201,
    });
  });

  sendOtp = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      generalResponse({
        res,
        data: null,
        message: "Email is required",
        statusCode: 400,
      });
      return;
    }

    const otpResult: any = await this.authService.getOtp(email);

    req.session.email = email;
    req.session.isEmailVerified = true;
    req.session.user_id = otpResult.data.user_id;

    generalResponse({
      res,
      data: null,
      message: "OTP sent successfully",
      statusCode: 200,
    });
  });

  verifyOtp = async (email: string, otp: string) => {
    let response = await this.authService.verifyOtp(email, otp);
    // req.session.isOtpVerified = true;

    return response.success;
    // catch (e) {
    //     console.log(e);
    //     let error = e instanceof Error ? e.message : "error in registring user";
    //     return sendResponse(res, 400, "Failed to vefiy otp", error);
    // }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      let { otp, newPassword, confirm_password } = req.body;

      let user_id = req.session.user_id as number;
      let email = req.session.email as string;
      let isPassValid = await this.authService.verifyPassAndCpass(
        newPassword,
        confirm_password,
      );
      if (!isPassValid) {
        return generalResponse({
          res,
          data: null,
          message: "Password do not match",
          statusCode: 400,
        });
      }
      let response = await this.verifyOtp(email, otp);

      if (response) {
        let isReset = await this.authService.resetPassword(
          newPassword,
          user_id,
        );

        req.session.isEmailVerified = false;

        if (isReset) {
          return generalResponse({
            res,
            data: null,
            message: "password hasbeen changed Successfully!!",
            statusCode: 200,
          });
        } else {
          return generalResponse({
            res,
            data: null,
            message: "Password not updated!!",
            statusCode: 400,
          });
        }
      } else {
        req.session.isEmailVerified = false;

        return generalResponse({
          res,
          data: null,
          message: "Incorrect Otp",
          statusCode: 400,
        });
      }
    } catch (e) {
      console.log(e);
      let error = e instanceof Error ? e.message : "error in registring user";
      const status = e instanceof HttpException ? e.statusCode : 400;
      return generalResponse({
        res,
        data: status,
        message: "Failed to send otp",
        statusCode: 400,
      });
    }
  };

  getCountryCodes = async (req: Request, res: Response) => {
    return res.json(country);
  };

  logout = catchAsync(async (req: Request, res: Response) => {
    await this.authService.logout((req as AuthRequest).user.id);

    req.session?.destroy(() => { });
    res.clearCookie("refreshToken");
    generalResponse({
      res,
      message: "Logged out successfully",
      statusCode: 200
    }

    )
  })


  refresh = catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      generalResponse({
        res,
        data: null,
        message: "Refresh token missing",
        statusCode: 401,
      });
      return;
    }

    try {
      const result = await this.authService.refreshAccessToken(refreshToken);
      generalResponse({
        res,
        data: result,
        message: "Token refreshed successfully",
        statusCode: 200,
      });
    } catch (error) {
      generalResponse({
        res,
        data: null,
        message: "Invalid or expired refresh token",
        statusCode: 401,
      });
    }
  });


  registerStaff = catchAsync(async (req: Request, res: Response) => {

    const result = await this.authService.registerStaff(req.body);


    generalResponse({
      res,
      data: result,
      message: "Staff Registration Successful",
      statusCode: 201,
    });
  });

  checkStatus = catchAsync(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user;
    generalResponse({
      res,
      data: { role: user.role },
      message: "User is authenticated",
      statusCode: 200,
    });
  });
}
