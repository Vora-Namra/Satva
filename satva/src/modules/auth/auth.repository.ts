import { NotFoundException } from "../../common/helpers/http-exception.js";
import { query } from "../../database/connection.js";
import { UserSession } from "./interfaces/auth.interface.js";

export class UserRepository {
  async findUserByEmail(email: string) {
    const rows: any = await query(
      `
        select *
        from users
        where email = ?
        `,
      [email],
    );

    if (!rows.length) return null;
    return rows[0];
  }

  async createUser(email: string, passwordHash: string, role: string) {
    const result: any = await query(
      `
        insert into users(
            email,
            password_hash,
            role
        )
        values(
            ?,
            ?,
            ?
        )
        `,
      [email, passwordHash, role],
    );

    const userId = result.insertId;

    const rows: any = await query(
      `
        select *
        from users
        where user_id = ?
        `,
      [userId],
    );

    return rows[0];
  }

  async findUserById(user_id: number) {
    const result: any = await query("select * from users where user_id=?", [
      user_id,
    ]);

    return result[0];
  }

  async createGoogleUser(
    email: string,
    passwordHash: string,
    google_sub: string,
    firstName: string = '',
    lastName: string = ''
  ) {
    const result: any = await query(
      `insert into users(email,password_hash,role,google_sub) values(?,?,'PATIENT',?)`,
      [email, passwordHash, google_sub],
    );

    const userId = result.insertId;

    // Create a base patient record to avoid "Patient not found" errors
    await query(
      `insert into patients (user_id, first_name, last_name, country_code, mobile, dob, gender) values (?, ?, ?, '', '', '2000-01-01', 'MALE')`,
      [userId, firstName, lastName]
    );

    const rows: any = await query(`select * from users where user_id=?`, [
      userId,
    ]);

    return rows[0];
  }

  async ensurePatientExists(userId: number, firstName: string, lastName: string) {
    const existing: any = await query(`select patient_id from patients where user_id = ?`, [userId]);
    if (!existing.length) {
      await query(
        `insert into patients (user_id, first_name, last_name, country_code, mobile, dob, gender) values (?, ?, ?, '', '', '2000-01-01', 'MALE')`,
        [userId, firstName, lastName]
      );
    }
  }

  async createPatient(
    userId: number,
    first_name: string,
    last_name: string,
    country_code: string,
    mobile: string,
    dob: string,
    gender: string,
  ) {
    console.log(userId, first_name, last_name, country_code, mobile, dob, gender);
   
    const result: any = await query(
      `
        insert into patients(
            user_id,
            first_name,
            last_name,
            country_code,
            mobile,
            dob,
            gender
        )
        values(
            ?, ?, ?, ?, ?, ?, ?
        )
        `,
      [userId, first_name, last_name, country_code, mobile, dob, gender],
    );

    return result;
  }

  async updateLastLogin(userId: number): Promise<void> {
    await query(
      `
        update users
        set last_login_at = utc_timestamp(),
        updated_at = utc_timestamp()
        where user_id = ?
        `,
      [userId],
    );
  }


async createDoctor(data: any) {
  const result:any = await query(
    `INSERT INTO doctors 
      (user_id, hospital_id, first_name, last_name, gender, experience_years, consultation_fee, bio)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.user_id, data.hospital_id, data.first_name, data.last_name,
      data.gender,  data.experience_years, data.consultation_fee, data.bio
    ]
  );

    const insertId = result[0]?.insertId ?? result.insertId;
  // fetch and return the created doctor so doctor_id is available
  const rows:any = await query(
    `SELECT * FROM doctors WHERE doctor_id = ?`,
    [insertId]
  );

  return rows[0]; // { doctor_id, user_id, hospital_id, ... }
}

  async createAdmin(data: any) {
    const result: any = await query(
      `
        insert into admins (
            user_id,
            hospital_id,
            first_name,
            last_name,
            created_at,
            updated_at
        )
        values (?, ?, ?, ?, current_timestamp, current_timestamp)
        `,
      [data.user_id, data.hospital_id, data.first_name, data.last_name],
    );

    return result;
  }

  async updatePassword(password: string, user_id: number) {
    const sql = `
        update users
        set password_hash = ?
        where user_id = ?
    `;

    return await query(sql, [password, user_id]);
  }

  async deleteOldOtp(email: string) {
    let user: any = await this.findUserByEmail(email);

    if (!user) return false;
    const sql = `
            delete from otp_verifications
            where user_id = ?
        `;

    return await query(sql, [user.user_id]);
  }

  async saveOtp(otp: string, email: string) {
    let user: any = await this.findUserByEmail(email);

    if (!user) return false;
    const sql = `
            insert into otp_verifications
            (
               
                user_id,
                 otp_code,
                 purpose,
                expires_at,
                created_at
            )
            values
            (
                ?,
                ?,
                 'PASSWORD_RESET' ,
                now() + interval 2 minute,
                now()
            )
        `;

    return await query(sql, [user.user_id, otp]);
  }

  async findOtp(email: string, otp: string) {
    const user: any = await this.findUserByEmail(email);

    if (!user) return null;

    const sql = `
      select *
      from otp_verifications
      where user_id = ?
      and otp_code = ?
      and expires_at > now()
  `;

    const rows: any = await query(sql, [user.user_id, otp]);

    return rows[0] || null;
  }

  async canGetOtp(email: string) {
    let user: any = await this.findUserByEmail(email);


    const sql = `
            select *
            from otp_verifications
            where
                user_id = ?
                and expires_at > now()
        `;

    const rows: any = await query(sql, [user.user_id]);

    return rows.length === 0;
  }

  async getLatestOtp(email: string) {
    const user = await this.findUserByEmail(email);
    if (!user) throw new NotFoundException("User not found");

    const sql = `
    select otp_code
    from otp_verifications
    where user_id = ?
      and expires_at > now()
      and purpose = 'password_reset'
    order by created_at desc
    limit 1
  `;

    const rows: any = await query(sql, [user.user_id]);
    if (!rows.length) return null;

    return rows[0].otp_code;
  }

  async deleteOtp(user_id: number) {
    const sql = `
      delete from otp_verifications
      where user_id = ?
   `;

    return query(sql, [user_id]);
  }

  async createSession(
    userId: number,
    refreshToken: string,
    deviceInfo: string,
    ipAddress: string,
    auth_provider: string,
  ) {
    // Delete existing sessions for the user
    await query(
      `delete from user_sessions where user_id = ?`,
      [userId]
    );

    // Insert the new session
    const sql = `
    insert into user_sessions
    (
      user_id,
      refresh_token,
      expires_at,
      device_info,
      ip_address,
      auth_provider
    )
    values (?, ?, date_add(utc_timestamp(), interval 15 day), ?, ?, ?)
  `;

    await query(sql, [
      userId,
      refreshToken,
      deviceInfo,
      ipAddress,
      auth_provider,
    ]);
  }

  async findSessionByRefreshToken(
    refreshToken: string,
  ): Promise<UserSession | null> {
    const sql = `
    select *
    from user_sessions
    where refresh_token = ?
      and expires_at > utc_timestamp()
    limit 1
  `;

    const sessions: any = await query(sql, [refreshToken]);

    return sessions.length > 0 ? sessions[0] : null;
  }

  async logout(userId: number) {
    return query(`delete from user_sessions where user_id = ?`, [userId]);
  }


async createStaff(data: any) {
  const result:any = await query(
    `INSERT INTO staff 
      (user_id, hospital_id, first_name, last_name, gender, staff_role,contact_number,dob,address_line1,address_line2)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?)`,
    [
      data.user_id, data.hospital_id, data.first_name, data.last_name,
      data.gender,  data.staff_role, data.contact_number, data.dob,data.address_line1,data.address_line2 ?? ''
    ]
  );

    const insertId = result[0]?.insertId ?? result.insertId;
  // fetch and return the created doctor so doctor_id is available
  const rows:any = await query(
    `SELECT * FROM staff WHERE staff_id = ?`,
    [insertId]
  );

  return rows[0]; // { staff_id, user_id, hospital_id, ... }
}



}
