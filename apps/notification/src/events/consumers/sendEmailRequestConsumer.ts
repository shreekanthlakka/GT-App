import { Subjects } from "@repo/common/subjects";
import { KafkaConsumer, kafkaWrapper } from "@repo/common-backend/kafka";
import {
    KafkaMessage,
    SendEmailRequestEvent,
} from "@repo/common-backend/interfaces";
import { NotificationService } from "../../services/notificationServices";
import { LogCategory, logger } from "@repo/common-backend/logger";
import { EmailSentPublisher } from "../publisher/email-sent-publisher";

export class SendEmailRequestConsumer extends KafkaConsumer<SendEmailRequestEvent> {
    subject = Subjects.SendEmailRequested as const;
    queueGroupName = "notification-email-service";

    private notificationService = new NotificationService();

    async onMessage(
        data: SendEmailRequestEvent["data"],
        message: KafkaMessage<SendEmailRequestEvent>
    ): Promise<void> {
        try {
            logger.info(
                "Processing send email request",
                LogCategory.NOTIFICATION,
                {
                    eventId: data.eventId,
                    recipient: data.recipient.email,
                    subject: data.email.subject,
                    templateName: data.email.templateName,
                    sourceService: data.metadata.sourceService,
                }
            );

            // Send the email using your notification service
            const result = await this.notificationService.sendEmail(data);

            if (result.success) {
                // Publish success event
                const emailSentPublisher = new EmailSentPublisher(
                    kafkaWrapper.producer
                );
                await emailSentPublisher.publish({
                    eventId: generateEventId(),
                    originalRequestId: data.eventId,
                    recipientType: data.recipientType,
                    recipientId: data.recipientId,
                    recipient: data.recipient,
                    email: {
                        subject: data.email.subject,
                        templateName: data.email.templateName,
                    },
                    result: {
                        success: true,
                        messageId: result.messageId!,
                        externalId: result.externalId,
                        sentAt: new Date().toISOString(),
                        cost: result.cost,
                    },
                    metadata: data.metadata,
                    userId: data.userId,
                    timestamp: new Date().toISOString(),
                });

                logger.info(
                    "Email sent successfully",
                    LogCategory.NOTIFICATION,
                    {
                        eventId: data.eventId,
                        recipient: data.recipient.email,
                        messageId: result.messageId,
                    }
                );
            } else {
                throw new Error(result.errorMessage || "Email sending failed");
            }
        } catch (error) {
            // Publish failure event
            const emailFailedPublisher = new EmailFailedPublisher(
                kafkaWrapper.producer
            );
            await emailFailedPublisher.publish({
                eventId: generateEventId(),
                originalRequestId: data.eventId,
                recipientType: data.recipientType,
                recipientId: data.recipientId,
                recipient: data.recipient,
                email: {
                    subject: data.email.subject,
                    templateName: data.email.templateName,
                },
                error: {
                    code: "EMAIL_SEND_FAILED",
                    message:
                        error instanceof Error ? error.message : String(error),
                    retryable: this.isRetryableError(error),
                },
                metadata: data.metadata,
                userId: data.userId,
                timestamp: new Date().toISOString(),
            });

            logger.error(
                "Error sending email",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    eventId: data.eventId,
                    recipient: data.recipient.email,
                }
            );

            throw error;
        }
    }

    private isRetryableError(error: any): boolean {
        // Determine if error is retryable based on error type/message
        const retryableCodes = ["RATE_LIMIT", "TIMEOUT", "NETWORK_ERROR"];
        return retryableCodes.some(
            (code) => error?.code === code || error?.message?.includes(code)
        );
    }
}
