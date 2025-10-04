// // notification-service/src/services/providers/emailProvider.ts
// import nodemailer from "nodemailer";
// import { EmailData, DeliveryResult } from "@repo/common-backend/interfaces";
// import { notificationConfig } from "../../config/index";

// export class EmailProvider {
//     private transporter: nodemailer.Transporter;

//     constructor() {
//         this.transporter = nodemailer.createTransport({
//             host: notificationConfig.email.config.host,
//             port: notificationConfig.email.config.port,
//             secure: notificationConfig.email.config.secure,
//             auth: notificationConfig.email.config.auth,
//         });
//     }

//     async sendEmail(emailData: EmailData): Promise<DeliveryResult> {
//         try {
//             const mailOptions = {
//                 from: `${notificationConfig.email.config.fromName} <${notificationConfig.email.config.fromEmail}>`,
//                 to: `${emailData.to.name} <${emailData.to.email}>`,
//                 subject: emailData.subject,
//                 html: emailData.htmlBody,
//                 text: emailData.textBody,
//                 attachments: emailData.attachments?.map((att) => ({
//                     filename: att.filename,
//                     content: att.content,
//                     contentType: att.contentType,
//                 })),
//             };

//             const result = await this.transporter.sendMail(mailOptions);

//             return {
//                 success: true,
//                 messageId: result.messageId,
//                 deliveredAt: new Date(),
//             };
//         } catch (error: any) {
//             return {
//                 success: false,
//                 errorMessage: error.message,
//                 errorCode: error.code,
//             };
//         }
//     }
// }

// notification-service/src/services/providers/emailProvider.ts
import nodemailer from "nodemailer";
import {
    EmailData,
    ProviderEmailResult,
} from "@repo/common-backend/interfaces";
import { notificationConfig } from "../../config/index";
import { logger, LogCategory } from "@repo/common-backend/logger";

export class EmailProvider {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: notificationConfig.email.config.host,
            port: notificationConfig.email.config.port,
            secure: notificationConfig.email.config.secure,
            auth: notificationConfig.email.config.auth,
        });

        // Verify transporter configuration
        this.transporter.verify((error) => {
            if (error) {
                logger.error(
                    "Email transporter configuration failed",
                    undefined,
                    LogCategory.NOTIFICATION,
                    {
                        error: error.message,
                        host: notificationConfig.email.config.host,
                        port: notificationConfig.email.config.port,
                    }
                );
            } else {
                logger.info(
                    "Email transporter ready",
                    LogCategory.NOTIFICATION,
                    {
                        host: notificationConfig.email.config.host,
                        port: notificationConfig.email.config.port,
                    }
                );
            }
        });
    }

    async sendEmail(emailData: EmailData): Promise<ProviderEmailResult> {
        try {
            logger.debug(
                "Preparing email for sending",
                LogCategory.NOTIFICATION,
                {
                    recipient: emailData.to.email,
                    subject: emailData.subject,
                    hasAttachments: !!emailData.attachments?.length,
                }
            );

            // Validate email data
            if (!emailData.to.email || !emailData.subject) {
                throw new Error("Email address and subject are required");
            }

            // Prepare mail options
            const mailOptions: nodemailer.SendMailOptions = {
                from: `${notificationConfig.email.config.fromName} <${notificationConfig.email.config.fromEmail}>`,
                to: `${emailData.to.name} <${emailData.to.email}>`,
                subject: emailData.subject,
                html: emailData.htmlBody,
                text: emailData.textBody,
                attachments: emailData.attachments?.map((att) => ({
                    filename: att.filename,
                    content: Buffer.from(att.content, "base64"), // Assuming base64 content
                    contentType: att.contentType,
                })),
            };

            // Send email
            const result = await this.transporter.sendMail(mailOptions);

            logger.info(
                "Email sent successfully via provider",
                LogCategory.NOTIFICATION,
                {
                    recipient: emailData.to.email,
                    messageId: result.messageId,
                    subject: emailData.subject,
                }
            );

            return {
                success: true,
                messageId: result.messageId,
                externalId: result.messageId, // Nodemailer doesn't provide separate external ID
                cost: this.calculateEmailCost(), // Implement cost calculation
                deliveredAt: new Date(), // For immediate delivery providers like SMTP
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown email error";
            const errorCode = this.mapEmailErrorCode(error);

            logger.error(
                "Email sending failed via provider",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    recipient: emailData.to.email,
                    subject: emailData.subject,
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

    private calculateEmailCost(): number {
        // Implement your cost calculation logic here
        // This could be based on provider pricing, email size, etc.
        return Number(notificationConfig.email.costPerEmail) || 0.01;
    }

    private mapEmailErrorCode(error: unknown): string {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();

            // SMTP specific error codes
            if (
                message.includes("invalid login") ||
                message.includes("authentication")
            ) {
                return "SMTP_AUTH_FAILED";
            }
            if (message.includes("recipient address rejected")) {
                return "INVALID_EMAIL";
            }
            if (message.includes("mailbox full") || message.includes("quota")) {
                return "MAILBOX_FULL";
            }
            if (message.includes("spam") || message.includes("blocked")) {
                return "SPAM_DETECTED";
            }
            if (message.includes("timeout") || message.includes("connection")) {
                return "CONNECTION_ERROR";
            }
            if (
                message.includes("rate limit") ||
                message.includes("too many")
            ) {
                return "RATE_LIMIT";
            }
        }

        return "EMAIL_SEND_FAILED";
    }
}
