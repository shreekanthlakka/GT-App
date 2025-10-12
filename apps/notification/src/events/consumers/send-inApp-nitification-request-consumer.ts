// ========================================
// FILE: apps/notification/src/events/consumers/inAppNotificationConsumer.ts
// CREATE THIS NEW FILE
// ========================================

import { KafkaConsumer } from "@repo/common-backend/kafka";
import { SendInAppNotificationRequestEvent } from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { logger, LogCategory } from "@repo/common-backend/logger";
import { NotificationService } from "../../services/notificationServices";

export class SendInAppNotificationRequestConsumer extends KafkaConsumer<SendInAppNotificationRequestEvent> {
    subject = Subjects.SendInAppNotificationRequested as const;
    queueGroupName = "notification-service-inapp-requests";

    async onMessage(
        data: SendInAppNotificationRequestEvent["data"]
    ): Promise<void> {
        logger.info(
            "Processing in-app notification request",
            LogCategory.NOTIFICATION,
            {
                eventId: data.eventId,
                recipientId: data.recipientId,
                title: data.notification.title,
            }
        );

        try {
            const notificationService = new NotificationService();
            const result =
                await notificationService.sendInAppNotification(data);

            if (result.success) {
                logger.info(
                    "In-app notification created successfully",
                    LogCategory.NOTIFICATION,
                    {
                        eventId: data.eventId,
                        notificationId: result.notificationId,
                        recipientId: data.recipientId,
                    }
                );
            } else {
                logger.error(
                    "Failed to create in-app notification",
                    undefined,
                    LogCategory.NOTIFICATION,
                    {
                        eventId: data.eventId,
                        recipientId: data.recipientId,
                        error: result.errorMessage,
                    }
                );
            }
        } catch (error: any) {
            logger.error(
                "Error processing in-app notification request",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    eventId: data.eventId,
                    recipientId: data.recipientId,
                    error: error.message,
                }
            );
        }
    }
}
