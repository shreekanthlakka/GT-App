// ========================================
// FILE: packages/common-backend/src/events/publishers/notificationPublishers.ts
// ADD THIS CLASS TO YOUR EXISTING FILE (where SendEmailRequestPublisher exists)
// ========================================

import { KafkaPublisher } from "@repo/common-backend/kafka";
import { SendInAppNotificationRequestEvent } from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { TopicNames } from "@repo/common/topics";

/**
 * Publisher for in-app notification requests
 * Use this from any service to send in-app notifications
 */
export class SendInAppNotificationRequestPublisher extends KafkaPublisher<SendInAppNotificationRequestEvent> {
    subject = Subjects.SendInAppNotificationRequested as const;
    topic = TopicNames.NOTIFICATION_INAPP_REQUESTS;

    protected generateMessageKey(
        data: SendInAppNotificationRequestEvent["data"]
    ): string {
        return `${data.recipientId}_inapp_${Date.now()}`;
    }
}
