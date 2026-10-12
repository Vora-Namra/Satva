import { Request, Response } from "express";
import { catchAsync } from "../../common/helpers/catch-async.js";
import { generalResponse } from "../../common/helpers/general-response.js";
import { AppointmentService } from "./appointment.service.js";
import { AuthRequest } from "../../common/middlewares/auth.middleware.js";
import { IAppointmentListQuery } from "./appointment.interface.js";

export class AppointmentController {
  private appointmentService = new AppointmentService();

  bookAppointment = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id;
    console.log(req.body);
    const result = await this.appointmentService.bookAppointment(userId, req.body);
    console.log(result);
    generalResponse({
      res,
      data: result,
      message: "Appointment booked successfully",
      statusCode: 201,
    });
  });

  rescheduleAppointment = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id;
    const appointmentId = Number(req.params.id);
    
    const result = await this.appointmentService.rescheduleAppointment(userId, appointmentId, req.body);
    
    generalResponse({
      res,
      data: result,
      message: "Appointment rescheduled successfully",
      statusCode: 200,
    });
  });

  cancelAppointment = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id;
    const appointmentId = Number(req.params.id);
    const { reason } = req.body;
    
    const result = await this.appointmentService.cancelAppointment(userId, appointmentId, reason);
    
    generalResponse({
      res,
      data: result,
      message: "Appointment cancelled successfully",
      statusCode: 200,
    });
  });

  getAppointments = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id;
    const status = req.query.status as string;
    
    const result = await this.appointmentService.getAppointments(userId, status);
    
    generalResponse({ res, data: result, message: "Appointments retrieved successfully", statusCode: 200 });
  });

  getAppointmentsPaginated = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id;
    const query = (req as any).validatedQuery as IAppointmentListQuery;

    const result = await this.appointmentService.getAppointmentsPaginated(userId, query);

    generalResponse({ res, data: result, message: "Appointments retrieved successfully", statusCode: 200 });
  });

  getAvailableSlots = catchAsync(async (req: Request, res: Response) => {
    const doctorId = Number(req.query.doctor_id);
    const date = req.query.date as string;
    console.log(doctorId,date)
    const result = await this.appointmentService.getAvailableSlots(doctorId, date);
    console.log(result)
    generalResponse({ res, data: result, message: "Available slots retrieved successfully", statusCode: 200 });
  });

  getDoctorTodaysAppointments = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id;
    const result = await this.appointmentService.getDoctorTodaysAppointments(userId);
    generalResponse({ res, data: result, message: "Today's appointments retrieved successfully", statusCode: 200 });
  });

  getDoctorDashboardData = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id;
    const result = await this.appointmentService.getDoctorDashboardData(userId);
    generalResponse({ res, data: result, message: "Doctor dashboard data retrieved successfully", statusCode: 200 });
  });
}