export interface Filters{
    date?:      string | undefined;
    doctor_id?: number | undefined;
    status?:    string | undefined;
    page:       number;
    limit:      number;
  }