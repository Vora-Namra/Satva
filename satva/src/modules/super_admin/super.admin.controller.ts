import { Request, Response } from "express";
import { catchAsync } from "../../common/helpers/catch-async.js";
import { generalResponse } from "../../common/helpers/general-response.js";
import { SuperAdminService } from "./super.admin.service.js";
import { HospitalService } from "../hospital/hospital.service.js";
import { LoginInput } from "./validators/superadmin.crud.validations.js";

export class SuperAdminController {
  private superAdminService = new SuperAdminService();
  private hospitalService = new HospitalService();


  postLogin = catchAsync(async (req: Request, res: Response) => {
    try {
      const result = await this.superAdminService.login(req.body);
      res.cookie("accessToken", result.accessToken);
      generalResponse({
        res,
        data: result,
        message: "Logged in Successfully",
        statusCode: 200,
      });
    } catch (error) {
      generalResponse({
        res,
        data: error,
        message: `${error instanceof Error ? error.message : "Error"}`,
        statusCode:
          error instanceof Error
            ? ((error.cause as { status?: number })?.status ?? 500)
            : 500,
      });
    }
  });

  seedSuperAdmin = catchAsync(async (req: Request, res: Response) => {
    try {
      const result = await this.superAdminService.seed(req.body);
      generalResponse({
        res,
        data: result,
        message: "Super Admin created",
        statusCode: 201,
      });
    } catch (error) {
      generalResponse({
        res,
        data: error,
        message: `${error instanceof Error ? error.message : "Error while seeding super admin"}`,
        statusCode: 500,
      });
    }
  });


  getAdminsList = catchAsync(async (req: Request, res: Response) => {
    try {
    
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const result = await this.superAdminService.getAdminsList(
        page,
        limit,
        search,
      );

      const formattedData = result.data.map((a: any) => ({
        id: a.admin_id,
        name: `${a.first_name} ${a.last_name}`,
        email: a.email,
        role: "Admin",
        status: a.status,
      }));

      generalResponse({
        res,
        data: {
          data: formattedData,
          total: result.total,
          page: result.page,
          limit: result.limit,
        },
        message: "Admins fetched successfully",
        statusCode: 200,
      });
    } catch (error) {
      generalResponse({
        res,
        data: error,
        message: `${error instanceof Error ? error.message : "Error"}`,
        statusCode:
          error instanceof Error
            ? ((error.cause as { status?: number })?.status ?? 500)
            : 500,
      });
    }
  });


  postCreateAdmin = catchAsync(async (req: Request, res: Response) => {
    try {
      // The registerAdmin method in service already handles user/admin creation
      await this.superAdminService.registerAdmin(req.body);

      generalResponse({
        res,
        data: null,
        message: "Admin created successfully.",
        statusCode: 201,
      });
    } catch (error) {
      generalResponse({
        res,
        data: error,
        message: `${error instanceof Error ? error.message : "Error"}`,
        statusCode:
          error instanceof Error
            ? ((error.cause as { status?: number })?.status ?? 500)
            : 500,
      });
    }
  });


  putEditAdmin = catchAsync(async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      await this.superAdminService.updateAdmin(id, req.body);

      generalResponse({
        res,
        data: null,
        message: "Admin updated successfully.",
        statusCode: 200,
      });
    } catch (error) {
      generalResponse({
        res,
        data: error,
        message: `${error instanceof Error ? error.message : "Error"}`,
        statusCode:
          error instanceof Error
            ? ((error.cause as { status?: number })?.status ?? 500)
            : 500,
      });
    }
  });


}
