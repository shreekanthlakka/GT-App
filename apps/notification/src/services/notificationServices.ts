// ========================================
// CORRECTED NOTIFICATION SERVICE
// ========================================

// notification-service/src/services/notificationService.ts
import { prisma } from "@repo/db/prisma";
import { EmailProvider } from "./providers/emailProvider";
import { SMSProvider } from "./providers/smsProvider";
import { WhatsAppProvider } from "./providers/whatsAppProvider";
import { TemplateService } from "./templateServices";
import { NotificationType } from "@repo/db/prisma";
import {
    SendEmailRequestEvent,
    SendSMSRequestEvent,
    SendWhatsAppRequestEvent,
    EmailResult,
    SMSResult,
    WhatsAppResult,
    ProviderEmailResult,
    ProviderSMSResult,
    ProviderWhatsAppResult,
    SendInAppNotificationRequestEvent,
    InAppNotificationResult,
} from "@repo/common-backend/interfaces";
import { logger, LogCategory } from "@repo/common-backend/logger";

export class NotificationService {
    private emailProvider: EmailProvider;
    private smsProvider: SMSProvider;
    private whatsappProvider: WhatsAppProvider;
    private templateService: TemplateService;

    constructor() {
        this.emailProvider = new EmailProvider();
        this.smsProvider = new SMSProvider();
        this.whatsappProvider = new WhatsAppProvider();
        this.templateService = new TemplateService();
    }

    // ========================================
    // FIXED EMAIL METHOD
    // ========================================
    async sendEmail(data: SendEmailRequestEvent["data"]): Promise<EmailResult> {
        let notification: any = null;

        try {
            // Create notification record
            notification = await this.createNotificationRecord(data, "EMAIL");

            logger.info(
                "Processing email send request",
                LogCategory.NOTIFICATION,
                {
                    notificationId: notification.id,
                    eventId: data.eventId,
                    recipient: data.recipient.email,
                    templateName: data.email.templateName,
                }
            );

            let htmlBody = data.email.htmlBody;
            let textBody = data.email.textBody;
            let subject = data.email.subject;

            // Use template if specified
            if (data.email.templateName && data.email.templateData) {
                try {
                    // htmlBody = await this.templateService.renderTemplate(
                    //     data.email.templateName,
                    //     data.email.templateData
                    // );

                    const rendered = await this.templateService.renderTemplate(
                        data.email.templateName,
                        data.email.templateData
                    );
                    htmlBody = rendered.content;
                    // Render subject if it contains variables
                    if (subject.includes("{{")) {
                        subject = await this.templateService.renderString(
                            subject,
                            data.email.templateData
                        );
                    }
                } catch (templateError) {
                    logger.error(
                        "Template rendering failed",
                        undefined,
                        LogCategory.NOTIFICATION,
                        {
                            templateName: data.email.templateName,
                            error:
                                templateError instanceof Error
                                    ? templateError.message
                                    : String(templateError),
                        }
                    );
                    throw new Error(
                        `Template rendering failed: ${templateError instanceof Error ? templateError.message : "Unknown error"}`
                    );
                }
            }

            // Send email via provider
            const providerResult: ProviderEmailResult =
                await this.emailProvider.sendEmail({
                    to: {
                        email: data.recipient.email,
                        name: data.recipient.name,
                    },
                    subject,
                    htmlBody,
                    textBody,
                    attachments: data.email.attachments,
                });

            if (providerResult.success) {
                // Update notification as sent
                await this.updateNotificationStatus(notification.id, {
                    success: true,
                    messageId: providerResult.messageId,
                    externalId: providerResult.externalId,
                    deliveredAt: providerResult.deliveredAt,
                });

                logger.info(
                    "Email sent successfully",
                    LogCategory.NOTIFICATION,
                    {
                        notificationId: notification.id,
                        messageId: providerResult.messageId,
                        recipient: data.recipient.email,
                    }
                );

                return {
                    success: true,
                    messageId: providerResult.messageId,
                    externalId: providerResult.externalId,
                    cost: providerResult.cost,
                    deliveredAt: providerResult.deliveredAt,
                };
            } else {
                throw new Error(
                    providerResult.errorMessage || "Email provider failed"
                );
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            const errorCode = this.getEmailErrorCode(error);

            // Update notification as failed
            if (notification) {
                await this.updateNotificationStatus(notification.id, {
                    success: false,
                    errorMessage,
                });
            }

            logger.error(
                "Email sending failed",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    notificationId: notification?.id,
                    eventId: data.eventId,
                    recipient: data.recipient.email,
                    error: errorMessage,
                    errorCode,
                }
            );

            return {
                success: false,
                errorMessage,
                errorCode,
            };
        }
    }

    // ========================================
    // FIXED SMS METHOD
    // ========================================
    async sendSMS(data: SendSMSRequestEvent["data"]): Promise<SMSResult> {
        let notification: any = null;

        try {
            // Create notification record
            notification = await this.createNotificationRecord(data, "SMS");

            logger.info(
                "Processing SMS send request",
                LogCategory.NOTIFICATION,
                {
                    notificationId: notification.id,
                    eventId: data.eventId,
                    recipient: data.recipient.phone,
                    templateName: data.message.templateName,
                }
            );

            let message = data.message.content;

            // Use template if specified
            if (data.message.templateName && data.message.templateData) {
                try {
                    // message = await this.templateService.renderTemplate(
                    //     data.message.templateName,
                    //     data.message.templateData
                    // );
                    const rendered = await this.templateService.renderTemplate(
                        data.message.templateName,
                        data.message.templateData
                    );
                    message = rendered.content;
                } catch (templateError) {
                    logger.error(
                        "SMS template rendering failed",
                        undefined,
                        LogCategory.NOTIFICATION,
                        {
                            templateName: data.message.templateName,
                            error:
                                templateError instanceof Error
                                    ? templateError.message
                                    : String(templateError),
                        }
                    );
                    throw new Error(
                        `SMS template rendering failed: ${templateError instanceof Error ? templateError.message : "Unknown error"}`
                    );
                }
            }

            if (!message) {
                throw new Error("SMS message content is required");
            }

            // Send SMS via provider
            const providerResult: ProviderSMSResult =
                await this.smsProvider.sendSMS({
                    to: data.recipient.phone,
                    message,
                    unicode: data.message.unicode,
                });

            if (providerResult.success) {
                // Update notification as sent
                await this.updateNotificationStatus(notification.id, {
                    success: true,
                    messageId: providerResult.messageId,
                    externalId: providerResult.externalId,
                });

                logger.info("SMS sent successfully", LogCategory.NOTIFICATION, {
                    notificationId: notification.id,
                    messageId: providerResult.messageId,
                    recipient: data.recipient.phone,
                    segments: providerResult.segmentCount,
                });

                return {
                    success: true,
                    messageId: providerResult.messageId,
                    externalId: providerResult.externalId,
                    actualContent: providerResult.actualContent || message,
                    messageLength:
                        providerResult.messageLength || message.length,
                    segmentCount:
                        providerResult.segmentCount ||
                        Math.ceil(message.length / 160),
                    cost: providerResult.cost,
                    provider: providerResult.provider || "unknown",
                    statusUrl: providerResult.statusUrl,
                };
            } else {
                throw new Error(
                    providerResult.errorMessage || "SMS provider failed"
                );
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            const errorCode = this.getSMSErrorCode(error);

            // Update notification as failed
            if (notification) {
                await this.updateNotificationStatus(notification.id, {
                    success: false,
                    errorMessage,
                });
            }

            logger.error(
                "SMS sending failed",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    notificationId: notification?.id,
                    eventId: data.eventId,
                    recipient: data.recipient.phone,
                    error: errorMessage,
                    errorCode,
                }
            );

            return {
                success: false,
                errorMessage,
                errorCode,
            };
        }
    }

    // ========================================
    // FIXED WHATSAPP METHOD
    // ========================================
    async sendWhatsApp(
        data: SendWhatsAppRequestEvent["data"]
    ): Promise<WhatsAppResult> {
        let notification: any = null;

        try {
            // Create notification record
            notification = await this.createNotificationRecord(
                data,
                "WHATSAPP"
            );

            logger.info(
                "Processing WhatsApp send request",
                LogCategory.NOTIFICATION,
                {
                    notificationId: notification.id,
                    eventId: data.eventId,
                    recipient: data.recipient.phone,
                    messageType: data.message.type,
                    templateName: data.message.templateName,
                }
            );

            let message = data.message.content;

            // Use template if specified
            if (data.message.templateName && data.message.templateData) {
                try {
                    // message = await this.templateService.renderTemplate(
                    //     data.message.templateName,
                    //     data.message.templateData
                    // );
                    const rendered = await this.templateService.renderTemplate(
                        data.message.templateName,
                        data.message.templateData
                    );
                    message = rendered.content;
                } catch (templateError) {
                    logger.error(
                        "WhatsApp template rendering failed",
                        undefined,
                        LogCategory.NOTIFICATION,
                        {
                            templateName: data.message.templateName,
                            error:
                                templateError instanceof Error
                                    ? templateError.message
                                    : String(templateError),
                        }
                    );
                    throw new Error(
                        `WhatsApp template rendering failed: ${templateError instanceof Error ? templateError.message : "Unknown error"}`
                    );
                }
            }

            // Send WhatsApp via provider
            const providerResult: ProviderWhatsAppResult =
                await this.whatsappProvider.sendMessage({
                    to: data.recipient.phone,
                    message: message || "",
                    type:
                        data.message.type === "TEMPLATE" ? "TEMPLATE" : "TEXT",
                    templateName: data.message.templateName,
                    templateData: data.message.templateData,
                    mediaUrl: data.message.mediaUrl,
                    mediaType: data.message.mediaType,
                    buttons: data.message.buttons,
                });

            if (providerResult.success) {
                // Update notification as sent
                await this.updateNotificationStatus(notification.id, {
                    success: true,
                    messageId: providerResult.messageId,
                    externalId: providerResult.externalId,
                });

                logger.info(
                    "WhatsApp message sent successfully",
                    LogCategory.NOTIFICATION,
                    {
                        notificationId: notification.id,
                        messageId: providerResult.messageId,
                        recipient: data.recipient.phone,
                        messageType: data.message.type,
                    }
                );

                return {
                    success: true,
                    messageId: providerResult.messageId,
                    externalId: providerResult.externalId,
                    actualContent: providerResult.actualContent || message,
                    cost: providerResult.cost,
                    provider: providerResult.provider || "unknown",
                    conversationId: providerResult.conversationId,
                    conversationType: providerResult.conversationType,
                };
            } else {
                throw new Error(
                    providerResult.errorMessage || "WhatsApp provider failed"
                );
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            const errorCode = this.getWhatsAppErrorCode(error);

            // Update notification as failed
            if (notification) {
                await this.updateNotificationStatus(notification.id, {
                    success: false,
                    errorMessage,
                });
            }

            logger.error(
                "WhatsApp sending failed",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    notificationId: notification?.id,
                    eventId: data.eventId,
                    recipient: data.recipient.phone,
                    messageType: data.message.type,
                    error: errorMessage,
                    errorCode,
                }
            );

            return {
                success: false,
                errorMessage,
                errorCode,
                templateStatus: (error as any)?.templateStatus,
            };
        }
    }

    /**
     * Send in-app notification (synchronous - saves to DB)
     * FIXED: Uses actual Notification model fields (no metadata)
     */
    async sendInAppNotification(
        data: SendInAppNotificationRequestEvent["data"]
    ): Promise<InAppNotificationResult> {
        try {
            logger.info(
                "Creating in-app notification",
                LogCategory.NOTIFICATION,
                {
                    eventId: data.eventId,
                    recipientId: data.recipientId,
                    title: data.notification.title,
                }
            );

            // Create notification in database (using actual schema fields)
            const notification = await prisma.notification.create({
                data: {
                    title: data.notification.title,
                    message: data.notification.message,
                    type: this.mapNotificationType(
                        data.notification.type || data.metadata.sourceEntity
                    ),
                    channel: "IN_APP" as any,
                    recipientType: data.recipientType,
                    recipientId: data.recipientId,
                    recipientName: data.recipient.name,
                    recipientContact: data.recipient.email,
                    userId: data.userId,
                    status: "SENT" as any,
                    sentAt: new Date(),

                    // Store extra data in templateData field (it's a Json field)
                    templateData: {
                        deepLink: data.notification.deepLink,
                        priority: data.notification.priority,
                        imageUrl: data.notification.imageUrl,
                        sourceService: data.metadata.sourceService,
                        sourceEntity: data.metadata.sourceEntity,
                        sourceEntityId: data.metadata.sourceEntityId,
                    },

                    // Map source entity relationships based on entity type
                    ...(data.metadata.sourceEntity === "Invoice" && {
                        invoiceId: data.metadata.sourceEntityId,
                    }),
                    ...(data.metadata.sourceEntity === "invoice" && {
                        invoiceId: data.metadata.sourceEntityId,
                    }),
                    ...(data.metadata.sourceEntity === "Sale" && {
                        saleId: data.metadata.sourceEntityId,
                    }),
                    ...(data.metadata.sourceEntity === "InvoicePayment" && {
                        invoicePaymentId: data.metadata.sourceEntityId,
                    }),
                    ...(data.metadata.sourceEntity === "invoice_payment" && {
                        invoicePaymentId: data.metadata.sourceEntityId,
                    }),
                    ...(data.metadata.sourceEntity === "SaleReceipt" && {
                        saleReceiptId: data.metadata.sourceEntityId,
                    }),
                    ...(data.metadata.sourceEntity === "sale_receipt" && {
                        saleReceiptId: data.metadata.sourceEntityId,
                    }),
                },
            });

            logger.info(
                "In-app notification created successfully",
                LogCategory.NOTIFICATION,
                {
                    notificationId: notification.id,
                    eventId: data.eventId,
                    recipientId: data.recipientId,
                }
            );

            return {
                success: true,
                notificationId: notification.id,
                createdAt: notification.createdAt,
            };
        } catch (error: any) {
            logger.error(
                "Failed to create in-app notification",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    eventId: data.eventId,
                    recipientId: data.recipientId,
                    error: error.message,
                    stack: error.stack,
                }
            );

            return {
                success: false,
                errorMessage: error.message,
                errorCode: "INAPP_NOTIFICATION_FAILED",
            };
        }
    }

    // ========================================
    // PRIVATE HELPER METHODS
    // ========================================

    private async createNotificationRecord(
        data:
            | SendEmailRequestEvent["data"]
            | SendSMSRequestEvent["data"]
            | SendWhatsAppRequestEvent["data"],
        channel: "EMAIL" | "SMS" | "WHATSAPP"
    ): Promise<any> {
        return await prisma.notification.create({
            data: {
                title: this.extractTitle(data),
                message: this.extractMessage(data),
                type: this.mapNotificationType(data.metadata.sourceEntity),
                channel: channel as any,
                recipientType: data.recipientType,
                recipientId: data.recipientId,
                recipientName: data.recipient.name,
                recipientContact:
                    "email" in data.recipient
                        ? data.recipient.email
                        : data.recipient.phone,
                templateName: this.getTemplateName(data),
                templateData: this.getTemplateData(data),
                userId: data.userId,
                // Map source entity relationships
                ...(data.metadata.sourceEntity === "Invoice" && {
                    invoiceId: data.metadata.sourceEntityId,
                }),
                ...(data.metadata.sourceEntity === "Sale" && {
                    saleId: data.metadata.sourceEntityId,
                }),
                ...(data.metadata.sourceEntity === "InvoicePayment" && {
                    invoicePaymentId: data.metadata.sourceEntityId,
                }),
                ...(data.metadata.sourceEntity === "SaleReceipt" && {
                    saleReceiptId: data.metadata.sourceEntityId,
                }),
                ...(data.metadata.sourceEntity === "EcommerceUser" &&
                    {
                        // No specific relation field in schema for this
                    }),
            },
        });
    }

    private async updateNotificationStatus(
        notificationId: string,
        result: {
            success: boolean;
            messageId?: string;
            externalId?: string;
            deliveredAt?: Date;
            errorMessage?: string;
        }
    ): Promise<void> {
        await prisma.notification.update({
            where: { id: notificationId },
            data: {
                status: result.success ? "SENT" : "FAILED",
                sentAt: result.success ? new Date() : undefined,
                deliveredAt: result.deliveredAt,
                failureReason: result.errorMessage,
                externalId: result.externalId || result.messageId,
            },
        });
    }

    private extractTitle(data: any): string {
        if ("email" in data && data.email?.subject) {
            return data.email.subject;
        }
        if ("message" in data && data.message?.content) {
            return (
                data.message.content.substring(0, 50) +
                (data.message.content.length > 50 ? "..." : "")
            );
        }
        return "Notification";
    }

    private extractMessage(data: any): string {
        if ("email" in data) {
            return (
                data.email?.textBody ||
                data.email?.subject ||
                "Email notification"
            );
        }
        if ("message" in data) {
            return data.message?.content || "Message notification";
        }
        return "Notification message";
    }

    private getTemplateName(data: any): string | undefined {
        if ("email" in data) {
            return data.email?.templateName;
        }
        if ("message" in data) {
            return data.message?.templateName;
        }
        return undefined;
    }

    private getTemplateData(data: any): any {
        if ("email" in data) {
            return data.email?.templateData;
        }
        if ("message" in data) {
            return data.message?.templateData;
        }
        return undefined;
    }

    private mapNotificationType(sourceEntity: string): NotificationType {
        const mapping: Record<string, NotificationType> = {
            Invoice: NotificationType.INVOICE_CREATED,
            Sale: NotificationType.SALE_CREATED,
            InvoicePayment: NotificationType.PAYMENT_CONFIRMATION,
            SaleReceipt: NotificationType.PAYMENT_CONFIRMATION,
            EcommerceUser: NotificationType.WELCOME,
            Customer: NotificationType.WELCOME,
            InventoryItem: NotificationType.STOCK_ALERT,
        };
        return mapping[sourceEntity] || NotificationType.CUSTOM;
    }

    // ========================================
    // ERROR CODE MAPPERS
    // ========================================

    private getEmailErrorCode(error: unknown): string {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            if (message.includes("invalid email")) return "INVALID_EMAIL";
            if (message.includes("rate limit")) return "RATE_LIMIT";
            if (message.includes("bounce")) return "EMAIL_BOUNCED";
            if (message.includes("spam")) return "SPAM_DETECTED";
            if (message.includes("authentication")) return "AUTH_FAILED";
            if (message.includes("template")) return "TEMPLATE_ERROR";
        }
        return "EMAIL_SEND_FAILED";
    }

    private getSMSErrorCode(error: unknown): string {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            if (message.includes("invalid phone")) return "INVALID_PHONE";
            if (message.includes("rate limit")) return "RATE_LIMIT";
            if (message.includes("insufficient balance"))
                return "INSUFFICIENT_BALANCE";
            if (message.includes("blocked")) return "PHONE_BLOCKED";
            if (message.includes("carrier")) return "CARRIER_ERROR";
            if (message.includes("template")) return "TEMPLATE_ERROR";
        }
        return "SMS_SEND_FAILED";
    }

    private getWhatsAppErrorCode(error: unknown): string {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            if (message.includes("invalid phone")) return "INVALID_PHONE";
            if (message.includes("template")) return "TEMPLATE_ERROR";
            if (message.includes("rate limit")) return "RATE_LIMIT";
            if (message.includes("media")) return "MEDIA_ERROR";
            if (message.includes("business account"))
                return "BUSINESS_ACCOUNT_ERROR";
            if (message.includes("country code")) return "INVALID_COUNTRY_CODE";
        }
        return "WHATSAPP_SEND_FAILED";
    }
}
