import { uploadPatientProfile } from "../../../utils/multer.js";

export const patientProfileAndInsuranceUpload =
  uploadPatientProfile.fields([
    {
      name: "profile_upload",
      maxCount: 1,
    },
    {
      name: "policy_document",
      maxCount: 1,
    },
  ]);