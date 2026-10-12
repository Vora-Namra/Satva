import { query } from "../../database/connection.js";

import {
  CreateTelemedicineSession,
  TelemedicineSession,
} from "./telemedicine.interface.js";

export class TelemedicineRepository {

  async createTelemedicineSession(
    data: CreateTelemedicineSession
  ): Promise<{
    telemedicine_session_id: number;
    appointment_id: number;
    meeting_link: string | null;
  }> {

    const sql = `
  insert into telemedicine_sessions
  (
    appointment_id,
    meeting_link
    
  )
  values (?, ?)
`;

    const result: any = await query(sql, [
      data.appointment_id,
      data.meeting_link ?? null
    ]);

    return {
      telemedicine_session_id: result.insertId,
      appointment_id: data.appointment_id,
      meeting_link: data.meeting_link ?? null
    };
  }



  async getTelemedicineSessionById(
    sessionId: number
  ): Promise<TelemedicineSession | null> {

    const sql = `
  select *
  from telemedicine_sessions
  where session_id = ?
`;

    const rows = await query(
      sql,
      [sessionId]
    ) as TelemedicineSession[];

    return rows.length > 0
      ? rows[0] as TelemedicineSession
      : null;
  }

  async getTelemedicineSessionByAppointmentId(
    appointmentId: number
  ): Promise<TelemedicineSession | null> {

    const sql = `
  select *
  from telemedicine_sessions
  where appointment_id = ?
`;
    const rows = await query(
      sql,
      [appointmentId]
    ) as TelemedicineSession[];

    return rows.length > 0
      ? rows[0] as TelemedicineSession
      : null;
  }

  async getTelemedicineSessionsByPatientId(
    patientId: number
  ): Promise<TelemedicineSession[]> {

    const sql = `
  select ts.*
  from telemedicine_sessions ts
  inner join appointments a
    on ts.appointment_id = a.appointment_id
  where a.patient_id = ?
  order by ts.created_at desc
`;

    return await query(
      sql,
      [patientId]
    ) as TelemedicineSession[];
  }

  async getTelemedicineSessionsByDoctorId(
    doctorId: number
  ): Promise<TelemedicineSession[]> {

    const sql = `
  select ts.*
  from telemedicine_sessions ts
  inner join appointments a
    on ts.appointment_id = a.appointment_id
  where a.patient_id = ?
  order by ts.created_at desc
`;

    return await query(
      sql,
      [doctorId]
    ) as TelemedicineSession[];
  }

  async startTelemedicineSession(
    sessionId: number
  ): Promise<void> {

    const sql = `
      update telemedicine_sessions
      set
        status = 'STARTED',
        started_at = UTC_TIMESTAMP()
      where session_id = ?
    `;

    await query(sql, [sessionId]);
  }

  async endTelemedicineSession(
    sessionId: number
  ): Promise<void> {

    const sql = `
      update telemedicine_sessions
      set
        status = 'COMPLETED',
        ended_at = UTC_TIMESTAMP()
      where session_id = ?
    `;

    await query(sql, [sessionId]);
  }

  async updateTelemedicineSessionStatus(
    sessionId: number,
    status: string
  ): Promise<void> {

    const sql = `
      update telemedicine_sessions
      set status = ?
      where session_id = ?
    `;

    await query(sql, [
      status,
      sessionId
    ]);
  }

  async updateTelemedicineMeetingLink(
    sessionId: number,
    meetingLink: string
  ): Promise<void> {

    const sql = `
      update telemedicine_sessions
      set meeting_link = ?
      where session_id = ?
    `;

    await query(sql, [
      meetingLink,
      sessionId
    ]);
  }

}