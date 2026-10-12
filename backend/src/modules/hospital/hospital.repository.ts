import { query } from "../../database/connection.js";

export interface Hospital {
  hospital_id?: number;
  hospital_name: string;
  email: string;
  address_line1: string;
  address_line2?: string;
  contact_number: string;
  created_at?: string;
  updated_at?: string;
}

export class HospitalRepository {
  async create(hospital: Hospital) {
    const sql = `
      INSERT INTO hospitals (hospital_name, email, address_line1, address_line2, contact_number)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      hospital.hospital_name,
      hospital.email,
      hospital.address_line1,
      hospital.address_line2 || null,
      hospital.contact_number
    ]);
    return result;
  }

  async findById(id: number) {
    const rows: any = await query('SELECT * FROM hospitals WHERE hospital_id = ?', [id]);
    return rows[0] || null;
  }

  async update(id: number, hospital: Partial<Hospital>) {
    const fields = [];
    const values = [];
    
    if (hospital.hospital_name) { fields.push('hospital_name = ?'); values.push(hospital.hospital_name); }
    if (hospital.email) { fields.push('email = ?'); values.push(hospital.email); }
    if (hospital.address_line1) { fields.push('address_line1 = ?'); values.push(hospital.address_line1); }
    if (hospital.address_line2 !== undefined) { fields.push('address_line2 = ?'); values.push(hospital.address_line2); }
    if (hospital.contact_number) { fields.push('contact_number = ?'); values.push(hospital.contact_number); }
    
    if (fields.length === 0) return null;
    
    values.push(id);
    const sql = `UPDATE hospitals SET ${fields.join(', ')} WHERE hospital_id = ?`;
    const result = await query(sql, values);
    return result;
  }

  async findAll(limit: number, offset: number, search?: string) {
    let sql = 'SELECT * FROM hospitals';
    const params: any[] = [];
    
    if (search) {
      sql += ' WHERE hospital_name LIKE ?';
      params.push(`%${search}%`);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(String(limit), String(offset));
    
    const rows = await query(sql, params) as any[];
    return rows;
  }

  async countAll(search?: string) {
    let sql = 'SELECT COUNT(*) as total FROM hospitals';
    const params: any[] = [];
    
    if (search) {
      sql += ' WHERE hospital_name LIKE ?';
      params.push(`%${search}%`);
    }
    
    const rows: any = await query(sql, params);
    return rows[0].total;
  }

  async getAll() {
    const rows = await query('SELECT hospital_id, hospital_name FROM hospitals ORDER BY hospital_name ASC') as any[];
    return rows;
  }
}
