import {
    KafkaMessage,
    SendSMSRequestEvent,
} from "@repo/common-backend/interfaces";
import { KafkaConsumer, kafkaWrapper } from "@repo/common-backend/kafka";
import { Subjects } from "@repo/common/subjects";
import { NotificationService } from "../../services/notificationServices";
import { LogCategory, logger } from "@repo/common-backend/logger";
import { generateEventId } from "@repo/common-backend/utils";
import {
    SMSFailedPublisher,
    SMSSentPublisher,
} from "../publisher/sms-sent-publisher";
import { TopicNames } from "@repo/common/topics";

interface SMSResult {
    success: boolean;
    messageId?: string;
    externalId?: string;
    actualContent?: string;
    messageLength?: number;
    segmentCount?: number;
    cost?: number;
    provider?: string;
    statusUrl?: string;
    errorMessage?: string;
    errorCode?: string;
    providerError?: string;
}

// export class SendSMSRequestConsumer extends KafkaConsumer<SendSMSRequestEvent> {
//     subject = Subjects.SendSMSRequested as const;
//     queueGroupName = "notification-sms-service";

//     private notificationService = new NotificationService();

//     async onMessage(
//         data: SendSMSRequestEvent["data"],
//         message: KafkaMessage<SendSMSRequestEvent>
//     ): Promise<void> {
//         try {
//             logger.info(
//                 "Processing send SMS request",
//                 LogCategory.NOTIFICATION,
//                 {
//                     eventId: data.eventId,
//                     recipient: data.recipient.phone,
//                     templateName: data.message.templateName,
//                     sourceService: data.metadata.sourceService,
//                 }
//             );

//             const result = await this.notificationService.sendSMS(data);

//             if (result.success) {
//                 const smsSuccessPublisher = new SMSSentPublisher(
//                     kafkaWrapper.producer
//                 );
//                 await smsSuccessPublisher.publish({
//                     eventId: generateEventId(),
//                     originalRequestId: data.eventId,
//                     recipientType: data.recipientType,
//                     recipientId: data.recipientId,
//                     recipient: data.recipient,
//                     message: data.message,
//                     result: {
//                         success: true,
//                         messageId: result.messageId!,
//                         sentAt: new Date().toISOString(),
//                         cost: result.cost,
//                     },
//                     metadata: data.metadata,
//                     userId: data.userId,
//                     timestamp: new Date().toISOString(),
//                 });
//             } else {
//                 throw new Error(result.errorMessage || "SMS sending failed");
//             }
//         } catch (error) {
//             const smsFailedPublisher = new SMSFailedPublisher(
//                 kafkaWrapper.producer
//             );
//             await smsFailedPublisher.publish({
//                 eventId: generateEventId(),
//                 originalRequestId: data.eventId,
//                 recipientType: data.recipientType,
//                 recipientId: data.recipientId,
//                 recipient: data.recipient,
//                 message: data.message,
//                 error: {
//                     code: "SMS_SEND_FAILED",
//                     message:
//                         error instanceof Error ? error.message : String(error),
//                     retryable: this.isRetryableError(error),
//                 },
//                 metadata: data.metadata,
//                 userId: data.userId,
//                 timestamp: new Date().toISOString(),
//             });

//             throw error;
//         }
//     }

//     private isRetryableError(error: any): boolean {
//         const retryableCodes = ["RATE_LIMIT", "TIMEOUT", "NETWORK_ERROR"];
//         return retryableCodes.some(
//             (code) => error?.code === code || error?.message?.includes(code)
//         );
//     }
// }

export class SendSMSRequestConsumer extends KafkaConsumer<SendSMSRequestEvent> {
    subject = Subjects.SendSMSRequested as const;
    topicName = TopicNames.NOTIFICATION_SMS_REQUESTS;
    queueGroupName = "notification-sms-service";

    private notificationService = new NotificationService();

    async onMessage(
        data: SendSMSRequestEvent["data"],
        message: KafkaMessage<SendSMSRequestEvent>
    ): Promise<void> {
        try {
            logger.info(
                "Processing send SMS request",
                LogCategory.NOTIFICATION,
                {
                    eventId: data.eventId,
                    recipient: data.recipient.phone,
                    templateName: data.message.templateName,
                    sourceService: data.metadata.sourceService,
                    messageType: data.metadata.category,
                }
            );

            const result: SMSResult =
                await this.notificationService.sendSMS(data);

            if (result.success) {
                // Publish success event
                const smsSentPublisher = new SMSSentPublisher(
                    kafkaWrapper.producer
                );
                await smsSentPublisher.publish({
                    eventId: generateEventId(),
                    originalRequestId: data.eventId,
                    recipientType: data.recipientType,
                    recipientId: data.recipientId,
                    recipient: data.recipient,
                    message: {
                        content: data.message.content,
                        templateName: data.message.templateName,
                        actualContent: result.actualContent!,
                        messageLength: result.messageLength!,
                        segmentCount: result.segmentCount!,
                    },
                    result: {
                        success: true,
                        messageId: result.messageId!,
                        externalId: result.externalId,
                        sentAt: new Date().toISOString(),
                        cost: result.cost,
                        provider: result.provider!,
                        statusUrl: result.statusUrl,
                    },
                    metadata: data.metadata,
                    userId: data.userId,
                    timestamp: new Date().toISOString(),
                });

                logger.info("SMS sent successfully", LogCategory.NOTIFICATION, {
                    eventId: data.eventId,
                    recipient: data.recipient.phone,
                    messageId: result.messageId,
                    segments: result.segmentCount,
                });
            } else {
                throw new Error(result.errorMessage || "SMS sending failed");
            }
        } catch (error) {
            // Publish failure event
            const smsFailedPublisher = new SMSFailedPublisher(
                kafkaWrapper.producer
            );
            await smsFailedPublisher.publish({
                eventId: generateEventId(),
                originalRequestId: data.eventId,
                recipientType: data.recipientType,
                recipientId: data.recipientId,
                recipient: data.recipient,
                message: {
                    content: data.message.content,
                    templateName: data.message.templateName,
                },
                error: {
                    code: this.getErrorCode(error),
                    message:
                        error instanceof Error ? error.message : String(error),
                    retryable: this.isRetryableError(error),
                    providerError: (error as any)?.providerError,
                },
                metadata: data.metadata,
                userId: data.userId,
                timestamp: new Date().toISOString(),
            });

            logger.error(
                "Error sending SMS",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    eventId: data.eventId,
                    recipient: data.recipient.phone,
                }
            );

            throw error;
        }
    }

    private getErrorCode(error: any): string {
        // Map specific errors to codes
        const message = error?.message?.toLowerCase() || "";
        if (message.includes("invalid phone")) return "INVALID_PHONE";
        if (message.includes("rate limit")) return "RATE_LIMIT";
        if (message.includes("insufficient balance"))
            return "INSUFFICIENT_BALANCE";
        if (message.includes("blocked")) return "PHONE_BLOCKED";
        return "SMS_SEND_FAILED";
    }

    private isRetryableError(error: any): boolean {
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
