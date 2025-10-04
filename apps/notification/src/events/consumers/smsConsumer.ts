import { Subjects } from "@repo/common/subjects";
import { KafkaMessage, SendSMSEvent } from "@repo/common-backend/interfaces";
import { KafkaConsumer } from "@repo/common-backend/kafka";
import { LogCategory, logger } from "@repo/common-backend/logger";
import { NotificationService } from "../../services/notificationServices";

export class SendSMSConsumer extends KafkaConsumer<SendSMSEvent> {
    subject = Subjects.SMSMessageSent as const;
    queueGroupName = "notification-sms-service";

    private notificationService = new NotificationService();

    async onMessage(
        data: SendSMSEvent["data"],
        message: KafkaMessage<SendSMSEvent>
    ): Promise<void> {
        try {
            logger.info("Processing send SMS event", LogCategory.NOTIFICATION, {
                eventId: data.eventId,
                recipient: data.recipient.phone,
                templateName: data.message.templateName,
                sourceService: data.metadata.sourceService,
            });

            await this.notificationService.sendSMS(data);

            logger.info("SMS sent successfully", LogCategory.NOTIFICATION, {
                eventId: data.eventId,
                recipient: data.recipient.phone,
                messageId: message.eventId,
            });
        } catch (error) {
            logger.error(
                "Error sending SMS",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    eventId: data.eventId,
                    recipient: data.recipient.phone,
                    messageId: message.eventId,
                }
            );
            throw error;
        }
    }
}
