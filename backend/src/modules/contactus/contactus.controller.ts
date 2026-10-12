import { Request, Response } from "express";
import { catchAsync } from "../../common/helpers/catch-async.js";
import { ContactUsService } from "./contactus.service.js";

export class ContactUsController {
  private contactUsService = new ContactUsService();

  postMessage = catchAsync(async (req: Request, res: Response) => {
    const { first_name, last_name, email, message } = req.body;

    if (!first_name || !last_name || !email || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    await this.contactUsService.createMessage({ first_name, last_name, email, message });
    return res.status(201).json({ success: true, message: "Message received successfully" });
  });

  getMessages = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";

    const result = await this.contactUsService.getMessages(page, limit, search);
    return res.status(200).json({ success: true, data: result });
  });

  patchStatus = catchAsync(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }
    await this.contactUsService.updateStatus(id, status);
    return res.status(200).json({ success: true, message: "Status updated successfully" });
  });

  deleteMessage = catchAsync(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    await this.contactUsService.softDelete(id);
    return res.status(200).json({ success: true, message: "Message deleted successfully" });
  });

  postReply = catchAsync(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const { reply_text } = req.body;
    if (!reply_text) {
      return res.status(400).json({ success: false, message: "Reply text is required" });
    }
    await this.contactUsService.saveReply(id, reply_text);
    return res.status(201).json({ success: true, message: "Reply saved successfully" });
  });
}
