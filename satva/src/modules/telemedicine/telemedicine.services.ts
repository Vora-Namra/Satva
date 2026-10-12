import { TelemedicineRepository } from "./telemedicine.repositories.js";
import {
  CreateTelemedicineSession,
  ZoomResponse,
} from "./telemedicine.interface.js";
import { createZoomMeeting } from "./utils/zoom.service.js";
import strict from "node:assert/strict";
import { getConnection } from "../../database/connection.js";

export class TelemedicineService {
  private telemedicineRepo = new TelemedicineRepository();

  async createTelemedicineSession(data: CreateTelemedicineSession) {
    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      const existingSession =
        await this.telemedicineRepo.getTelemedicineSessionByAppointmentId(
          data.appointment_id,
        );

      if (existingSession) {
        throw new Error(
          "Telemedicine session already exists for this appointment",
        );
      }

      let meeting: ZoomResponse = await createZoomMeeting();

      data.meeting_link = meeting.join_url as string;

      const result =
        await this.telemedicineRepo.createTelemedicineSession(data);

      conn.commit();

      return {
        data: result,
        message: "Telemedicine session created successfully",
      };
    } catch (err: unknown) {
      await conn.rollback();
      throw err;
    }
  }

  async getTelemedicineSessionById(sessionId: number) {
    const session =
      await this.telemedicineRepo.getTelemedicineSessionById(sessionId);

    if (!session) {
      throw new Error("Telemedicine session not found");
    }

    return session;
  }

  async getTelemedicineSessionByAppointmentId(appointmentId: number) {
    const session =
      await this.telemedicineRepo.getTelemedicineSessionByAppointmentId(
        appointmentId,
      );

    if (!session) {
      throw new Error("Telemedicine session not found");
    }

    return session;
  }

  async getTelemedicineSessionsByPatientId(patientId: number) {
    return await this.telemedicineRepo.getTelemedicineSessionsByPatientId(
      patientId,
    );
  }

  async getTelemedicineSessionsByDoctorId(doctorId: number) {
    return await this.telemedicineRepo.getTelemedicineSessionsByDoctorId(
      doctorId,
    );
  }

  async startTelemedicineSession(sessionId: number) {
    const conn = await getConnection();
    try{
      await conn.beginTransaction();
      const session =
      await this.telemedicineRepo.getTelemedicineSessionById(sessionId);
      
        if (!session) {
          throw new Error("Telemedicine session not found");
        }
        
        if (session.status !== "SCHEDULED") {
          throw new Error("Only scheduled sessions can be started");
        }
        
        await this.telemedicineRepo.startTelemedicineSession(sessionId);

        await conn.commit();

        return {
          message: "Telemedicine session started successfully",
        };

      }catch(err:unknown){
        await conn.rollback();
        throw err;
      }
    }

  async endTelemedicineSession(sessionId: number) {
    const conn = await getConnection();
    try{

      await conn.beginTransaction();

      const session =
      await this.telemedicineRepo.getTelemedicineSessionById(sessionId);
      
      if (!session) {
        throw new Error("Telemedicine session not found");
      }
      
      if (session.status !== "STARTED") {
        throw new Error("Only active sessions can be ended");
      }
      
      await this.telemedicineRepo.endTelemedicineSession(sessionId);
      
      await conn.commit();

      return {
        message: "Telemedicine session ended successfully",
      };
    }catch(err:unknown){
      await conn.rollback();
      throw err;
    }
  }

  async updateTelemedicineSessionStatus(sessionId: number, status: string) {
    const conn = await getConnection();
    try{

      await conn.beginTransaction();

    const session =
      await this.telemedicineRepo.getTelemedicineSessionById(sessionId);
      
      if (!session) {
        throw new Error("Telemedicine session not found");
      }

      await this.telemedicineRepo.updateTelemedicineSessionStatus(
        sessionId,
        status,
      );

      await conn.commit();

      return {
        message: "Telemedicine session status updated successfully",
      };
    }catch(err:unknown){
      await conn.rollback();
      throw err;
    }
  }

  async updateTelemedicineMeetingLink(sessionId: number) {
    const conn = await getConnection();
    try{
      await conn.beginTransaction();
      const meeting = await createZoomMeeting();
      
      await this.telemedicineRepo.updateTelemedicineMeetingLink(
        sessionId,
        meeting.join_url as string,
      );
      
      await conn.commit();

      return {
        sessionId,
        meetingLink: meeting.join_url,
        hostLink: meeting.start_url,
        zoomMeetingId: meeting.id,
      };
      
    }catch(err:unknown){
      conn.rollback();
      throw err;
    }
    }
}
