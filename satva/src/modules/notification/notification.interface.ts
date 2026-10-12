export enum NotificationStatus {
    READ = "READ",
    UNREAD = "UNREAD"
}


export interface INotification {
    notification_id?: number;

    user_id: number;

    notification_type: NotificationType;

    title: string;

    notification_message: string;

    redirect_url?: string;

    is_read?: boolean;

    created_at?: Date;

    updated_at?: Date;
}

export enum NotificationType {
    APPOINTMENT_BOOKED = "APPOINTMENT_BOOKED",
    APPOINTMENT_CANCELLED = "APPOINTMENT_CANCELLED",
    APPOINTMENT_RESCHEDULED = "APPOINTMENT_RESCHEDULED",

    TELEMEDICINE_CREATED = "TELEMEDICINE_CREATED",

    MEDICAL_RECORD_AVAILABLE = "MEDICAL_RECORD_AVAILABLE",

    PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
    PAYMENT_FAILED = "PAYMENT_FAILED",

    NEW_DOCTOR_REGISTERED = "NEW_DOCTOR_REGISTERED",

    SYSTEM_NOTIFICATION = "SYSTEM_NOTIFICATION",

    PROFILE_UPDATED = "PROFILE_UPDATED_SUCCESSFULLY"
 }