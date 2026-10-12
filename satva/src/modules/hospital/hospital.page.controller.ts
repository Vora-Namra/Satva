import { Request, Response } from "express";
import { catchAsync } from "../../common/helpers/catch-async.js";
import { HospitalService } from "./hospital.service.js";
import { SuperAdminService } from "../super_admin/super.admin.service.js";

export class HospitalPageController {
  private hospitalService = new HospitalService();
  private superAdminService = new SuperAdminService();

  getHospitalsList = catchAsync(async (req: Request, res: Response) => {
    const hospitals = await this.hospitalService.getAllHospitals();
    return res.render("super_admin/hospitals-list", { hospitals });
  });

  getCreateHospital = catchAsync(async (req: Request, res: Response) => {
    return res.render("super_admin/create-hospital");
  });

  getEditHospital = catchAsync(async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const hospital = await this.hospitalService.getHospitalById(id);
      
      // Map hospital_id to id for the frontend
      hospital.id = hospital.hospital_id;
      
      return res.render("super_admin/edit-hospital", { hospital });
    } catch (error) {
      return res.redirect("/super-admin/dashboard");
    }
  });

  getViewHospital = catchAsync(async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const hospital = await this.hospitalService.getHospitalById(id);
      const admins = await this.superAdminService.getAdminsByHospitalId(id);
      
      hospital.id = hospital.hospital_id;
      return res.render("super_admin/view-hospital", { hospital, admins });
    } catch (error) {
      return res.redirect("/super-admin/dashboard");
    }
  });
}
