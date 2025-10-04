import { Subjects } from "@repo/common/subjects";
import { KafkaConsumer, kafkaWrapper } from "@repo/common-backend/kafka";
import {
    KafkaMessage,
    SendEmailRequestEvent,
} from "@repo/common-backend/interfaces";
import { NotificationService } from "../../services/notificationServices";
import { LogCategory, logger } from "@repo/common-backend/logger";
import { TopicNames } from "@repo/common/topics";
import { generateEventId } from "@repo/common-backend/utils";
import {
    EmailFailedPublisher,
    EmailSentPublisher,
} from "../publisher/email-sent-publisher";

// interface EmailResult {
//     success: boolean;
//     messageId?: string;
//     externalId?: string;
//     cost?: number;
//     errorMessage?: string;
//     errorCode?: string;
//     deliveredAt?: Date;
// }

// export class SendEmailRequestConsumer extends KafkaConsumer<SendEmailRequestEvent> {
//     subject = Subjects.SendEmailRequested as const;
//     queueGroupName = TopicNames.NOTIFICATION_EMAIL_REQUESTS;

//     private notificationService = new NotificationService();

//     async onMessage(
//         data: SendEmailRequestEvent["data"],
//         message: KafkaMessage<SendEmailRequestEvent>
//     ): Promise<void> {
//         try {
//             logger.info(
//                 "Processing send email event",
//                 LogCategory.NOTIFICATION,
//                 {
//                     eventId: data.eventId,
//                     recipient: data.recipient.email,
//                     subject: data.email.subject,
//                     templateName: data.email.templateName,
//                     sourceService: data.metadata.sourceService,
//                 }
//             );

//             const result: EmailResult =
//                 await this.notificationService.sendEmail(data);

//             /**
//              *
//              * publish the emailSent event
//              */
//             if (result.success) {
//                 // Publish success event
//                 const emailSentPublisher = new EmailSentPublisher(
//                     kafkaWrapper.producer
//                 );
//                 await emailSentPublisher.publish({
//                     eventId: generateEventId(),
//                     originalRequestId: data.eventId,
//                     recipientType: data.recipientType,
//                     recipientId: data.recipientId,
//                     recipient: data.recipient,
//                     email: {
//                         subject: data.email.subject,
//                         templateName: data.email.templateName,
//                     },
//                     result: {
//                         success: true,
//                         messageId: result.messageId!,
//                         externalId: result.externalId,
//                         sentAt: new Date().toISOString(),
//                         cost: result.cost,
//                     },
//                     metadata: data.metadata,
//                     userId: data.userId,
//                     timestamp: new Date().toISOString(),
//                 });

//                 logger.info(
//                     "Email sent successfully",
//                     LogCategory.NOTIFICATION,
//                     {
//                         eventId: data.eventId,
//                         recipient: data.recipient.email,
//                         messageId: result.messageId,
//                     }
//                 );
//             } else {
//                 throw new Error(result.errorMessage || "Email sending failed");
//             }
//         } catch (error) {
//             const emailFailedPublisher = new EmailFailedPublisher(
//                 kafkaWrapper.producer
//             );
//             await emailFailedPublisher.publish({
//                 eventId: generateEventId(),
//                 originalRequestId: data.eventId,
//                 recipientType: data.recipientType,
//                 recipientId: data.recipientId,
//                 recipient: data.recipient,
//                 email: {
//                     subject: data.email.subject,
//                     templateName: data.email.templateName,
//                 },
//                 error: {
//                     code: "EMAIL_SEND_FAILED",
//                     message:
//                         error instanceof Error ? error.message : String(error),
//                     retryable: this.isRetryableError(error),
//                 },
//                 metadata: data.metadata,
//                 userId: data.userId,
//                 timestamp: new Date().toISOString(),
//             });

//             logger.error(
//                 "Error sending email",
//                 undefined,
//                 LogCategory.NOTIFICATION,
//                 {
//                     error:
//                         error instanceof Error ? error.message : String(error),
//                     eventId: data.eventId,
//                     recipient: data.recipient.email,
//                     messageId: message.eventId,
//                 }
//             );
//             throw error;
//         }
//     }
// }

interface EmailResult {
    success: boolean;
    messageId?: string;
    externalId?: string;
    cost?: number;
    errorMessage?: string;
    errorCode?: string;
    deliveredAt?: Date;
}

export class SendEmailRequestConsumer extends KafkaConsumer<SendEmailRequestEvent> {
    subject = Subjects.SendEmailRequested as const;
    topicName = TopicNames.NOTIFICATION_EMAIL_REQUESTS;
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

            // Type the result properly
            const result: EmailResult =
                await this.notificationService.sendEmail(data);

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
                        deliveredAt: result.deliveredAt?.toISOString(),
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
                    code: this.getErrorCode(error),
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

    private getErrorCode(error: unknown): string {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            if (message.includes("invalid email")) return "INVALID_EMAIL";
            if (message.includes("rate limit")) return "RATE_LIMIT";
            if (message.includes("bounce")) return "EMAIL_BOUNCED";
            if (message.includes("spam")) return "SPAM_DETECTED";
        }
        return "EMAIL_SEND_FAILED";
    }

    private isRetryableError(error: unknown): boolean {
        const retryableCodes = ["RATE_LIMIT", "TIMEOUT", "NETWORK_ERROR"];
        const errorCode = this.getErrorCode(error);
        return retryableCodes.includes(errorCode);
    }
}
