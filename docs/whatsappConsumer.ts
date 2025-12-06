import { Subjects } from "@repo/common/subjects";
import { KafkaConsumer } from "@repo/common-backend/kafka";
import {
    KafkaMessage,
    SendWhatsAppEvent,
} from "@repo/common-backend/interfaces";
import { NotificationService } from "../apps/notification/src/services/notificationServices";
import { LogCategory, logger } from "@repo/common-backend/logger";

export class SendWhatsappConsumer extends KafkaConsumer<SendWhatsAppEvent> {
    subject = Subjects.WhatsAppMessageSent as const;
    queueGroupName = "notification-whatsapp-service";
    private notificationService = new NotificationService();

    async onMessage(
        data: SendWhatsAppEvent["data"],
        message: KafkaMessage<SendWhatsAppEvent>
    ): Promise<void> {
        try {
            logger.info(
                "Processing send WhatsApp event",
                LogCategory.NOTIFICATION,
                {
                    eventId: data.eventId,
                    recipient: data.recipient.phone,
                    messageType: data.message.type,
                    templateName: data.message.templateName,
                    sourceService: data.metadata.sourceService,
                }
            );

            await this.notificationService.sendWhatsApp(data);

            logger.info(
                "WhatsApp sent successfully",
                LogCategory.NOTIFICATION,
                {
                    eventId: data.eventId,
                    recipient: data.recipient.phone,
                    messageId: message.eventId,
                }
            );
        } catch (error) {
            logger.error(
                "Error sending WhatsApp",
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
