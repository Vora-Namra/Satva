import { Hospital, HospitalRepository } from "./hospital.repository.js";

export class HospitalService {
  private hospitalRepository = new HospitalRepository();

  async createHospital(hospitalData: Hospital) {
    try {
      return await this.hospitalRepository.create(hospitalData);

    } catch (error) {
      console.error("Database error during createHospital:", error);
      throw new Error("Something unexpected happened", {
        cause: { status: 400 }
      });
    }
  }

  async getHospitalById(id: number) {
    const hospital = await this.hospitalRepository.findById(id);
    
    if (!hospital) {
      throw new Error("Hospital not found", {
        cause: {
          status: 404,
        },
      });
    }
    
    return hospital;
  }

  async updateHospital(id: number, hospitalData: Partial<Hospital>) {
    // Check if it exists first
    await this.getHospitalById(id);
    
    try {
      return await this.hospitalRepository.update(id, hospitalData);
    } catch (error) {
      console.error("Database error during updateHospital:", error);
      throw new Error("Something unexpected happened", {
        cause: { status: 400 }
      });
    }
  }

  async getHospitalsList(page: number, limit: number, search?: string) {
    const offset = (page - 1) * limit;
    const data = await this.hospitalRepository.findAll(limit, offset, search);
    const total = await this.hospitalRepository.countAll(search);
    
    return {
      data,
      total,
      page,
      limit
    };
  }

  async getAllHospitals() {
    return await this.hospitalRepository.getAll();
  }
}
