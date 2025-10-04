// ========================================
// WHATSAPP BUSINESS API PROVIDER IMPLEMENTATION
// ========================================

// notification-service/src/services/providers/whatsAppProvider.ts
import axios, { AxiosInstance } from "axios";
import {
    WhatsAppData,
    ProviderWhatsAppResult,
} from "@repo/common-backend/interfaces";
import { notificationConfig } from "../../config/index";
import { logger, LogCategory } from "@repo/common-backend/logger";

export class WhatsAppProvider {
    private client: AxiosInstance;
    private phoneNumberId: string;
    private businessAccountId: string;

    constructor() {
        // Initialize WhatsApp Business API client
        const accessToken = notificationConfig.whatsapp.config.accessToken;
        this.phoneNumberId = notificationConfig.whatsapp.config.phoneNumberId;
        this.businessAccountId =
            notificationConfig.whatsapp.config.businessAccountId;

        if (!accessToken || !this.phoneNumberId) {
            throw new Error(
                "WhatsApp Business API credentials are required (ACCESS_TOKEN, PHONE_NUMBER_ID)"
            );
        }

        this.client = axios.create({
            baseURL: `https://graph.facebook.com/v18.0`,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            timeout: 30000,
        });

        logger.info(
            "WhatsApp Provider (Business API) initialized",
            LogCategory.NOTIFICATION,
            {
                phoneNumberId: this.phoneNumberId,
                businessAccountId: this.businessAccountId,
            }
        );
    }

    async sendMessage(
        whatsappData: WhatsAppData
    ): Promise<ProviderWhatsAppResult> {
        try {
            logger.debug(
                "Sending WhatsApp message via Business API",
                LogCategory.NOTIFICATION,
                {
                    recipient: whatsappData.to,
                    messageType: whatsappData.type,
                    templateName: whatsappData.templateName,
                    hasMedia: !!whatsappData.mediaUrl,
                }
            );

            // Validate WhatsApp data
            if (!whatsappData.to) {
                throw new Error("WhatsApp number is required");
            }

            // Format phone number
            const formattedPhone = this.formatPhoneNumber(whatsappData.to);

            // Build message payload based on type
            const messagePayload = this.buildMessagePayload(
                whatsappData,
                formattedPhone
            );

            // Send message via WhatsApp Business API
            const response = await this.client.post(
                `/${this.phoneNumberId}/messages`,
                messagePayload
            );

            const result = response.data;

            logger.info(
                "WhatsApp message sent successfully via Business API",
                LogCategory.NOTIFICATION,
                {
                    recipient: formattedPhone,
                    messageId: result.messages[0].id,
                    waId: result.contacts[0].wa_id,
                    messageType: whatsappData.type,
                }
            );

            // Calculate cost based on message type - FIXED TYPE ISSUE
            const messageType = whatsappData.type?.toLowerCase() || "text";
            const cost = this.calculateWhatsAppCost(messageType);

            return {
                success: true,
                messageId: result.messages[0].id,
                externalId: result.messages[0].id,
                actualContent:
                    whatsappData.message ||
                    `WhatsApp ${whatsappData.type || "TEXT"} message`,
                cost,
                provider: "whatsapp-business-api",
                conversationId: this.generateConversationId(
                    result.contacts[0].wa_id
                ),
                conversationType: "BUSINESS_INITIATED",
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown WhatsApp error";
            const errorCode = this.mapWhatsAppErrorCode(error);

            logger.error(
                "WhatsApp message sending failed via Business API",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    recipient: whatsappData.to,
                    error: errorMessage,
                    errorCode,
                    messageType: whatsappData.type,
                    apiError: axios.isAxiosError(error)
                        ? {
                              status: error.response?.status,
                              data: error.response?.data,
                          }
                        : undefined,
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
    // FIXED MESSAGE PAYLOAD BUILDERS
    // ========================================

    private buildMessagePayload(whatsappData: WhatsAppData, to: string): any {
        const basePayload = {
            messaging_product: "whatsapp",
            to: to,
        };

        // FIXED: Use exact case matching
        switch (whatsappData.type?.toUpperCase()) {
            case "TEMPLATE":
                return this.buildTemplatePayload(basePayload, whatsappData);
            case "TEXT":
                return this.buildTextPayload(basePayload, whatsappData);
            case "MEDIA":
                return this.buildMediaPayload(basePayload, whatsappData);
            case "DOCUMENT":
                return this.buildDocumentPayload(basePayload, whatsappData);
            case "INTERACTIVE":
                return this.buildInteractivePayload(basePayload, whatsappData);
            default:
                return this.buildTextPayload(basePayload, whatsappData);
        }
    }

    private buildTextPayload(
        basePayload: any,
        whatsappData: WhatsAppData
    ): any {
        return {
            ...basePayload,
            type: "text",
            text: {
                body: whatsappData.message || "Hello from your store!",
            },
        };
    }

    private buildTemplatePayload(
        basePayload: any,
        whatsappData: WhatsAppData
    ): any {
        if (!whatsappData.templateName) {
            throw new Error("Template name is required for template messages");
        }

        const templatePayload: any = {
            ...basePayload,
            type: "template",
            template: {
                name: whatsappData.templateName,
                language: {
                    code: notificationConfig.whatsapp.defaultLanguage || "en",
                },
            },
        };

        // Add template parameters if provided
        if (
            whatsappData.templateData &&
            Object.keys(whatsappData.templateData).length > 0
        ) {
            templatePayload.template.components = [
                {
                    type: "body",
                    parameters: Object.values(whatsappData.templateData).map(
                        (value) => ({
                            type: "text",
                            text: String(value),
                        })
                    ),
                },
            ];
        }

        return templatePayload;
    }

    private buildMediaPayload(
        basePayload: any,
        whatsappData: WhatsAppData
    ): any {
        if (!whatsappData.mediaUrl) {
            throw new Error("Media URL is required for media messages");
        }

        // FIXED: Handle media type properly
        const mediaType = whatsappData.mediaType?.toLowerCase() || "image";

        return {
            ...basePayload,
            type: mediaType,
            [mediaType]: {
                link: whatsappData.mediaUrl,
                caption: whatsappData.message || undefined,
            },
        };
    }

    private buildDocumentPayload(
        basePayload: any,
        whatsappData: WhatsAppData
    ): any {
        if (!whatsappData.mediaUrl) {
            throw new Error("Document URL is required for document messages");
        }

        return {
            ...basePayload,
            type: "document",
            document: {
                link: whatsappData.mediaUrl,
                filename: whatsappData.message || "document.pdf",
            },
        };
    }

    private buildInteractivePayload(
        basePayload: any,
        whatsappData: WhatsAppData
    ): any {
        if (!whatsappData.buttons || whatsappData.buttons.length === 0) {
            throw new Error("Buttons are required for interactive messages");
        }

        return {
            ...basePayload,
            type: "interactive",
            interactive: {
                type: "button",
                body: {
                    text: whatsappData.message || "Please choose an option:",
                },
                action: {
                    buttons: whatsappData.buttons.map((button, index) => ({
                        type: "reply",
                        reply: {
                            id: `btn_${index}`,
                            title: button.title.substring(0, 20),
                        },
                    })),
                },
            },
        };
    }

    // ========================================
    // FIXED HELPER METHODS
    // ========================================

    private formatPhoneNumber(phone: string): string {
        const cleaned = phone.replace(/\D/g, "");

        if (!phone.startsWith("+")) {
            if (cleaned.length === 10) {
                return `91${cleaned}`;
            } else if (cleaned.length > 10) {
                return cleaned;
            }
        }

        return phone.replace("+", "");
    }

    private generateConversationId(waId: string): string {
        return `conv_${waId}_${Date.now()}`;
    }

    // FIXED: Proper type handling for cost calculation
    private calculateWhatsAppCost(messageType: string): number {
        // Define costs with proper typing
        const costs: Record<string, number> = {
            text: parseFloat(process.env.WHATSAPP_TEXT_COST || "0.02"),
            template: parseFloat(process.env.WHATSAPP_TEMPLATE_COST || "0.03"),
            media: parseFloat(process.env.WHATSAPP_MEDIA_COST || "0.04"),
            document: parseFloat(process.env.WHATSAPP_DOCUMENT_COST || "0.04"),
            interactive: parseFloat(
                process.env.WHATSAPP_INTERACTIVE_COST || "0.03"
            ),
            image: parseFloat(process.env.WHATSAPP_MEDIA_COST || "0.04"),
            video: parseFloat(process.env.WHATSAPP_MEDIA_COST || "0.04"),
            audio: parseFloat(process.env.WHATSAPP_MEDIA_COST || "0.04"),
        };

        // FIXED: Safe access with fallback
        return costs[messageType] || costs.text || 0.04;
    }

    private mapWhatsAppErrorCode(error: any): string {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const errorData = error.response?.data;
            const errorCode = errorData?.error?.code;

            // WhatsApp Business API specific error codes
            switch (errorCode) {
                case 100:
                    return "INVALID_PARAMETER";
                case 131000:
                    return "TEMPLATE_NOT_FOUND";
                case 131005:
                    return "TEMPLATE_NOT_APPROVED";
                case 131008:
                    return "TEMPLATE_PARAMETER_MISMATCH";
                case 131014:
                    return "TEMPLATE_DISABLED";
                case 131016:
                    return "TEMPLATE_PAUSED";
                case 131026:
                    return "MESSAGE_UNDELIVERABLE";
                case 131047:
                    return "RATE_LIMIT_EXCEEDED";
                case 131051:
                    return "PHONE_NUMBER_NOT_REGISTERED";
                case 132000:
                    return "MEDIA_UPLOAD_ERROR";
                case 132001:
                    return "MEDIA_DOWNLOAD_ERROR";
                case 132007:
                    return "MEDIA_TOO_LARGE";
                case 133010:
                    return "CONVERSATION_NOT_FOUND";
                default:
                    switch (status) {
                        case 400:
                            return "BAD_REQUEST";
                        case 401:
                            return "UNAUTHORIZED";
                        case 403:
                            return "FORBIDDEN";
                        case 404:
                            return "NOT_FOUND";
                        case 429:
                            return "RATE_LIMIT_EXCEEDED";
                        case 500:
                            return "INTERNAL_SERVER_ERROR";
                        default:
                            return "WHATSAPP_API_ERROR";
                    }
            }
        }

        const message = error?.message?.toLowerCase() || "";
        if (message.includes("invalid phone")) return "INVALID_PHONE";
        if (message.includes("template")) return "TEMPLATE_ERROR";
        if (message.includes("rate limit")) return "RATE_LIMIT";
        if (message.includes("media")) return "MEDIA_ERROR";
        if (message.includes("timeout")) return "TIMEOUT";

        return "WHATSAPP_SEND_FAILED";
    }

    // ========================================
    // WEBHOOK HANDLERS FOR STATUS UPDATES
    // ========================================

    async handleWebhook(webhookData: any): Promise<void> {
        try {
            // Handle WhatsApp Business API webhooks for delivery status
            const { entry } = webhookData;

            if (!entry || entry.length === 0) return;

            for (const entryItem of entry) {
                const changes = entryItem.changes || [];

                for (const change of changes) {
                    if (change.field === "messages") {
                        await this.processMessageStatus(change.value);
                    }
                }
            }
        } catch (error) {
            logger.error(
                "Error processing WhatsApp webhook",
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

    private async processMessageStatus(messageData: any): Promise<void> {
        const { statuses, messages } = messageData;

        // Process delivery statuses
        if (statuses && statuses.length > 0) {
            for (const status of statuses) {
                logger.info(
                    "WhatsApp message status update",
                    LogCategory.NOTIFICATION,
                    {
                        messageId: status.id,
                        status: status.status,
                        timestamp: status.timestamp,
                        recipientId: status.recipient_id,
                    }
                );

                // Update your notification status in database
                // This would integrate with your notification tracking system
            }
        }

        // Process incoming messages (for interactive responses)
        if (messages && messages.length > 0) {
            for (const message of messages) {
                logger.info(
                    "Received WhatsApp message",
                    LogCategory.NOTIFICATION,
                    {
                        messageId: message.id,
                        from: message.from,
                        type: message.type,
                        timestamp: message.timestamp,
                    }
                );

                // Handle customer responses to interactive messages
                // This could trigger follow-up actions in your system
            }
        }
    }

    // ========================================
    // TEMPLATE MANAGEMENT METHODS
    // ========================================

    async getTemplates(): Promise<any> {
        try {
            const response = await this.client.get(
                `/${this.businessAccountId}/message_templates`
            );
            return response.data;
        } catch (error) {
            logger.error(
                "Failed to fetch WhatsApp templates",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                }
            );
            throw error;
        }
    }

    async getTemplateStatus(templateName: string): Promise<string> {
        try {
            const templates = await this.getTemplates();
            const template = templates.data.find(
                (t: any) => t.name === templateName
            );
            return template ? template.status : "NOT_FOUND";
        } catch (error) {
            logger.error(
                "Failed to get template status",
                undefined,
                LogCategory.NOTIFICATION,
                {
                    templateName,
                    error:
                        error instanceof Error ? error.message : String(error),
                }
            );
            return "ERROR";
        }
    }
}
