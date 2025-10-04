// // notification-service/src/services/providers/smsProvider.ts
// import twilio from "twilio";
// import { SMSData, DeliveryResult } from "@repo/common-backend/interfaces";
// import { notificationConfig } from "../../config/index";

// export class SMSProvider {
//     private client: twilio.Twilio;

//     constructor() {
//         this.client = twilio(
//             notificationConfig.sms.config.accountSid,
//             notificationConfig.sms.config.authToken
//         );
//     }

//     async sendSMS(smsData: SMSData): Promise<DeliveryResult> {
//         try {
//             const result = await this.client.messages.create({
//                 body: smsData.message,
//                 from: notificationConfig.sms.config.fromNumber,
//                 to: smsData.to,
//             });

//             return {
//                 success: true,
//                 messageId: result.sid,
//                 externalId: result.sid,
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
import twilio from "twilio";
import { SMSData, ProviderSMSResult } from "@repo/common-backend/interfaces";
import { notificationConfig } from "../../config/index";
import { logger, LogCategory } from "@repo/common-backend/logger";

export class SMSProvider {
    private client: twilio.Twilio;

    constructor() {
        // Initialize Twilio client
        const accountSid = notificationConfig.sms.config.accountSid;
        const authToken = notificationConfig.sms.config.authToken;

        if (!accountSid || !authToken) {
            throw new Error(
                "Twilio credentials are required (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)"
            );
        }

        this.client = twilio(accountSid, authToken);

        logger.info(
            "SMS Provider (Twilio) initialized",
            LogCategory.NOTIFICATION,
            {
                accountSid: accountSid.substring(0, 10) + "...", // Log partial SID for security
            }
        );
    }

    async sendSMS(smsData: SMSData): Promise<ProviderSMSResult> {
        try {
            logger.debug("Sending SMS via Twilio", LogCategory.NOTIFICATION, {
                recipient: smsData.to,
                messageLength: smsData.message.length,
                unicode: smsData.unicode,
                fromNumber: notificationConfig.sms.config.fromNumber,
            });

            // Validate SMS data
            if (!smsData.to || !smsData.message) {
                throw new Error("Phone number and message are required");
            }

            // Ensure phone number format
            const formattedPhone = this.formatPhoneNumber(smsData.to);

            // Calculate message info
            const messageLength = smsData.message.length;
            const segmentSize = smsData.unicode ? 70 : 160;
            const segmentCount = Math.ceil(messageLength / segmentSize);

            // Send SMS via Twilio
            const result = await this.client.messages.create({
                body: smsData.message,
                from: notificationConfig.sms.config.fromNumber,
                to: formattedPhone,
                // Optional: Add status callback URL for delivery tracking
                statusCallback: notificationConfig.sms.config.statusCallbackUrl,
            });

            logger.info(
                "SMS sent successfully via Twilio",
                LogCategory.NOTIFICATION,
                {
                    recipient: formattedPhone,
                    messageId: result.sid,
                    status: result.status,
                    segments: segmentCount,
                    price: result.price,
                    priceUnit: result.priceUnit,
                }
            );

            // Calculate cost (Twilio provides price, but it might be null initially)
            const cost = result.price
                ? parseFloat(result.price)
                : this.calculateSMSCost(segmentCount);

            return {
                success: true,
                messageId: result.sid,
                externalId: result.sid,
                actualContent: smsData.message,
                messageLength,
                segmentCount,
                cost,
                provider: "twilio",
                statusUrl: this.buildStatusUrl(result.sid),
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown SMS error";
            const errorCode = this.mapTwilioErrorCode(error);

            logger.error(
                "SMS sending failed via Twilio",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    recipient: smsData.to,
                    error: errorMessage,
                    errorCode,
                    twilioErrorCode: (error as any)?.code,
                    twilioErrorStatus: (error as any)?.status,
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
    // PRIVATE HELPER METHODS
    // ========================================

    private formatPhoneNumber(phone: string): string {
        // Remove any non-digit characters
        const cleaned = phone.replace(/\D/g, "");

        // Add + if not present
        if (!phone.startsWith("+")) {
            // Assume Indian number if no country code (adjust based on your region)
            if (cleaned.length === 10) {
                return `+91${cleaned}`;
            } else if (cleaned.length > 10) {
                return `+${cleaned}`;
            }
        }

        return phone;
    }

    private calculateSMSCost(segmentCount: number): number {
        // Fallback cost calculation if Twilio doesn't provide price immediately
        const costPerSegment = notificationConfig.sms.costPerSegment || 0.05;
        return segmentCount * Number(costPerSegment);
    }

    private buildStatusUrl(messageSid: string): string {
        return `${notificationConfig.sms.config.baseUrl}/status/${messageSid}`;
    }

    private mapTwilioErrorCode(error: any): string {
        // Map Twilio-specific error codes to our standard codes
        const twilioCode = error?.code;
        const message = error?.message?.toLowerCase() || "";

        // Twilio error code mappings
        switch (twilioCode) {
            case 21211:
                return "INVALID_PHONE";
            case 21214:
                return "INVALID_PHONE";
            case 21408:
                return "PERMISSION_DENIED";
            case 21610:
                return "MESSAGE_BLOCKED";
            case 21611:
                return "MESSAGE_BLOCKED";
            case 21617:
                return "PHONE_UNREACHABLE";
            case 21620:
                return "MESSAGE_TOO_LONG";
            case 21902:
                return "MESSAGE_BLOCKED";
            case 30001:
                return "MESSAGE_QUEUED";
            case 30002:
                return "MESSAGE_QUEUED";
            case 30003:
                return "MESSAGE_FAILED";
            case 30004:
                return "MESSAGE_BLOCKED";
            case 30005:
                return "PHONE_UNREACHABLE";
            case 30006:
                return "PHONE_UNREACHABLE";
            case 30007:
                return "CARRIER_VIOLATION";
            case 30008:
                return "MESSAGE_BLOCKED";
            default:
                // Fallback to message-based mapping
                if (
                    message.includes("invalid phone") ||
                    message.includes("invalid number")
                ) {
                    return "INVALID_PHONE";
                }
                if (
                    message.includes("insufficient funds") ||
                    message.includes("balance")
                ) {
                    return "INSUFFICIENT_BALANCE";
                }
                if (message.includes("rate limit")) {
                    return "RATE_LIMIT";
                }
                if (
                    message.includes("blocked") ||
                    message.includes("blacklist")
                ) {
                    return "PHONE_BLOCKED";
                }
                if (
                    message.includes("authentication") ||
                    message.includes("credentials")
                ) {
                    return "AUTH_FAILED";
                }
                return "SMS_SEND_FAILED";
        }
    }

    // ========================================
    // OPTIONAL: STATUS WEBHOOK HANDLER
    // ========================================

    async handleStatusCallback(webhookData: any): Promise<void> {
        // Handle Twilio status callbacks for delivery tracking
        try {
            const { MessageSid, MessageStatus, ErrorCode } = webhookData;

            logger.info(
                "Received SMS status callback from Twilio",
                LogCategory.NOTIFICATION,
                {
                    messageId: MessageSid,
                    status: MessageStatus,
                    errorCode: ErrorCode,
                }
            );

            // Update notification status in database if needed
            // This would integrate with your notification tracking system
        } catch (error) {
            logger.error(
                "Error processing SMS status callback",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    webhookData,
                }
            );
        }
    }
}
