// ========================================
// FIXED WHATSAPP CONSUMER
// ========================================

// services/notification/src/consumers/send-whatsapp-request-consumer.ts
import { KafkaConsumer } from "@repo/common-backend/kafka";
import {
    KafkaMessage,
    SendWhatsAppRequestEvent,
} from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { LogCategory, logger } from "@repo/common-backend/logger";
import { NotificationService } from "../../services/notificationServices";
import {
    WhatsappFailedPublisher,
    WhatsappSentPublisher,
} from "../publisher/whatsapp-sent-publisher";
import { kafkaWrapper } from "@repo/common-backend/kafka"; // Add this import
import { generateEventId } from "@repo/common-backend/utils"; // Add this import

// Define the result type that NotificationService.sendWhatsApp should return
interface WhatsAppResult {
    success: boolean;
    messageId?: string;
    externalId?: string;
    actualContent?: string;
    cost?: number;
    provider?: string;
    conversationId?: string;
    conversationType?: "BUSINESS_INITIATED" | "USER_INITIATED";
    errorMessage?: string;
    errorCode?: string;
    providerError?: string;
    templateStatus?: "PENDING" | "REJECTED" | "DISABLED";
}

export class SendWhatsAppRequestConsumer extends KafkaConsumer<SendWhatsAppRequestEvent> {
    subject = Subjects.SendWhatsAppRequested as const;
    topicName = "notification.whatsapp.requests";
    queueGroupName = "notification-whatsapp-service";

    private notificationService = new NotificationService();

    async onMessage(
        data: SendWhatsAppRequestEvent["data"],
        message: KafkaMessage<SendWhatsAppRequestEvent>
    ): Promise<void> {
        try {
            logger.info(
                "Processing send WhatsApp request",
                LogCategory.NOTIFICATION,
                {
                    eventId: data.eventId,
                    recipient: data.recipient.phone,
                    messageType: data.message.type,
                    templateName: data.message.templateName,
                    sourceService: data.metadata.sourceService,
                }
            );

            // Type the result properly
            const result: WhatsAppResult =
                await this.notificationService.sendWhatsApp(data);

            if (result.success) {
                // Publish success event
                const whatsappSentPublisher = new WhatsappSentPublisher(
                    kafkaWrapper.producer
                );
                await whatsappSentPublisher.publish({
                    eventId: generateEventId(),
                    originalRequestId: data.eventId,
                    recipientType: data.recipientType,
                    recipientId: data.recipientId,
                    recipient: data.recipient,
                    message: {
                        type: data.message.type,
                        content: data.message.content,
                        templateName: data.message.templateName,
                        actualContent: result.actualContent,
                        mediaUrl: data.message.mediaUrl,
                        mediaType: data.message.mediaType,
                    },
                    result: {
                        success: true,
                        messageId: result.messageId!,
                        externalId: result.externalId,
                        sentAt: new Date().toISOString(),
                        cost: result.cost,
                        provider: result.provider || "unknown",
                        conversationId: result.conversationId,
                        conversationType: result.conversationType,
                    },
                    metadata: data.metadata,
                    userId: data.userId,
                    timestamp: new Date().toISOString(),
                });

                logger.info(
                    "WhatsApp message sent successfully",
                    LogCategory.NOTIFICATION,
                    {
                        eventId: data.eventId,
                        recipient: data.recipient.phone,
                        messageId: result.messageId,
                        messageType: data.message.type,
                    }
                );
            } else {
                throw new Error(
                    result.errorMessage || "WhatsApp sending failed"
                );
            }
        } catch (error) {
            // Publish failure event
            const whatsappFailedPublisher = new WhatsappFailedPublisher(
                kafkaWrapper.producer
            );
            await whatsappFailedPublisher.publish({
                eventId: generateEventId(),
                originalRequestId: data.eventId,
                recipientType: data.recipientType,
                recipientId: data.recipientId,
                recipient: data.recipient,
                message: {
                    type: data.message.type,
                    content: data.message.content,
                    templateName: data.message.templateName,
                },
                error: {
                    code: this.getErrorCode(error),
                    message:
                        error instanceof Error ? error.message : String(error),
                    retryable: this.isRetryableError(error),
                    providerError: (error as any)?.providerError,
                    templateStatus: (error as any)?.templateStatus,
                },
                metadata: data.metadata,
                userId: data.userId,
                timestamp: new Date().toISOString(),
            });

            logger.error(
                "Error sending WhatsApp message",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    eventId: data.eventId,
                    recipient: data.recipient.phone,
                    messageType: data.message.type,
                }
            );

            throw error;
        }
    }

    private getErrorCode(error: unknown): string {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            if (message.includes("invalid phone")) return "INVALID_PHONE";
            if (message.includes("template")) return "TEMPLATE_ERROR";
            if (message.includes("rate limit")) return "RATE_LIMIT";
            if (message.includes("media")) return "MEDIA_ERROR";
            if (message.includes("business account"))
                return "BUSINESS_ACCOUNT_ERROR";
        }
        return "WHATSAPP_SEND_FAILED";
    }

    private isRetryableError(error: unknown): boolean {
        const retryableCodes = [
            "RATE_LIMIT",
            "TIMEOUT",
            "NETWORK_ERROR",
            "PROVIDER_UNAVAILABLE",
        ];
        const errorCode = this.getErrorCode(error);
        return retryableCodes.includes(errorCode);
    }
}
