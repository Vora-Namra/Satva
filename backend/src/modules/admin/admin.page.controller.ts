import { Request, Response } from "express";
import { catchAsync } from "../../common/helpers/catch-async.js";

export class AdminPageController {
    renderAuditLogsPage = catchAsync(async (req: Request, res: Response) => {
        res.render('admin/show_audit_logs');
    });

    renderDoctorsPage = catchAsync(async (req: Request, res: Response) => {
        res.render('admin/show_doctors');
    })
    renderPatientsPage = catchAsync(async (req: Request, res: Response) => {
        res.render('admin/show_patients')
    })

    renderAddDoctorPage = catchAsync(async (req: Request, res: Response) => {
        res.render('admin/add_doctors');
    })

    renderSingleDoctorPage = catchAsync(async (req: Request, res: Response) => {
        res.render('admin/view_single_doctor')
    })
    renderAppointmentsPage = catchAsync(async (req: Request, res: Response) => {
        res.render('admin/show_appointments');
    })
    renderSinglePatientPage = catchAsync(async (req: Request, res: Response) => {
        res.render('admin/view_single_patient')
    })
    renderSettingsPage = catchAsync(async (req: Request, res: Response) => {
        res.render('admin/settings');
    })
    renderSingleAppointmentPage = catchAsync(async (req: Request, res: Response) => {
        res.render('admin/view_single_appointment');
    })
    renderStaffPage = catchAsync(async (req: Request, res: Response) => {
        res.render('admin/show_staffs')
    })
    renderAddStaffPage = catchAsync(async (req: Request, res: Response) => {
        res.render('admin/add_staff');
    })
    renderViewSingleStaff = catchAsync(async (req: Request, res: Response) => {
        res.render('admin/view_single_staff')
    })
    renderLoginPage = catchAsync(async (req: Request, res: Response) => {
        res.render('super_admin/super_login')
    })
}