import { query } from "../../database/connection.js";

export class SuperAdminRepository {
  async findUserByEmail(email: string) {
    const rows: any = await query(
      `
        select *
        from users
        where email = ?
        `,
      [email],
    );

    return rows.length > 0 ? rows[0] : null;
  }

  async findUserById(user_id: number) {
    const result: any = await query("Select * from users where user_id=?", [
      user_id,
    ]);

    return result[0];
  }

  async updateLastLogin(userId: number): Promise<void> {
    await query(
      `
        update users
        set last_login_at = UTC_TIMESTAMP(),
        updated_at = UTC_TIMESTAMP()
        where user_id = ?
        `,
      [userId],
    );
  }

  async createAdmin(data: any) {
    const result: any = await query(
      `
        INSERT INTO admins (
            user_id,
            hospital_id,
            first_name,
            last_name,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
      [data.user_id, data.hospital_id, data.first_name, data.last_name],
    );

    return result.insertId;
  }

  async findAdminById(admin_id: number) {
    const sql = `
      SELECT a.admin_id, a.first_name, a.last_name, a.hospital_id, u.user_id, u.email, u.role, IF(u.is_active, 'Active', 'Inactive') AS status, h.hospital_name
      FROM admins a
      JOIN users u ON a.user_id = u.user_id
      LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
      WHERE a.admin_id = ?
    `;
    const rows = (await query(sql, [admin_id])) as any[];
    return rows.length > 0 ? rows[0] : null;
  }

  async updateAdmin(admin_id: number, adminData: any) {
    if (adminData.email || adminData.status) {
      const admin = await this.findAdminById(admin_id);
      if (admin) {
        const userFields = [];
        const userValues = [];
        if (adminData.email) {
          userFields.push("email = ?");
          userValues.push(adminData.email);
        }
        if (adminData.status) {
          userFields.push("is_active = ?");
          userValues.push(adminData.status === "Active" ? 1 : 0);
        }

        if (userFields.length > 0) {
          userValues.push(admin.user_id);
          await query(
            `UPDATE users SET ${userFields.join(", ")} WHERE user_id = ?`,
            userValues,
          );
        }
      }
    }

    const fields = [];
    const values = [];

    if (adminData.first_name) {
      fields.push("first_name = ?");
      values.push(adminData.first_name);
    }
    if (adminData.last_name) {
      fields.push("last_name = ?");
      values.push(adminData.last_name);
    }
    if (adminData.hospital_id) {
      fields.push("hospital_id = ?");
      values.push(adminData.hospital_id);
    }

    if (fields.length > 0) {
      values.push(admin_id);
      await query(
        `UPDATE admins SET ${fields.join(", ")} WHERE admin_id = ?`,
        values,
      );
    }
  }

  async findAll(limit: number, offset: number, search?: string) {
    let sql = `
      SELECT a.admin_id, a.first_name, a.last_name, u.email, u.role, IF(u.is_active, 'Active', 'Inactive') AS status
      FROM admins a
      JOIN users u ON a.user_id = u.user_id
      LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
    `;
    const params: any[] = [];

    if (search) {
      sql += ` WHERE h.hospital_name LIKE ? OR u.email LIKE ? OR a.first_name LIKE ? OR a.last_name LIKE ?`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
    params.push(String(limit), String(offset));

    const rows = (await query(sql, params)) as any[];
    return rows;
  }

  async countAll(search?: string) {
    let sql = `
      SELECT COUNT(*) as total 
      FROM admins a
      JOIN users u ON a.user_id = u.user_id
      LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
    `;
    const params: any[] = [];

    if (search) {
      sql += ` WHERE h.hospital_name LIKE ? OR u.email LIKE ? OR a.first_name LIKE ? OR a.last_name LIKE ?`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const rows: any = await query(sql, params);
    return rows[0].total;
  }

  async findAdminsByHospitalId(hospitalId: number) {
    const sql = `
      SELECT a.admin_id, a.first_name, a.last_name, u.email, u.role, IF(u.is_active, 'Active', 'Inactive') AS status
      FROM admins a
      JOIN users u ON a.user_id = u.user_id
      WHERE a.hospital_id = ?
      ORDER BY a.created_at DESC
    `;
    const rows = (await query(sql, [hospitalId])) as any[];
    return rows;
  }

  async getTodayRevenue() {
    const sql = `SELECT SUM(amount) as total_revenue FROM payments WHERE DATE(created_at) = CURDATE() AND status = 'SUCCESS'`;
    const rows = (await query(sql, [])) as any[];
    return rows[0]?.total_revenue || 0;
  }

  async getTotalDoctors() {
    const sql = `SELECT COUNT(*) as total_doctors FROM doctors`;
    const rows = (await query(sql, [])) as any[];
    return rows[0]?.total_doctors || 0;
  }

  async getTodayAppointments() {
    const sql = `SELECT COUNT(*) as total_appointments FROM appointments WHERE slot_date = CURDATE()`;
    const rows = (await query(sql, [])) as any[];
    return rows[0]?.total_appointments || 0;
  }
}
