import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/index.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export class GeminiService {
  private buildPrompt(record: any) {
    const medicines = record.prescriptionItems?.length
      ? record.prescriptionItems
          .map(
            (m: any, index: number) => `
    ${index + 1}. Medicine: ${m.medicine_name}
      Dosage: ${m.dosage}
      Frequency: ${m.frequency}
      Duration: ${m.duration}
    `,
          )
          .join("\n")
      : "No medicines prescribed.";

    const attachments = record.attachments?.length
      ? record.attachments
          .map(
            (a: any, index: number) => `
    ${index + 1}. File Name: ${a.file_name}
      File Path: ${a.file_path}
    `,
          )
          .join("\n")
      : "No attachments.";

    return `
    You are an experienced medical assistant.

    Explain this medical record in very simple English for a non-medical person.

    Rules:
    - Use simple words.
    - Keep sentences short.
    - Do not use bold formatting like **.
    - Do not be overly technical.
    - Explain the diagnosis, notes, medicines, and next steps clearly.
    - Add practical prevention and self-care tips.
    - Add warning signs that require a doctor visit.
    - Add a short disclaimer.

    Use this exact structure:

    Summary:
    What This Means:
    Medicines Explained:
    What You Should Do:
    Prevention Tips:
    When To Contact Doctor:
    Important Note:

    Medical Record:
    Doctor: ${record.doctor_first_name} ${record.doctor_last_name}
    Appointment Type: ${record.appointment_type}
    Appointment Date: ${record.slot_date}
    Diagnosis: ${record.diagnosis || "Not Available"}
    Examination Notes: ${record.examination_notes || "Not Available"}
    Prescription Notes: ${record.prescription_notes || "Not Available"}

    Medicines:
    ${medicines}

    Attachments:
    ${attachments}
    `;
  }

  async summarizeMedicalRecord(record: any): Promise<string> {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = this.buildPrompt(record);

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        if (!text) {
          throw new Error("Gemini returned empty summary");
        }

        return text;
      } catch (error: any) {
        if (error?.status === 503 && attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
          continue;
        }

        throw error;
      }
    }

    throw new Error("Failed to generate summary");
  }
}
