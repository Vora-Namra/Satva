 export interface AuditPayload {
  performed_by_user_id: number | null;
  action: string;              // e.g. 'CREATE_DOCTOR', 'UPDATE_APPOINTMENT'
  entity_name: string;         // e.g. 'doctors', 'appointments'
  entity_id: string;           // e.g. '42'
  ip_address?: string;
}