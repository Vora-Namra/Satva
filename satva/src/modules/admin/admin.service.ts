import { AuthService } from "../auth/auth.service.js";
import { AdminRepository } from "./admin.repository.js";
import { AuditPayload } from "./interfaces/audit.interface.js";
import { Hospital } from "./interfaces/hospital.interface.js";

export class AdminService {
  private adminRepo = new AdminRepository();
  private authservice = new AuthService();
  async fetchDoctorsByHospitalId(
    hospital_id: number,
    query: {
      search?: string;
      specialty_id?: string;
      is_deactivated?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const filters = {
      search: query.search,
      specialty_id: query.specialty_id ? Number(query.specialty_id) : undefined,
      is_deactivated:
        query.is_deactivated !== undefined
          ? query.is_deactivated === "true"
          : undefined,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
    };

    const { rows, total } = await this.adminRepo.fetchDoctorsByHospitalId(
      hospital_id,
      filters,
    );

    return {
      data: rows,
      total: Number(total),
      page: filters.page,
      limit: filters.limit,
    };
  }

  async addDoctor(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    gender: string | null;
    bio: string | null;
    consultationFee: number | null;
    experienceYears: number | null;
    hospitalId: number;
    specialties: number[];
    qualifications: {
      degree: string;
      college_name: string;
      graduation_year: number;
    }[];
  }) {
    const { doctor } = await this.authservice.registerDoctor({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      gender: data.gender,
      bio: data.bio,
      consultationFee: data.consultationFee,
      experienceYears: data.experienceYears,
      hospitalId: data.hospitalId,
    });

    const doctor_id = doctor.doctor_id;

    if (data.qualifications.length > 0) {
      try {
        await this.adminRepo.insertDoctorQualifications(
          doctor_id,
          data.qualifications,
        );
      } catch (err: any) {
        console.log("qualifications FAILED ", err.message);
        throw err;
      }
    }

    if (data.specialties.length > 0) {
      try {
        await this.adminRepo.insertDoctorSpecialties(
          doctor_id,
          data.specialties,
        );
      } catch (err: any) {
        throw err;
      }
    }

    // Step 4 — return full doctor with specialties + qualifications
    return await this.adminRepo.getDoctorById(doctor_id);
  }
  async getHospitalId(user_id: number) {
    const { hospital_id } =
      await this.adminRepo.fetchHospitalIdFromAdminId(user_id);
    return hospital_id;
  }
  async fetchPatientsByHospital(
    hospital_id: number,
    query: {
      search?: string;
      gender?: string;
      is_insured?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const filters = {
      search: query.search,
      gender: query.gender,
      is_insured:
        query.is_insured !== undefined
          ? query.is_insured === "true"
          : undefined,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
    };

    const { rows, total } = await this.adminRepo.fetchPatientsByHospital(
      hospital_id,
      filters,
    );

    return {
      data: rows,
      total: Number(total),
      page: filters.page,
      limit: filters.limit,
    };
  }
  async fetchDoctorFromId(doctor_id: number) {
    const doctor = await this.adminRepo.getDoctorById(doctor_id);
    return doctor;
  }

  async editDoctor(doctor_id: number, data: { [key: string]: any }) {
    // Check doctor exists before updating
    const existing = await this.adminRepo.getDoctorById(doctor_id);
    if (!existing) throw new Error("Doctor not found");

    return await this.adminRepo.editDoctor(doctor_id, data);
  }

  async addAuditLogs(payload: AuditPayload) {
    const logs = await this.adminRepo.addAuditLogs(payload);
    return logs;
  }

  async fetchAppointmentsByHospitalId(hospital_id: number) {
    const appointments = await this.adminRepo.fetchAppointments(hospital_id);
    return appointments;
  }
  async fetchAuditLogs(hospital_id: number) {
    const logs = await this.adminRepo.fetchAuditLogs(hospital_id);
    return logs;
  }

  async fetchSpecialties() {
    const spec = await this.adminRepo.fetchSpecialties();
    return spec;
  }

  async toggleDoctorStatus(doctorId: number, is_deactivated: number) {
    return await this.adminRepo.updateDoctorStatus(doctorId, is_deactivated);
  }

  async fetchPatientDetails(patient_id: number) {
    const patient = await this.adminRepo.fetchPatientDetailsById(patient_id);
    return patient;
  }

  async fetchHospitalDetails(hospital_id: number) {
    const hospital = await this.adminRepo.fetchHospitalDetails(hospital_id);
    return hospital;
  }

  async updateSettings(hospital_id: number, payload: Hospital) {
    const hospital = await this.adminRepo.updateSettings(hospital_id, payload);
    return hospital;
  }

  async fetchStats(hospital_id: number) {
    const stats = await this.adminRepo.fetchStatsOfHospital(hospital_id);
    return stats;
  }

  async fetchAppointment(appointment_id: number) {
    const appointment =
      await this.adminRepo.fetchAppointmentDetails(appointment_id);
    return appointment;
  }

  async fetchStaff(hospital_id: number) {
    const staff = await this.adminRepo.fetchStaffs(hospital_id);
    return staff;
  }

  async getStaffById(staff_id: number) {
    const staff = await this.adminRepo.getStaffById(staff_id);
    return staff;
  }
}
