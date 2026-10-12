import { INotification } from "./notification.interface.js";
import { NotificationRepository } from "./notification.repository.js";

export class NotificationService {

  private notificationRepository =
    new NotificationRepository();

  async createNotification(
    data: INotification
  ): Promise<{ notification_id: number }> {

    return await this.notificationRepository
      .createNotification(data);

  }

  async getNotifications(
    receiverId: number
  ): Promise<INotification[]> {

    return await this.notificationRepository
      .getINotifications(receiverId);

  }

  async getUnreadNotifications(
    receiverId: number
  ): Promise<INotification[]> {

    return await this.notificationRepository
      .getUnreadINotifications(receiverId);

  }

  async getUnreadCount(
    receiverId: number
  ): Promise<number> {

    return await this.notificationRepository
      .getUnreadCount(receiverId);

  }

  async markAsRead(
    notificationId: number
  ): Promise<void> {

    await this.notificationRepository
      .markAsRead(notificationId);

  }

  async markAllAsRead(
    receiverId: number
  ): Promise<void> {

    await this.notificationRepository
      .markAllAsRead(receiverId);

  }

}