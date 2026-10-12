import { Request, Response } from "express";
import { catchAsync } from "../../common/helpers/catch-async.js";
import { generalResponse } from "../../common/helpers/general-response.js";
import { PatientService } from "./patient.service.js";
import { AuthRequest } from "../../common/middlewares/auth.middleware.js";
import logger from "../../common/logger.js";
import {
  IBookAppointment,
  IPaginationQuery,
  ISearchDoctorsQuery,
  IUpdatePatientProfile,
} from "./types/patient.js";

export class PatientController {
  private service = new PatientService();

  // Profile
  getProfile = catchAsync(async (req: Request, res: Response) => {
    let result: any = null;
    try {
      result = await this.service.getProfile((req as AuthRequest).user.id);
    } catch (e) {
      // Patient record might be missing, ignore to allow profile update check
    }
    const isProfileUpdated = !!(result?.mobile?.trim() && result?.address_line1?.trim());
    generalResponse({
      res,
      data: { ...result, isProfileUpdated },
      message: "Profile fetched",
      statusCode: 200,
    });
  });

updateProfile = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as any;
  const body = req.body as IUpdatePatientProfile;

  const profileImage = files?.profile_upload?.[0];
  const policyDocument = files?.policy_document?.[0];

  if (profileImage) {
    body.profile_path = profileImage.path;
  }

  if (policyDocument) {
    body.policy_document_path = policyDocument.path;
  }

  const result = await this.service.updateProfile(
    (req as AuthRequest).user.id,
    body,
  );

  generalResponse({
    res,
    data: result,
    message: "Profile updated",
    statusCode: 200,
  });
});

  // Family
  getFamilyMembers = catchAsync(async (req: Request, res: Response) => {
    const result = await this.service.getFamilyMembers(
      (req as AuthRequest).user.id,
    );
    generalResponse({
      res,
      data: result,
      message: "Family members fetched",
      statusCode: 200,
    });
  });



  addFamilyMember = catchAsync(async (req: Request, res: Response) => {
    const result = await this.service.addFamilyMember(
      (req as AuthRequest).user.id,
      req.body,
    );
    console.log(req.body)
    generalResponse({
      res,
      data: result,
      message: "Family member added",
      statusCode: 201,
    });
  });

  updateFamilyMember = catchAsync(async (req: Request, res: Response) => {
    const result = await this.service.updateFamilyMember(
      (req as AuthRequest).user.id,
      Number(req.params.memberId),
      req.body,
    );
    generalResponse({
      res,
      data: result,
      message: "Family member updated",
      statusCode: 200,
    });
  });

  deleteFamilyMember = catchAsync(async (req: Request, res: Response) => {
    await this.service.deleteFamilyMember(
      (req as AuthRequest).user.id,
      Number(req.params.memberId),
    );
    generalResponse({
      res,
      data: null,
      message: "Family member removed",
      statusCode: 200,
    });
  });

  // Doctor search
  searchDoctors = catchAsync(async (req: Request, res: Response) => {
    const query = (req as any).validatedQuery as ISearchDoctorsQuery;
    const result = await this.service.searchDoctors(query);
    generalResponse({
      res,
      data: result,
      message: "Doctors fetched",
      statusCode: 200,
    });
  });

  searchDoctorsPaginated = catchAsync(async (req: Request, res: Response) => {
    const query = (req as any).validatedQuery as ISearchDoctorsQuery & IPaginationQuery;
    const result = await this.service.searchDoctorsPaginated(query);
    generalResponse({
      res,
      data: result,
      message: "Doctors fetched",
      statusCode: 200,
    });
  });

  getDoctorDetail = catchAsync(async (req: Request, res: Response) => {
    const result = await this.service.getDoctorDetail(
      Number(req.params.doctorId),
    );
    generalResponse({
      res,
      data: result,
      message: "Doctor fetched",
      statusCode: 200,
    });
  });

  // Payments

  getPaymentHistory = catchAsync(async (req: Request, res: Response) => {
    const result = await this.service.getPaymentHistory(
      (req as AuthRequest).user.id,
    );
    generalResponse({
      res,
      data: result,
      message: "Payment history fetched",
      statusCode: 200,
    });
  });

  getPaymentHistoryPaginated = catchAsync(async (req: Request, res: Response) => {
    const query = (req as any).validatedQuery as IPaginationQuery;
    const result = await this.service.getPaymentHistoryPaginated(
      (req as AuthRequest).user.id,
      query,
    );
    generalResponse({
      res,
      data: result,
      message: "Payment history fetched",
      statusCode: 200,
    });
  });

  // Medical records
  getMedicalHistory = catchAsync(async (req: Request, res: Response) => {
    const result = await this.service.getMedicalHistory(
      (req as AuthRequest).user.id,
    );
    generalResponse({
      res,
      data: result,
      message: "Medical history fetched",
      statusCode: 200,
    });
  });

  getMedicalHistoryPaginated = catchAsync(async (req: Request, res: Response) => {
    const query = (req as any).validatedQuery as IPaginationQuery;
    const result = await this.service.getMedicalHistoryPaginated(
      (req as AuthRequest).user.id,
      query,
    );
    generalResponse({
      res,
      data: result,
      message: "Medical history fetched",
      statusCode: 200,
    });
  });

  getMedicalRecord = catchAsync(async (req: Request, res: Response) => {
    const result = await this.service.getMedicalRecord(
      (req as AuthRequest).user.id,
      Number(req.params.recordId),
    );
    generalResponse({
      res,
      data: result,
      message: "Medical record fetched",
      statusCode: 200,
    });
  });

  getMedicalRecordSummary = catchAsync(
    async (req: Request, res: Response) => {
      const userId = (req as AuthRequest).user.id;

      const recordId = Number(req.params.id);

      const result =
        await this.service.getMedicalRecordSummary(
          userId,
          recordId,
        );

      generalResponse({
        res,
        data: result,
        message: "Medical summary generated",
        statusCode: 200,
      });
    },
  );
  
  getHospitals = catchAsync(async (req: Request, res: Response) => {
    const result = await this.service.getHospitals();
    generalResponse({
      res,
      data: result,
      message: "Hospitals fetched",
      statusCode: 200,
    });
  });


}
