import { Request, Response } from "express";
import { TelemedicineService } from "./telemedicine.services.js";
import { catchAsync } from "../../common/helpers/catch-async.js";
import { generalResponse } from "../../common/helpers/general-response.js";

export class TelemedicineController {
  private telemedicineService = new TelemedicineService();

  createTelemedicineSession = catchAsync(
    async (req: Request, res: Response) => {
      const result =
        await this.telemedicineService.createTelemedicineSession(req.body);

      generalResponse({
        res,
        data: result.data,
        message: result.message,
        statusCode: 201,
      });
    }
  );

  getTelemedicineSessionById = catchAsync(
    async (req: Request, res: Response) => {
      const sessionId = Number(req.params.sessionId);
      
      const result =
        await this.telemedicineService.getTelemedicineSessionById(sessionId);

      generalResponse({
        res,
        data: [result],
        message: "Successfully fetched telemedicine session",
        statusCode: 200,
      });
    }
  );

  getTelemedicineSessionByAppointmentId = catchAsync(
    async (req: Request, res: Response) => {
      const appointmentId = Number(req.params.appointmentId);

      const result =
        await this.telemedicineService.getTelemedicineSessionByAppointmentId(
          appointmentId
        );

      generalResponse({
        res,
        data: [result],
        message: "Successfully fetched telemedicine session",
        statusCode: 200,
      });
    }
  );

  getTelemedicineSessionsByPatientId = catchAsync(
    async (req: Request, res: Response) => {
      const patientId = Number(req.params.patientId);

      const result =
        await this.telemedicineService.getTelemedicineSessionsByPatientId(
          patientId
        );

      generalResponse({
        res,
        data: result,
        message: "Successfully fetched patient sessions",
        statusCode: 200,
      });
    }
  );

  getTelemedicineSessionsByDoctorId = catchAsync(
    async (req: Request, res: Response) => {
      const doctorId = Number(req.params.doctorId);

      const result =
        await this.telemedicineService.getTelemedicineSessionsByDoctorId(
          doctorId
        );

      generalResponse({
        res,
        data: result,
        message: "Successfully fetched doctor sessions",
        statusCode: 200,
      });
    }
  );

  startTelemedicineSession = catchAsync(
    async (req: Request, res: Response) => {
      const sessionId = Number(req.params.sessionId);

      const result =
        await this.telemedicineService.startTelemedicineSession(sessionId);

      generalResponse({
        res,
        data: [],
        message: result.message,
        statusCode: 200,
      });
    }
  );

  endTelemedicineSession = catchAsync(
    async (req: Request, res: Response) => {
      const sessionId = Number(req.params.sessionId);

      const result =
        await this.telemedicineService.endTelemedicineSession(sessionId);

      generalResponse({
        res,
        data: [],
        message: result.message,
        statusCode: 200,
      });
    }
  );

  updateTelemedicineSessionStatus = catchAsync(
    async (req: Request, res: Response) => {
      const sessionId = Number(req.params.sessionId);
      const { status } = req.body;

      const result =
        await this.telemedicineService.updateTelemedicineSessionStatus(
          sessionId,
          status
        );

      generalResponse({
        res,
        data: [],
        message: result.message,
        statusCode: 200,
      });
    }
  );

  updateTelemedicineMeetingLink = catchAsync(
  async (req: Request, res: Response) => {
    const sessionId = Number(req.params.sessionId);

    const result =
      await this.telemedicineService.updateTelemedicineMeetingLink(
        sessionId
      );

    generalResponse({
      res,
      data: result,
      message: "Meeting link updated successfully",
      statusCode: 200,
    });
  }
);
}