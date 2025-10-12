import { BaseEvent } from "./base-interfaces";
import { Subjects } from "@repo/common/subjects";

// Request Events (what other services publish)

/**
 * =======================================
 *       Email Events
 * =======================================
 */
export interface SendEmailRequestEvent extends BaseEvent {
    subject: Subjects.SendEmailRequested;
    data: {
        eventId: string;
        recipientType: "CUSTOMER" | "PARTY" | "USER";
        recipientId: string;
        recipient: {
            email: string;
            name: string;
            phone?: string;
        };
        email: {
            subject: string;
            templateName?: string;
            templateData?: Record<string, any>;
            htmlBody?: string;
            textBody?: string;
            attachments?: Array<{
                filename: string;
                content: string;
                contentType: string;
            }>;
        };
        metadata: {
            sourceService: string;
            sourceEntity: string;
            sourceEntityId: string;
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        };
        userId: string;
        timestamp: string;
    };
}

// export interface SendEmailEvent extends BaseEvent {
//     subject: Subjects.EmailSent;
//     data: {
//         eventId: string;
//         recipientType: "CUSTOMER" | "PARTY" | "USER";
//         recipientId: string;
//         recipient: {
//             email: string;
//             name: string;
//             phone?: string;
//         };
//         email: {
//             subject: string;
//             templateName?: string;
//             templateData?: Record<string, any>;
//             htmlBody?: string;
//             textBody?: string;
//             attachments?: Array<{
//                 filename: string;
//                 content: string;
//                 contentType: string;
//             }>;
//         };
//         metadata: {
//             sourceService: string;
//             sourceEntity: string;
//             sourceEntityId: string;
//             priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
//         };
//         userId: string;
//         timestamp: string;
//     };
// }

export interface EmailSentEvent extends BaseEvent {
    subject: Subjects.EmailSent;
    data: {
        eventId: string;
        originalRequestId: string;
        recipientType: "CUSTOMER" | "PARTY" | "USER";
        recipientId: string;
        recipient: {
            email: string;
            name: string;
        };
        email: {
            subject: string;
            templateName?: string;
        };
        result: {
            success: true;
            messageId: string;
            externalId?: string;
            sentAt: string;
            deliveredAt?: string;
            cost?: number;
        };
        metadata: {
            sourceService: string;
            sourceEntity: string;
            sourceEntityId: string;
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        };
        userId: string;
        timestamp: string;
    };
}

export interface EmailFailedEvent extends BaseEvent {
    subject: Subjects.EmailFailed;
    data: {
        eventId: string;
        originalRequestId: string;
        recipientType: "CUSTOMER" | "PARTY" | "USER";
        recipientId: string;
        recipient: {
            email: string;
            name: string;
        };
        email: {
            subject: string;
            templateName?: string;
        };
        error: {
            code: string;
            message: string;
            retryable: boolean;
        };
        metadata: {
            sourceService: string;
            sourceEntity: string;
            sourceEntityId: string;
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        };
        userId: string;
        timestamp: string;
    };
}

/**
 * =======================================
 *          SMS events
 * =======================================
 */

export interface SendSMSRequestEvent extends BaseEvent {
    subject: Subjects.SendSMSRequested;
    data: {
        eventId: string;
        recipientType: "CUSTOMER" | "PARTY" | "USER";
        recipientId: string;
        recipient: {
            phone: string;
            name: string;
            countryCode?: string; // +91, +1, etc.
        };
        message: {
            content?: string; // Plain text message
            templateName?: string; // SMS template name
            templateData?: Record<string, any>; // Template variables
            unicode?: boolean; // Support for unicode characters
            scheduledAt?: string; // ISO date string for scheduled SMS
        };
        metadata: {
            sourceService: string;
            sourceEntity: string;
            sourceEntityId: string;
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
            category?: "TRANSACTIONAL" | "PROMOTIONAL" | "OTP" | "ALERT";
        };
        userId: string;
        timestamp: string;
    };
}

// export interface SendSMSEvent extends BaseEvent {
//     subject: Subjects.SMSMessageSent;
//     data: {
//         eventId: string;
//         recipientType: "CUSTOMER" | "PARTY" | "USER";
//         recipientId: string;
//         recipient: {
//             phone: string;
//             name: string;
//             countryCode?: string;
//         };
//         message: {
//             content?: string;
//             templateName?: string;
//             templateData?: Record<string, any>;
//             unicode?: boolean;
//         };
//         metadata: {
//             sourceService: string;
//             sourceEntity: string;
//             sourceEntityId: string;
//             priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
//         };
//         userId: string;
//         timestamp: string;
//     };
// }

// SMS RESPONSE EVENTS (what notification service publishes after processing)
export interface SMSSentEvent extends BaseEvent {
    subject: Subjects.SMSMessageSent;
    data: {
        eventId: string;
        originalRequestId: string;
        recipientType: "CUSTOMER" | "PARTY" | "USER";
        recipientId: string;
        recipient: {
            phone: string;
            name: string;
            countryCode?: string;
        };
        message: {
            content?: string;
            templateName?: string;
            actualContent?: string; // Final message content sent
            messageLength?: number;
            segmentCount?: number; // Number of SMS segments
        };
        result: {
            success: true;
            messageId: string;
            externalId?: string; // SMS provider's message ID
            sentAt: string;
            deliveredAt?: string;
            cost?: number;
            provider: string; // SMS provider used (Twilio, AWS SNS, etc.)
            statusUrl?: string; // Webhook URL for delivery status
        };
        metadata: {
            sourceService: string;
            sourceEntity: string;
            sourceEntityId: string;
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        };
        userId: string;
        timestamp: string;
    };
}

export interface SMSFailedEvent extends BaseEvent {
    subject: Subjects.SMSMessageFailed;
    data: {
        eventId: string;
        originalRequestId: string;
        recipientType: "CUSTOMER" | "PARTY" | "USER";
        recipientId: string;
        recipient: {
            phone: string;
            name: string;
            countryCode?: string;
        };
        message: {
            content?: string;
            templateName?: string;
        };
        error: {
            code: string; // INVALID_PHONE, RATE_LIMIT, PROVIDER_ERROR, etc.
            message: string;
            retryable: boolean;
            providerError?: string;
        };
        metadata: {
            sourceService: string;
            sourceEntity: string;
            sourceEntityId: string;
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        };
        userId: string;
        timestamp: string;
    };
}

/**
 * ====================================
 *        whatsApp events
 * ====================================
 */

export interface SendWhatsAppRequestEvent extends BaseEvent {
    subject: Subjects.SendWhatsAppRequested;
    data: {
        eventId: string;
        recipientType: "CUSTOMER" | "PARTY" | "USER";
        recipientId: string;
        recipient: {
            phone: string; // WhatsApp number
            name: string;
            countryCode?: string;
        };
        message: {
            type: "TEXT" | "TEMPLATE" | "MEDIA" | "DOCUMENT" | "INTERACTIVE";
            content?: string; // For text messages
            templateName?: string; // WhatsApp Business template name
            templateData?: Record<string, any>; // Template parameters
            templateLanguage?: string; // en, hi, etc.
            mediaUrl?: string; // Image, video, audio URL
            mediaType?: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
            documentUrl?: string;
            fileName?: string;
            caption?: string; // Media caption
            buttons?: Array<{
                // Interactive buttons
                type: "REPLY" | "URL" | "PHONE";
                title: string;
                payload?: string;
                url?: string;
                phoneNumber?: string;
            }>;
            scheduledAt?: string; // ISO date string for scheduled messages
        };
        metadata: {
            sourceService: string;
            sourceEntity: string;
            sourceEntityId: string;
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
            category?:
                | "TRANSACTIONAL"
                | "PROMOTIONAL"
                | "SUPPORT"
                | "NOTIFICATION";
        };
        userId: string;
        timestamp: string;
    };
}

// export interface SendWhatsAppEvent extends BaseEvent {
//     subject: Subjects.WhatsAppMessageSent;
//     data: {
//         eventId: string;
//         recipientType: "CUSTOMER" | "PARTY" | "USER";
//         recipientId: string;
//         recipient: {
//             phone: string;
//             name: string;
//             countryCode?: string;
//         };
//         message: {
//             type: "TEXT" | "TEMPLATE" | "MEDIA" | "DOCUMENT";
//             content?: string;
//             templateName?: string;
//             templateData?: Record<string, any>;
//             mediaUrl?: string;
//             documentUrl?: string;
//             caption?: string;
//         };
//         metadata: {
//             sourceService: string;
//             sourceEntity: string;
//             sourceEntityId: string;
//             priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
//         };
//         userId: string;
//         timestamp: string;
//     };
// }

export interface WhatsAppSentEvent extends BaseEvent {
    subject: Subjects.WhatsAppMessageSent;
    data: {
        eventId: string;
        originalRequestId: string;
        recipientType: "CUSTOMER" | "PARTY" | "USER";
        recipientId: string;
        recipient: {
            phone: string;
            name: string;
            countryCode?: string;
        };
        message: {
            type: "TEXT" | "TEMPLATE" | "MEDIA" | "DOCUMENT" | "INTERACTIVE";
            content?: string;
            templateName?: string;
            actualContent?: string; // Final message content sent
            mediaUrl?: string;
            mediaType?: string;
        };
        result: {
            success: true;
            messageId: string;
            externalId?: string; // WhatsApp Business API message ID
            sentAt: string;
            deliveredAt?: string;
            readAt?: string;
            cost?: number;
            provider: string; // WhatsApp Business API, Twilio, etc.
            conversationId?: string; // WhatsApp conversation ID
            conversationType?: "BUSINESS_INITIATED" | "USER_INITIATED";
        };
        metadata: {
            sourceService: string;
            sourceEntity: string;
            sourceEntityId: string;
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        };
        userId: string;
        timestamp: string;
    };
}

export interface WhatsAppFailedEvent extends BaseEvent {
    subject: Subjects.WhatsAppMessageFailed;
    data: {
        eventId: string;
        originalRequestId: string;
        recipientType: "CUSTOMER" | "PARTY" | "USER";
        recipientId: string;
        recipient: {
            phone: string;
            name: string;
            countryCode?: string;
        };
        message: {
            type: "TEXT" | "TEMPLATE" | "MEDIA" | "DOCUMENT" | "INTERACTIVE";
            content?: string;
            templateName?: string;
        };
        error: {
            code: string; // INVALID_PHONE, TEMPLATE_NOT_APPROVED, RATE_LIMIT, etc.
            message: string;
            retryable: boolean;
            providerError?: string;
            templateStatus?: "PENDING" | "REJECTED" | "DISABLED";
        };
        metadata: {
            sourceService: string;
            sourceEntity: string;
            sourceEntityId: string;
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        };
        userId: string;
        timestamp: string;
    };
}

export interface DeliveryResult {
    success: boolean;
    messageId?: string;
    externalId?: string;
    errorCode?: string;
    errorMessage?: string;
    deliveredAt?: Date;
    cost?: number;
}

export interface EmailData {
    to: {
        email: string;
        name: string;
    };
    subject: string;
    htmlBody?: string;
    textBody?: string;
    attachments?: Array<{
        filename: string;
        content: string;
        contentType: string;
    }>;
}

export interface SMSData {
    to: string;
    message: string;
    unicode?: boolean;
}

export interface WhatsAppData {
    to: string;
    message?: string; // Make optional since templates might not have direct message
    type?: "TEXT" | "TEMPLATE" | "MEDIA" | "DOCUMENT" | "INTERACTIVE"; // Match exact case
    templateName?: string;
    templateData?: Record<string, any>;
    mediaUrl?: string;
    mediaType?: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT"; // Specific media types
    buttons?: Array<{
        type: "REPLY" | "URL" | "PHONE";
        title: string;
        payload?: string;
        url?: string;
        phoneNumber?: string;
    }>;
}

// export interface WhatsAppData {
//     to: string;
//     message: string;
//     type?: "text" | "template";
//     templateName?: string;
//     templateData?: Record<string, any>;
// }

export interface ProviderEmailResult {
    success: boolean;
    messageId?: string;
    externalId?: string;
    cost?: number;
    deliveredAt?: Date;
    errorMessage?: string;
    errorCode?: string;
}

export interface ProviderSMSResult {
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
}

export interface ProviderWhatsAppResult {
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
}

// In-App Notification Request (what services publish)
export interface SendInAppNotificationRequestEvent extends BaseEvent {
    subject: Subjects.SendInAppNotificationRequested;
    data: {
        eventId: string;
        recipientType: "CUSTOMER" | "PARTY" | "USER" | "INAPP";
        recipientId: string;
        recipient: {
            name: string;
            email?: string;
        };
        notification: {
            title: string;
            message: string;
            type?: string;
            priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
            deepLink?: string;
            imageUrl?: string;
        };
        metadata: {
            sourceService: string;
            sourceEntity: string;
            sourceEntityId: string;
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        };
        userId: string;
        timestamp: string;
    };
}

// In-App Notification Result
export interface InAppNotificationResult {
    success: boolean;
    notificationId?: string;
    createdAt?: Date;
    errorMessage?: string;
    errorCode?: string;
}
