import { catchAsync } from "../../common/helpers/catch-async.js";
import { NextFunction, Request, Response } from "express";
import { generalResponse } from "../../common/helpers/general-response.js";
import { DoctorService } from "./doctor.service.js";

import { AuthRequest } from "../../common/middlewares/auth.middleware.js";
import {
  IDoctorLeave,
  IDoctorRecordsFill,
  IDoctorSchedule,
} from "./doctor.interface.js";

import {
  BadRequestException,
  InternalServerException,
  NotFoundException,
} from "../../common/helpers/http-exception.js";

export class DoctorController {
  private doctorService = new DoctorService();

  getDoctor = catchAsync(async (req: Request, res: Response) => {
    const user_id: number = (req as AuthRequest).user.id;
    const result = await this.doctorService.getDoctor(user_id);

    generalResponse({
      res,
      data: [result],
      message: "successfully fetched doctor profile",
      statusCode: 200,
    });
  });

  getAppointmentByDate = catchAsync(async (req: Request, res: Response) => {
    const user_id: number = (req as AuthRequest).user.id;
    const date:any = req.query.appointment_date || "";

    const result = await this.doctorService.getAppointmentByDate(user_id, date);

    generalResponse({
      res,
      data: [result],
      message: "Successfully Fetched Todays Appointment",
      statusCode: 200,
    });
  });

  getDoctorDashboard = catchAsync(async (req: Request, res: Response) => {
    const user_id: number = (req as AuthRequest).user.id;

    const result = await this.doctorService.getDoctorDashboardData(user_id);

    generalResponse({
      res,
      data: [result],
      message: "Successfully Fetched DashboardData",
      statusCode: 200,
    });
  });

  getWeeklySchedule = catchAsync(async (req: Request, res: Response) => {
    const user_id: number = (req as AuthRequest).user.id;
    const result = await this.doctorService.getWeeklySchedule(user_id);

    generalResponse({
      res,
      data: [result],
      message: "Weekly Schedule Fetched Successfully",
      statusCode: 200,
    });
  });

  postWeeklySchedule = catchAsync(async (req: Request, res: Response) => {
    const user_id: number = (req as AuthRequest).user.id;
    const data: IDoctorSchedule = req.body;

    if (!data) {
      throw new BadRequestException("Data is Empty");
    }

    const result = await this.doctorService.setWeeklySchedule(data, user_id);

    generalResponse({
      res,
      data: [],
      message: "Successfully Inserted Data",
      statusCode: 201,
    });
  });

  getPatientList = catchAsync(async (req: Request, res: Response) => {
    const user_id = (req as AuthRequest).user.id;
    const result = await this.doctorService.getPatientList(user_id);

    generalResponse({
      res,
      data: [result],
      message: "Successfully Fetched Data",
      statusCode: 200,
    });
  });

  postPatientMedicalRecords = catchAsync(
    async (req: Request, res: Response) => {
      // const {patient_id,doctor_id,appointment_id,diagnosis,examination_notes}=req.body

      const payload: IDoctorRecordsFill = JSON.parse(req.body.payload);

      this.doctorService.postRecords(payload, req.files);

      //pending will work when frontend integrated

      generalResponse({
        res,
        data: [],
        message: "Successfully Inserted Medical Data",
        statusCode: 201,
      });
    },
  );

  getPatientAllMedicalRecords = catchAsync(
    async (req: Request, res: Response) => {
      const user_id = (req as AuthRequest).user.id;
      const patient_id = Number(req.params.patient_id);

      if (!patient_id || patient_id == undefined) {
        throw new BadRequestException("patient id is required");
      }

      const result = await this.doctorService.getPatientAllAppointmentByDoctor(
        user_id,
        patient_id,
      );

      generalResponse({
        res,
        data: result,
        message: "Successfully Fetched Medical Records",
        statusCode: 200,
      });
    },
  );

  getPatientMedicalData = catchAsync(async (req: Request, res: Response) => {
    const appointment_id = Number(req.params.appointment_id);

    if (!appointment_id || appointment_id == undefined) {
      throw new BadRequestException("appointment_id is required");
    }
    const medical_records =
      await this.doctorService.getMedicalRecords(appointment_id);

    if (!medical_records) {
      throw new NotFoundException("No Medical Records Found");
    }

    const record_id = await medical_records.record_id;
    const medical_attachments =
      await this.doctorService.getPatientAllMedicalAttachments(record_id);
    const prescription_data =
      await this.doctorService.getPatientMedicalRecordAllPrescription(
        record_id,
      );

    generalResponse({
      res,
      data: [medical_records, medical_attachments, prescription_data],
      message: "Successfully Fetched Medical Record Data",
      statusCode: 200,
    });
  });

  getSpecialites = catchAsync(async (req: Request, res: Response) => {
    const search = String(req.query.search) || "";
    if (!search || search == undefined) {
      throw new BadRequestException("search value cannot be empty");
    }
    const specialities_list = await this.doctorService.getSpecialties(search);

    generalResponse({
      res,
      data: [specialities_list],
      message: "Successfully Fetched Specialities List",
      statusCode: 200,
    });
  });

  postProfileData = catchAsync(async (req: Request, res: Response) => {
    const data = JSON.parse(req.body.data);
    const file = req.file;
    const result = await this.doctorService.postProfileUpdateData(data, file);
    generalResponse({
      res,
      data: [],
      message: "Successfully Data upload",
      statusCode: 201,
    });
  });

  getHospitalDetails = catchAsync(async (req: Request, res: Response) => {
    const user_id = (req as AuthRequest).user.id;
    const hospitalDetails =
      await this.doctorService.getHospitalDetails(user_id);
    generalResponse({
      res,
      data: [hospitalDetails],
      message: "Successfully Fetched Data",
      statusCode: 200,
    });
  });

  updateAppointmentStatus = catchAsync(async (req: Request, res: Response) => {
    const user_id = (req as AuthRequest).user.id;
    const { appointment_id, appointment_status } = req.body;
    const result = await this.doctorService.updateAppointmentStatus(
      user_id,
      appointment_id,
      appointment_status,
    );
    generalResponse({
      res,
      data: [],
      message: "Successfully Updated",
      statusCode: 200,
    });
  });

  postLeaves = catchAsync(async (req: Request, res: Response) => {
    const user_id = (req as AuthRequest).user.id;

    const data: IDoctorLeave = req.body;

    const result = await this.doctorService.setLeaves(data, user_id);

    generalResponse({
      res,
      data: [],
      message: "Successfully Applied For Leave",
      statusCode: 201,
    });
  });

  deleteLeaves = catchAsync(async (req: Request, res: Response) => {
    const { leave_id } = req.body;

    const result = await this.doctorService.deleteLeave(Number(leave_id));

    generalResponse({
      res,
      data: [],
      message: "Successfully Cancelled Leave",
      statusCode: 201,
    });
  });
}
