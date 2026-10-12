import { query2 as query } from "../../database/connection.js";

export class ContactUsRepository {
  async createMessage(data: { first_name: string; last_name: string; email: string; message: string }) {
    const result = await query(
      `INSERT INTO contactus_messages (first_name, last_name, email, message) VALUES (?, ?, ?, ?)`,
      [data.first_name, data.last_name, data.email, data.message]
    );
    return result;
  }

  async getMessages(page: number = 1, limit: number = 10, search: string = "") {
    const offset = (page - 1) * limit;
    let queryStr = `SELECT * FROM contactus_messages WHERE is_deleted = FALSE`;
    let countQueryStr = `SELECT COUNT(*) as total FROM contactus_messages WHERE is_deleted = FALSE`;
    const params: (string | number)[] = [];
    const countParams: (string | number)[] = [];

    if (search) {
      queryStr += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR message LIKE ?)`;
      countQueryStr += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR message LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    queryStr += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));


    const [rows, countResult] = await Promise.all([
      query(queryStr, params),
      query(countQueryStr, countParams)
    ]);

    const countRows = countResult as { total: number }[];
    const total = countRows[0]!.total;

    return {
      data: rows,
      total,
      page,
      limit
    };
  }

  async updateStatus(id: number, status: string) {
    const result = await query(
      `UPDATE contactus_messages SET status = ? WHERE id = ?`,
      [status, id]
    );
    return result;
  }

  async softDelete(id: number) {
    const result = await query(
      `UPDATE contactus_messages SET is_deleted = TRUE WHERE id = ?`,
      [id]
    );
    return result;
  }

  async saveReply(message_id: number, reply_text: string) {
    const result = await query(
      `INSERT INTO contactus_replies (message_id, reply_text) VALUES (?, ?)`,
      [message_id, reply_text]
    );
    return result;
  }
}
