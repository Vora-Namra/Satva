import { Request, Response } from "express";
import { catchAsync } from "../../common/helpers/catch-async.js";
import { generalResponse } from "../../common/helpers/general-response.js";
import { NotificationService } from "./notification.services.js";
import { AuthUser } from "../../types/express.js";
import { AuthRequest } from "../../common/middlewares/auth.middleware.js";

export class NotificationController {

    private notificationService =
        new NotificationService();

    getNotifications = catchAsync(
        async (req: Request, res: Response) => {

            const user_id: number = (req as AuthRequest).user.id;

            const notifications =
                await this.notificationService
                    .getNotifications(user_id);

            generalResponse({
                res,
                data: notifications,
                message: "Notifications fetched successfully"
            });

        }
    );

    getUnreadNotifications = catchAsync(
        async (req: Request, res: Response) => {

            const user_id:number=(req as AuthRequest).user.id;

            const notifications =
                await this.notificationService
                    .getUnreadNotifications(user_id);

            generalResponse({
                res,
                data: notifications,
                message: "Unread notifications fetched successfully"
            });

        }
    );

    getUnreadCount = catchAsync(
        async (req: Request, res: Response) => {

            const user_id:number=(req as AuthRequest).user.id;

            const count =
                await this.notificationService
                    .getUnreadCount(user_id);

            generalResponse({
                res,
                data: { count },
                message: "Unread notification count fetched successfully"
            });

        }
    );

    markAsRead = catchAsync(
        async (req: Request, res: Response) => {

            const notificationId = Number(req.params.notificationId);

            await this.notificationService
                .markAsRead(notificationId);

            generalResponse({
                res,
                message: "Notification marked as read successfully"
            });

        }
    );

    markAllAsRead = catchAsync(
        async (req: Request, res: Response) => {

            const user_id:number=(req as AuthRequest).user.id;

            await this.notificationService
                .markAllAsRead(user_id);

            generalResponse({
                res,
                message: "All notifications marked as read successfully"
            });

        }
    );

}