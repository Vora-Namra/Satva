import { ContactUsRepository } from "./contactus.repository.js";

export class ContactUsService {
  private repository = new ContactUsRepository();

  async createMessage(data: { first_name: string; last_name: string; email: string; message: string }) {
    return this.repository.createMessage(data);
  }

  async getMessages(page: number = 1, limit: number = 10, search: string = "") {
    return this.repository.getMessages(page, limit, search);
  }

  async updateStatus(id: number, status: string) {
    return this.repository.updateStatus(id, status);
  }

  async softDelete(id: number) {
    return this.repository.softDelete(id);
  }

  async saveReply(message_id: number, reply_text: string) {
    // Optionally automatically update status to resolved when replied
    await this.repository.updateStatus(message_id, 'resolved');
    return this.repository.saveReply(message_id, reply_text);
  }
}
