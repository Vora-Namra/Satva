import { Request, Response } from "express";
import { catchAsync } from "../../common/helpers/catch-async.js";
import { generalResponse } from "../../common/helpers/general-response.js";
import { HospitalService } from "./hospital.service.js";


export class HospitalController {
  private hospitalService = new HospitalService();


  getHospitalsList = catchAsync(async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      
      const result = await this.hospitalService.getHospitalsList(page, limit, search);

      const formattedData = result.data.map((h: any) => ({
        id: h.hospital_id,
        name: h.hospital_name,
        location: h.address_line1,
        status: "Active",
        email: h.email,
        contact_number: h.contact_number
      }));

      generalResponse({
        res,
        data: {
          data: formattedData,
          total: result.total,
          page: result.page,
          limit: result.limit
        },
        message: "Hospitals fetched successfully",
        statusCode: 200
      });
    } catch (error) {
      generalResponse({
        res,
        data: error,
        message: `${error instanceof Error ? error.message : "Error"}`,
        statusCode: error instanceof Error ? ((error.cause as { status?: number })?.status ?? 500) : 500,
      });
    }
  });


  postCreateHospital = catchAsync(async (req: Request, res: Response) => {
    try {
      await this.hospitalService.createHospital(req.body);
      
      generalResponse({
        res,
        data: null,
        message: "Hospital created successfully.",
        statusCode: 201,
      });
    } catch (error) {
      generalResponse({
        res,
        data: error,
        message: `${error instanceof Error ? error.message : "Error"}`,
        statusCode: error instanceof Error ? ((error.cause as { status?: number })?.status ?? 500) : 500,
      });
    }
  });


  putEditHospital = catchAsync(async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      await this.hospitalService.updateHospital(id, req.body);

      generalResponse({
        res,
        data: null,
        message: "Hospital updated successfully.",
        statusCode: 200,
      });
    } catch (error) {
      generalResponse({
        res,
        data: error,
        message: `${error instanceof Error ? error.message : "Error"}`,
        statusCode: error instanceof Error ? ((error.cause as { status?: number })?.status ?? 500) : 500,
      });
    }
  });


}
