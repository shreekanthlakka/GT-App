export interface EmailResult {
    success: boolean;
    messageId?: string;
    externalId?: string;
    cost?: number;
    errorMessage?: string;
    errorCode?: string;
    deliveredAt?: Date;
}

export interface SMSResult {
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

export interface WhatsAppResult {
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
