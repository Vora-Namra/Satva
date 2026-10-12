import { query } from "../database/connection.js";

export interface CreateAuditLog {
  performed_by_user_id?: number | null;
  action: string;
  entity_name?: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
}

export class AuditService {
  async log(data: CreateAuditLog) {
    await query(
      `
      insert into audit_logs(
        performed_by_user_id,
        action,
        entity_name,
        entity_id,
        old_value,
        new_value,
        ip_address
      )
      values (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.performed_by_user_id ?? null,
        data.action,
        data.entity_name ?? null,
        data.entity_id ?? null,
        data.old_value
          ? JSON.stringify(data.old_value)
          : null,
        data.new_value
          ? JSON.stringify(data.new_value)
          : null,
        data.ip_address ?? null,
      ],
    );
  }
}