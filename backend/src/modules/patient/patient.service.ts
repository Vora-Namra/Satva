import { getConnection } from "../../database/connection.js";
import { AuditService } from "../../services/audit.service.js";
import { GeminiService } from "../../services/gemini.service.js";
import { NotificationType } from "../notification/notification.interface.js";
import { NotificationRepository } from "../notification/notification.repository.js";
import { NotificationService } from "../notification/notification.services.js";
import { PatientRepository } from "./patient.repository.js";
import {
  IPaginationQuery,
  ISearchDoctorsQuery,
  IUpdatePatientProfile,
  IAddFamilyMember,
} from "./types/patient.js";



export class PatientService {
  private geminiService = new GeminiService();
  private repo = new PatientRepository();
  private notificationService = new NotificationService(); 
  private auditService = new AuditService();

  private async resolvePatientId(userId: number): Promise<number> {
    const id = await this.repo.getPatientIdByUserId(userId);
    if (!id) throw new Error("Patient profile not found");
    return id;
  }

  private normalizePagination(query?: IPaginationQuery) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(Math.max(1, Number(query?.limit) || 10), 100);
    return { page, limit };
  }

  private buildPaginatedResponse<T>(items: T[], total: number, page: number, limit: number) {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      data: items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  private addMinutesToTime(time: string, minutes: number): string {
    const [h, m]: any = time.split(":").map(Number);
    const total = h * 60 + m + minutes;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  // profile
  async getProfile(userId: number) {
    try{

      const patient = await this.repo.getPatientByUserId(userId);
      if (!patient) throw new Error("Patient not found");

      const insurance = await this.repo.getInsuranceByPatientId(
        patient.patient_id,
      );
      const familyMembers = await this.repo.getFamilyMembers(patient.patient_id);

      console.log("transaction commited");
      return {
        ...patient,
        insurance,
        familyMembers,
      };
    }catch(err:unknown){
      throw err;
    }

  }

  async updateProfile(userId: number, data: IUpdatePatientProfile) {
    const conn = await getConnection();
    try{
      await conn.beginTransaction();
      
      const patientId: any = await this.resolvePatientId(userId);
      
      const allowed = [
        "first_name",
        "last_name",
        "address_line1",
        "address_line2",
        "blood_group",
        "profile_path",
        "is_insured",
        "country_code",
        "mobile",
        "dob",
        "gender",
      ];
      
      const filtered = Object.fromEntries(
        Object.entries(data).filter(([k]) => allowed.includes(k)),
      );
      
      const isInsured =
      filtered.is_insured === true ||
      filtered.is_insured === "true" ||
      filtered.is_insured === 1 ||
      filtered.is_insured === "1";

    filtered.is_insured = isInsured ? 1 : 0;

    await this.repo.updateProfile(patientId, filtered);
  

    // this is for creating and storing the notification in d

    await this.notificationService.createNotification({
      user_id: userId,
      notification_type: NotificationType.PROFILE_UPDATED,
      title: "Profile Updated Successfully",
      notification_message:
      "Your profile has been updated successfully.",
    });
    
    if (isInsured) {
      const policyNumber = data.policy_number?.trim();
      const policyCompany = data.policy_company?.trim();
      const policyDocumentPath = data.policy_document_path || null;

      if (policyNumber && policyCompany) {
        await this.repo.updateInsuranceDetails(patientId, {
          policyNumber,
          policyCompany,
          policyDocumentPath,
        });
      }
    } else {
      await this.repo.deleteInsuranceDetails(patientId);
    }

    await this.auditService.log({
      performed_by_user_id: userId,
      action: "PATINET_PROFILE_UPDATE",
      entity_name: "patient",
      entity_id: String(userId),
      ip_address:"127.0.0.1"
    });
    
    await conn.commit();

    return this.repo.getPatientByUserId(userId);
    }catch(err:unknown){
      await conn.rollback();
      throw err;
    }
  }

    async getMedicalRecordSummary(
      userId: number,
      recordId: number,
    ) {
      const patientId =
        await this.repo.getPatientIdByUserId(userId);
        
      if (!patientId) {
        throw new Error("Patient profile not found");
      }
      const record =
        await this.repo.getMedicalRecordById(
          recordId,
          patientId,
        );

      if (!record) {
        throw new Error("Medical record not found");
      }

      const summary =
        await this.geminiService.summarizeMedicalRecord(
          record,
        );

      return summary;
    }

  // Family members
  async getFamilyMembers(userId: number) {
    const patientId = await this.resolvePatientId(userId);
    return this.repo.getFamilyMembers(patientId);
  }


  async addFamilyMember(userId: number, data: IAddFamilyMember) {
    const patientId = await this.resolvePatientId(userId);

    return this.repo.addFamilyMember(patientId, data);
  }
  async updateFamilyMember(userId: number, memberId: number, data: any) {
    const patientId = await this.resolvePatientId(userId);
    return this.repo.updateFamilyMember(memberId, patientId, data);
  }

  async deleteFamilyMember(userId: number, memberId: number) {
    const patientId = await this.resolvePatientId(userId);
    return this.repo.deleteFamilyMember(memberId, patientId);
  }

  // doctor searcg
  async searchDoctors(query: ISearchDoctorsQuery) {
    return this.repo.searchDoctors({
      name: query.name || undefined,
      specialty: query.specialty || undefined,
      gender: query.gender || undefined,
      hospital_id: query.hospital_id ? Number(query.hospital_id) : undefined,
      limit: query.limit ? Number(query.limit) : 20,
      offset: query.offset ? Number(query.offset) : 0,
    });
  }

  async searchDoctorsPaginated(query: ISearchDoctorsQuery & IPaginationQuery) {
    const { page, limit } = this.normalizePagination(query);
    const result = await this.repo.searchDoctorsPaginated({
      name: query.name || undefined,
      specialty: query.specialty || undefined,
      gender: query.gender || undefined,
      hospital_id: query.hospital_id ? Number(query.hospital_id) : undefined,
      page,
      limit,
    });

    return this.buildPaginatedResponse(result.rows, result.total, page, limit);
  }

  async getDoctorDetail(doctorId: number) {
    const doctor = await this.repo.getDoctorById(doctorId);
    if (!doctor) throw new Error("Doctor not found");
    return doctor;
  }

  // Payments

  async getPaymentHistory(userId: number) {
    const patientId = await this.resolvePatientId(userId);
    return this.repo.getPaymentHistory(patientId);
  }

  async getPaymentHistoryPaginated(userId: number, query?: IPaginationQuery) {
    const patientId = await this.resolvePatientId(userId);
    const { page, limit } = this.normalizePagination(query);
    const { rows, total } = await this.repo.getPaymentHistoryPaginated(patientId, { page, limit });
    return this.buildPaginatedResponse(rows, total, page, limit);
  }

  // Medical records
  async getMedicalHistory(userId: number) {
    const patientId = await this.resolvePatientId(userId);
    const raw: any[] = (await this.repo.getMedicalHistory(patientId)) as any[];

    return raw.map((r) => ({
      ...r,
      medicines: r.medicines
        ? r.medicines.split(";;").map((m: string) => {
            const [medicine_name, dosage, frequency, duration] = m.split("|");
            return { medicine_name, dosage, frequency, duration };
          })
        : [],
    }));
  }

  async getMedicalHistoryPaginated(userId: number, query?: IPaginationQuery) {
    const patientId = await this.resolvePatientId(userId);
    const { page, limit } = this.normalizePagination(query);
    const { rows, total } = await this.repo.getMedicalHistoryPaginated(patientId, { page, limit });

    const data = rows.map((r: any) => ({
      ...r,
      medicines: r.medicines
        ? r.medicines.split(";;").map((m: string) => {
            const [medicine_name, dosage, frequency, duration] = m.split("|");
            return { medicine_name, dosage, frequency, duration };
          })
        : [],
    }));

    return this.buildPaginatedResponse(data, total, page, limit);
  }

  async getMedicalRecord(userId: number, recordId: number) {
    const patientId = await this.resolvePatientId(userId);
    const record = await this.repo.getMedicalRecordById(recordId, patientId);
    if (!record) throw new Error("Record not found");
    return record;
  }

  async getHospitals(){
    const hospitals = await this.repo.getHospitals();
    return hospitals;
  }
}
