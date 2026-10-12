import { query } from "../../database/connection.js";
import { INotification } from "./notification.interface.js";

export class NotificationRepository {

  async createNotification(
    data: INotification
  ): Promise<{ notification_id: number }> {

    const sql = `
      insert into notifications
      (
        user_id,
        notification_type,
        title,
        notification_message,
        redirect_url
      )
      values (?, ?, ?, ?, ?)
    `;

    const result: any = await query(
      sql,
      [
        data.user_id,
        data.notification_type,
        data.title,
        data.notification_message,
        data.redirect_url ?? null
      ]
    );

    return {
      notification_id: result.insertId
    };
  }

  async getINotifications(
    userId: number
  ): Promise<INotification[]> {

    const sql = `
      select *
      from notifications
      where user_id = ?
      order by created_at desc
    `;

    return await query(
      sql,
      [userId]
    ) as INotification[];
  }

  async getUnreadINotifications(
    userId: number
  ): Promise<INotification[]> {

    const sql = `
      select *
      from notifications
      where user_id = ?
      and is_read = false
      order by created_at desc
    `;

    return await query(
      sql,
      [userId]
    ) as INotification[];
  }

  async getUnreadCount(
    userId: number
  ): Promise<number> {

    const sql = `
      select count(*) as count
      from notifications
      where user_id = ?
      and is_read = false
    `;

    const rows = await query(
      sql,
      [userId]
    ) as { count: number }[];

    return rows[0]?.count ?? 0;
  }

  async markAsRead(
    notificationId: number
  ): Promise<void> {

    const sql = `
      update notifications
      set is_read = true
      where notification_id = ?
    `;

    await query(
      sql,
      [notificationId]
    );
  }

  async markAllAsRead(
    userId: number
  ): Promise<void> {

    const sql = `
      update notifications
      set is_read = true
      where user_id = ?
      and is_read = false
    `;

    await query(
      sql,
      [userId]
    );
  }

}