import { Router } from "express";
import { Routes } from "../../common/interfaces/routes.interfaces.js";
import { NotificationController } from "./notification.controller.js";
import { patientAuth, authenticate } from "../../common/middlewares/auth.middleware.js";

export class NotificationRouter implements Routes {

    path: string = "/notifications";

    router = Router();

    private notificationController =
        new NotificationController();

    constructor() {
        this.init();
    }

    private init(): void {

        this.router.get(
            "/",authenticate,
            this.notificationController.getNotifications
        );

        this.router.get(
            "/unread",authenticate,
            this.notificationController.getUnreadNotifications
        );

        this.router.get(
            "/unread/count",authenticate,
            this.notificationController.getUnreadCount
        );

        this.router.patch(
            "/:notificationId/read",authenticate,
            this.notificationController.markAsRead
        );

        this.router.patch(
            "/read-all",authenticate,
            this.notificationController.markAllAsRead
        );
    }
}