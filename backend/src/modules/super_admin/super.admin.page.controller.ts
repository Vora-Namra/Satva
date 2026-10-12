import { Request, Response } from "express";
import { catchAsync } from "../../common/helpers/catch-async.js";
import { SuperAdminService } from "./super.admin.service.js";
import { HospitalService } from "../hospital/hospital.service.js";

export class SuperAdminPageController {
  private superAdminService = new SuperAdminService();
  private hospitalService = new HospitalService();

  getLogin = catchAsync(async (req: Request, res: Response) => {
    return res.status(200).render("super_admin/super_login");
  });

  dashboard = catchAsync(async (req: Request, res: Response) => {
    const stats = await this.superAdminService.getDashboardStats();
    return res.render("super_admin/dashboard", { stats });
  });

  getCreateAdmin = catchAsync(async (req: Request, res: Response) => {
    const hospitals = await this.hospitalService.getAllHospitals();
    return res.render("super_admin/create-admin", { hospitals });
  });

  getEditAdmin = catchAsync(async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const admin = await this.superAdminService.getAdminById(id);
      const hospitals = await this.hospitalService.getAllHospitals();

      admin.id = admin.admin_id;
      return res.render("super_admin/edit-admin", { admin, hospitals });
    } catch (error) {
      return res.redirect("/super-admin/dashboard");
    }
  });

  getViewAdmin = catchAsync(async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const admin = await this.superAdminService.getAdminById(id);

      admin.id = admin.admin_id;
      admin.name = `${admin.first_name} ${admin.last_name}`; // For the view template
      return res.render("super_admin/view-admin", { admin });
    } catch (error) {
      return res.redirect("/super-admin/dashboard");
    }
  });
}
