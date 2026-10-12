export interface TelemedicineSession {
  session_id: number;
  appointment_id: number;
  meeting_link: string | null;
  status:
    | "SCHEDULED"
    | "STARTED"
    | "COMPLETED"
    | "CANCELLED";
  started_at: Date | null;
  ended_at: Date | null;
  created_at: Date;
  updated_at: Date;
}


export interface CreateTelemedicineSession {
  appointment_id: number;
  meeting_link?: string;
  start_time:string;
  end_time:string;
}


export interface UpdateTelemedicineSessionStatus {
  status:
    | "SCHEDULED"
    | "STARTED"
    | "COMPLETED"
    | "CANCELLED";
}

export interface StartTelemedicineSession {
  started_at: Date;
}

export interface EndTelemedicineSession {
  ended_at: Date;
}


export interface UpdateTelemedicineMeetingLink {
  meeting_link: string;
}

export interface ZoomResponse{
  id : number,
  join_url? : string,
  start_url? : string,
}