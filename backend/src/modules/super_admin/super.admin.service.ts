import { resolve } from "node:dns";
import { UserRepository } from "../auth/auth.repository.js";
import { comparePassword, getHashedPassword } from "../auth/utils/bcrypt.js";
import { sign } from "../auth/utils/jwt.js";
import { SuperAdminRepository } from "./super.admin.repository.js";

export class SuperAdminService {
  private superAdminRepo = new SuperAdminRepository();

  private userRepo = new UserRepository();
  async registerAdmin(data: any) {
    const existingUser = await this.userRepo.findUserByEmail(data.email);

    if (existingUser) {
      throw new Error("Email already exists", {
        cause: {
          status: 400,
        },
      });
    }

    const hashedPassword = await getHashedPassword(data.password);

    // Create the base user account
    const user = await this.userRepo.createUser(
      data.email || "",
      hashedPassword || "",
      "ADMIN", // DB Schema only allows 'PATIENT','DOCTOR','ADMIN'
    );

    // Create the admin profile
    const adminId = await this.userRepo.createAdmin({
      user_id: user.user_id,
      hospital_id: data.hospital_id || data.hospitalId || null,
      first_name: data.first_name || data.firstName || null,
      last_name: data.last_name || data.lastName || null,
    });

    // If status is passed as Inactive, update the users table via the superAdminRepo
    if (data.status === "Inactive") {
      await this.superAdminRepo.updateAdmin(adminId, { status: "Inactive" });
    }

    const accessToken = sign({
      id: user.user_id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user,
    };
  }

  async login(data: any) {
    const user = await this.userRepo.findUserByEmail(data.email);

    if (!user) {
      throw new Error("Invalid email or password", {
        cause: {
          status: 404,
        },
      });
    }

    const isPasswordValid = await comparePassword(
      data.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new Error("Invalid email or password", {
        cause: {
          status: 400,
        },
      });
    }

    await this.userRepo.updateLastLogin(user.user_id);

    const accessToken = sign({
      id: user.user_id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user,
    };
  }

  async seed(data: any) {
    const existingUser = await this.userRepo.findUserByEmail(data.email);

    if (existingUser) {
      throw new Error("Email already exists", {
        cause: {
          status: 400,
        },
      });
    }

    const hashedPassword = await getHashedPassword(data.password);

    const user = await this.userRepo.createUser(
      data.email,
      hashedPassword,
      "SUPER_ADMIN",
    );

    const accessToken = sign({
      id: user.user_id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user,
    };
  }

  async getAdminsList(page: number, limit: number, search?: string) {
    const offset = (page - 1) * limit;
    const data = await this.superAdminRepo.findAll(limit, offset, search);
    const total = await this.superAdminRepo.countAll(search);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getAdminById(id: number) {
    const admin = await this.superAdminRepo.findAdminById(id);

    if (!admin) {
      throw new Error("Admin not found", {
        cause: { status: 404 },
      });
    }

    return admin;
  }

  async updateAdmin(id: number, adminData: any) {
    await this.getAdminById(id); // Check existence

    try {
      await this.superAdminRepo.updateAdmin(id, adminData);
    } catch (error) {
      console.error("Database error during updateAdmin:", error);
      throw new Error("Something unexpected happened", {
        cause: { status: 400 },
      });
    }
  }

  async getAdminsByHospitalId(hospitalId: number) {
    return await this.superAdminRepo.findAdminsByHospitalId(hospitalId);
  }

  async getDashboardStats() {
    const todayRevenue = await this.superAdminRepo.getTodayRevenue();
    const totalDoctors = await this.superAdminRepo.getTotalDoctors();
    const todayAppointments = await this.superAdminRepo.getTodayAppointments();

    return {
      todayRevenue,
      totalDoctors,
      todayAppointments,
    };
  }
}
