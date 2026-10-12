import { SessionData } from "express-session";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/helpers/http-exception.js";
import { UserRepository } from "./auth.repository.js";
import { comparePassword, getHashedPassword } from "./utils/bcrypt.js";
import { sign, signRefreshToken, verifyRefreshToken } from "./utils/jwt.js";
import crypto from "crypto";
import { SessionInfo } from "./interfaces/auth.interface.js";
import { AuditService } from "../../services/audit.service.js";
import { JwtPayload } from "jsonwebtoken";

export class AuthService {
  // private userRepo=new UserRepository();

  //   async register(data: { name: string; email: string; password: string }) {
  //     const existingUser = await this.userRepo.findByEmail(data.email);
  //     if (existingUser) throw new ConflictException('Email already registered');

  //     const hashedPassword = await bcrypt.hash(data.password, 12);
  //     const user = await this.userRepo.create({ ...data, password: hashedPassword });

  //     const tokens = this.generateTokens({ id: user.id, email: user.email, role: user.role });
  //     return { user, ...tokens };
  //   }
  private auditService = new AuditService();
  private userRepo = new UserRepository();

  async registerAdmin(data: any) {
    const existingUser = await this.userRepo.findUserByEmail(data.email);

    if (existingUser) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await getHashedPassword(data.password);

    const user = await this.userRepo.createUser(
      data.email,
      hashedPassword,
      "ADMIN",
    );

    await this.userRepo.createAdmin({
      user_id: user.user_id,
      hospital_id: data.hospitalId,
      first_name: data.firstName,
      last_name: data.lastName,
    });

    const accessToken = sign({
      id: user.user_id,
      email: user.email,
      role: user.role,
    });

    await this.auditService.log({
      performed_by_user_id: user.user_id,
      action: "ADMIN_REGISTER",
      entity_name: "auth",
      entity_id: String(user.user_id),
      ip_address:"127.0.0.1"
    });

    return {
      accessToken,
      user,
    };
  }

  async registerDoctor(data: any) {
    const existingUser = await this.userRepo.findUserByEmail(data.email);

    if (existingUser) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await getHashedPassword(data.password);

    const user = await this.userRepo.createUser(
      data.email,
      hashedPassword,
      "DOCTOR",
    );

    const doctor = await this.userRepo.createDoctor({
      user_id: user.user_id,
      hospital_id: data.hospitalId,
      first_name: data.firstName,
      last_name: data.lastName,
      gender: data.gender,
      experience_years: data.experienceYears,
      consultation_fee: data.consultationFee,
      bio: data.bio,
    });


    await this.auditService.log({
      performed_by_user_id: user.user_id,
      action: "DOCTOR_REGISTER",
      entity_name: "auth",
      entity_id: String(user.user_id),
      ip_address:"127.0.0.1"
    });

    const accessToken = sign({
      id: user.user_id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user,
      doctor
    };
  }
  
  async registerStaff(data: any) {
    const existingUser = await this.userRepo.findUserByEmail(data.email);

    if (existingUser) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await getHashedPassword(data.password);

    const user = await this.userRepo.createUser(
      data.email,
      hashedPassword,
      "STAFF",
    );

    const staff = await this.userRepo.createStaff({
      user_id: user.user_id,
      hospital_id: data.hospitalId,
      first_name: data.firstName,
      last_name: data.lastName,
      gender: data.gender,
      staff_role: data.staff_role,
      contact_number: data.contact_number,
      dob: data.dob,
      address_line1: data.address_line1,
      address_line2: data.address_line2 ?? ''
    });


    const accessToken = sign({
      id: user.user_id,
      email: user.email,
      role: user.role,
    });

    await this.auditService.log({
      performed_by_user_id: user.user_id,
      action: "STAFF_REGISTER",
      entity_name: "auth",
      entity_id: String(user.user_id),
      ip_address:"127.0.0.1"
    });

    return {
      accessToken,
      user,
      staff
    };
  }

  async register(data: any) {
    const existingUser = await this.userRepo.findUserByEmail(data.email);
    if (existingUser) throw new Error("Email already exist");

    const hashedPassword = await getHashedPassword(data.password);

    const user = await this.userRepo.createUser(
      data.email,
      hashedPassword,
      "PATIENT",
    );

    await this.userRepo.createPatient(
      user.user_id,
      data.first_name,
      data.last_name,
      data.country_code,
      data.phone,
      data.dob,
      data.gender,
    );

    const token = sign({
      id: user.user_id,
      email: user.email,
      role: user.role,
    });

    await this.auditService.log({
      performed_by_user_id: user.user_id,
      action: "USER_REGISTER",
      entity_name: "auth",
      entity_id: String(user.user_id),
      ip_address:"127.0.0.1"
    });

    return { user, token };
  }

  async login(data: any, sessionInfo?: SessionInfo) {
    const user = await this.userRepo.findUserByEmail(data.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }


    const isPasswordValid = await comparePassword(
      data.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    await this.userRepo.updateLastLogin(user.user_id);

    const accessToken = sign({
      id: user.user_id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      id: user.user_id,
      email: user.user_email,
      role: user.role,
    });

    await this.userRepo.createSession(
      user.user_id,
      refreshToken,
      sessionInfo?.deviceInfo ?? "",
      sessionInfo?.ipAddress ?? "",
      "LOCAL",
    );

    await this.auditService.log({
      performed_by_user_id: user.user_id,
      action: "USER_LOGIN",
      entity_name: "users",
      entity_id: String(user.user_id),
      ip_address:"127.0.0.1"
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const refreshPayload: JwtPayload = verifyRefreshToken(refreshToken);

    const session = await this.userRepo.findSessionByRefreshToken(refreshToken);
    if (!session) {
      throw new Error("Session expired");
    }

    const accessToken = sign({
      id: refreshPayload.id,
      email: refreshPayload.email,
      role: refreshPayload.role,
    });

    return { accessToken };
  }

  async getOtp(email: string) {
    const user = await this.userRepo.findUserByEmail(email);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const canGetOtp = await this.userRepo.canGetOtp(email);
    if (!canGetOtp) {
      throw new BadRequestException("OTP already sent. Please wait.");
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    await this.userRepo.deleteOldOtp(email);
    await this.userRepo.saveOtp(otp, email);
    console.log(otp)   
    return {
      success: true,
      data: {
        otp,
        user_id: user.user_id,
      },
      message: "OTP generated successfully",
    };
  }

  async verifyOtp(email: string, otp: string) {
    const otpRecord = await this.userRepo.findOtp(email, otp);

    if (!otpRecord) {
      throw new BadRequestException("Invalid or expired OTP");
    }

    return {
      success: true,
      message: "OTP verified successfully",
    };
  }

  async resetPassword(password: string, user_id: number) {
    if (!password) {
      throw new NotFoundException("Password is required");
    }

    const hashedPassword = await getHashedPassword(password);

    await this.userRepo.updatePassword(hashedPassword, user_id);
    await this.userRepo.deleteOtp(user_id);

    await this.auditService.log({
      performed_by_user_id: user_id,
      action: "PASSWORD_CHANGED",
      entity_name: "users",
      entity_id: String(user_id),
      ip_address:"127.0.0.1"
    });

    return {
      success: true,
      message: "Password updated successfully",
    };
  }

  async getLatestOtpService(email: string) {
    return await this.userRepo.getLatestOtp(email);
  }

  async verifyPassAndCpass(password: String, confirm_password: string) {
    if (password === confirm_password) return true;
    return false;
  }
  async logout(userId: number) {
    await this.userRepo.logout(userId);
  }



}
