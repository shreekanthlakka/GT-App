// packages/common-backend/src/events/interfaces/index.ts

// Export base interfaces
export * from "./base-interfaces";

// Export domain-specific interfaces
export * from "./user-interfaces";
export * from "./customer-interfaces";
export * from "./party-interfaces";
export * from "./sale-interfaces";
export * from "./invoice-interfaces";
export * from "./invoicePayment-interfaces";
export * from "./system-interfaces";
export * from "./ocr-interfaces";
export * from "./inventoryItem-interfaces";
export * from "./order-interfaces";
export * from "./ecomm-interfaces";
export * from "./notification-interfaces";
export * from "./service-results-interfaces";
export * from "./sale-receipt-interface";
// Additional domain interfaces (to be created)
// TODO here
// export * from "./ledgerInterfaces";
// export * from "./notificationInterfaces";
// export * from "./ocrInterfaces";
// export * from "./receiptInterfaces";
// export * from "./textileInterfaces";
// export * from "./reportInterfaces";

// Import all event types for union type
import type { UserEventTypes } from "./user-interfaces";
import type { CustomerEventTypes } from "./customer-interfaces";
import type { PartyEventTypes } from "./party-interfaces";
import type { SaleEventTypes } from "./sale-interfaces";
import type { InvoiceEventTypes } from "./invoice-interfaces";
import type { InvoicePaymentEventTypes } from "./invoicePayment-interfaces";
import type { SystemEventTypes } from "./system-interfaces";

// Master union type of all events
export type AllEventTypes =
    | UserEventTypes
    | CustomerEventTypes
    | PartyEventTypes
    | SaleEventTypes
    | InvoiceEventTypes
    | InvoicePaymentEventTypes
    | SystemEventTypes;

// Event type mapping for type-safe event handling
export interface EventTypeMap {
    // User events
    "user:created": UserEventTypes;
    "user:updated": UserEventTypes;
    "user:deleted": UserEventTypes;
    "user:logged-in": UserEventTypes;
    "user:logged-out": UserEventTypes;

    // Customer events
    "customer:created": CustomerEventTypes;
    "customer:updated": CustomerEventTypes;
    "customer:deleted": CustomerEventTypes;
    "customer:credit-limit-exceeded": CustomerEventTypes;
    "customer:became-vip": CustomerEventTypes;

    // Party events
    "party:created": PartyEventTypes;
    "party:updated": PartyEventTypes;
    "party:deleted": PartyEventTypes;
    "party:gst-updated": PartyEventTypes;

    // Sale events
    "sale:created": SaleEventTypes;
    "sale:updated": SaleEventTypes;
    "sale:paid": SaleEventTypes;
    "sale:overdue": SaleEventTypes;
    "sale:returned": SaleEventTypes;

    // Invoice events
    "invoice:created": InvoiceEventTypes;
    "invoice:updated": InvoiceEventTypes;
    "invoice:paid": InvoiceEventTypes;
    "invoice:overdue": InvoiceEventTypes;
    "invoice:emailed": InvoiceEventTypes;

    // Payment events
    "InvoicePayment:created": InvoicePaymentEventTypes;
    "invoicePayment:received": InvoicePaymentEventTypes;
    "invoicePayment:failed": InvoicePaymentEventTypes;
    "invoicePayment:reconciled": InvoicePaymentEventTypes;

    // System events
    "system:started": SystemEventTypes;
    "system:shutdown": SystemEventTypes;
    "data:backup-completed": SystemEventTypes;
    "audit:log-created": SystemEventTypes;
}

// Event category groupings for better organization
export const EventCategories = {
    AUTHENTICATION: [
        "user:created",
        "user:logged-in",
        "user:logged-out",
        "session:created",
        "session:expired",
    ],

    BUSINESS_CORE: [
        "customer:created",
        "party:created",
        "sale:created",
        "invoice:created",
        "payment:received",
    ],

    FINANCIAL: [
        "payment:received",
        "payment:failed",
        "invoice:paid",
        "sale:paid",
        "ledger:entry-created",
    ],

    CUSTOMER_LIFECYCLE: [
        "customer:first-visit",
        "customer:became-vip",
        "customer:long-time-no-visit",
        "customer:loyalty-points-earned",
    ],

    ALERTS: [
        "customer:credit-limit-exceeded",
        "invoice:overdue",
        "sale:overdue",
        "payment:failed",
        "stock:low",
    ],

    COMMUNICATION: [
        "whatsapp:message-sent",
        "email:sent",
        "payment:reminder-sent",
        "notification:sent",
    ],

    SYSTEM_OPERATIONS: [
        "system:started",
        "system:shutdown",
        "data:backup-completed",
        "system:health-check",
    ],

    COMPLIANCE: [
        "audit:log-created",
        "compliance:check-performed",
        "security:scan-performed",
        "data:integrity-check",
    ],

    DOCUMENT_PROCESSING: [
        "document:uploaded",
        "ocr:job-completed",
        "invoice:auto-created-from-ocr",
    ],

    INVENTORY: [
        "product:created",
        "stock:added",
        "stock:low",
        "inventory:count-completed",
    ],

    TEXTILE_SPECIFIC: [
        "fabric:received",
        "fabric:quality-checked",
        "festival:season-started",
        "saree:stock-received",
    ],
} as const;

// Priority levels for event processing
export const EventPriorities = {
    CRITICAL: [
        "system:shutdown",
        "data:backup-failed",
        "payment:fraud-detected",
        "security:suspicious-activity",
    ],

    HIGH: [
        "payment:failed",
        "invoice:overdue",
        "customer:credit-limit-exceeded",
        "stock:out",
    ],

    MEDIUM: [
        "customer:created",
        "sale:created",
        "invoice:created",
        "payment:received",
    ],

    LOW: [
        "user:logged-in",
        "dashboard:viewed",
        "report:generated",
        "email:opened",
    ],
} as const;

// Event routing configuration for Kafka topics
export const EventRouting = {
    "user-events": [
        "user:created",
        "user:updated",
        "user:deleted",
        "user:role-changed",
    ],

    "auth-events": [
        "user:logged-in",
        "user:logged-out",
        "session:created",
        "session:expired",
    ],

    "customer-events": [
        "customer:created",
        "customer:updated",
        "customer:deleted",
        "customer:contact-updated",
    ],

    "party-events": [
        "party:created",
        "party:updated",
        "party:deleted",
        "party:gst-updated",
    ],

    "sale-events": [
        "sale:created",
        "sale:updated",
        "sale:cancelled",
        "sale:completed",
    ],

    "invoice-events": [
        "invoice:created",
        "invoice:updated",
        "invoice:sent",
        "invoice:viewed",
    ],

    "payment-events": [
        "payment:created",
        "payment:received",
        "payment:processed",
        "payment:reconciled",
        "sale:paid",
        "invoice:paid",
    ],

    "alert-events": [
        "customer:credit-limit-exceeded",
        "invoice:overdue",
        "sale:overdue",
        "payment:failed",
        "stock:low",
        "stock:out",
    ],

    "notification-events": [
        "whatsapp:message-sent",
        "email:sent",
        "sms:message-sent",
        "payment:reminder-sent",
    ],

    "ledger-events": [
        "ledger:entry-created",
        "ledger:balance-updated",
        "opening:balance-set",
        "ledger:out-of-balance",
    ],

    "system-events": [
        "system:started",
        "system:shutdown",
        "system:health-check",
        "system:maintenance-started",
    ],

    "backup-events": [
        "data:backup-started",
        "data:backup-completed",
        "data:backup-failed",
        "data:restore-started",
    ],

    "audit-events": [
        "audit:log-created",
        "compliance:check-performed",
        "security:scan-performed",
    ],

    "security-events": [
        "suspicious:activity-detected",
        "user:login-failed",
        "user:account-locked",
        "payment:fraud-detected",
    ],

    "business-events": [
        "business:profile-updated",
        "settings:updated",
        "festival:season-started",
        "customer:became-vip",
    ],

    "inventory-events": [
        "product:created",
        "stock:added",
        "stock:reduced",
        "stock:low",
        "inventory:count-completed",
    ],

    "ocr-events": [
        "document:uploaded",
        "ocr:job-created",
        "ocr:job-completed",
        "invoice:auto-created-from-ocr",
    ],

    "analytics-events": [
        "sales:trend-analyzed",
        "kpi:calculated",
        "customer:segmentation-updated",
        "report:generated",
    ],
} as const;

// Helper functions for event handling
export function getEventCategory(eventSubject: string): string | undefined {
    for (const [category, events] of Object.entries(EventCategories) as [
        string,
        readonly string[],
    ][]) {
        if (events.includes(eventSubject)) {
            return category;
        }
    }
    return undefined;
}

export function getEventPriority(eventSubject: string): string | undefined {
    for (const [priority, events] of Object.entries(EventPriorities) as [
        string,
        readonly string[],
    ][]) {
        if (events.includes(eventSubject)) {
            return priority;
        }
    }
    return "MEDIUM"; // Default priority
}

export function getEventTopic(eventSubject: string): string | undefined {
    for (const [topic, events] of Object.entries(EventRouting) as [
        string,
        readonly string[],
    ][]) {
        if (events.includes(eventSubject as any)) {
            return topic;
        }
    }
    return "general-events"; // Default topic
}

// Type guards for event types
export function isUserEvent(event: AllEventTypes): event is UserEventTypes {
    return (
        event.subject.startsWith("user:") ||
        event.subject.startsWith("session:") ||
        event.subject.startsWith("security:")
    );
}

export function isCustomerEvent(
    event: AllEventTypes
): event is CustomerEventTypes {
    return event.subject.startsWith("customer:");
}

export function isPartyEvent(event: AllEventTypes): event is PartyEventTypes {
    return event.subject.startsWith("party:");
}

export function isSaleEvent(event: AllEventTypes): event is SaleEventTypes {
    return event.subject.startsWith("sale:");
}

export function isInvoiceEvent(
    event: AllEventTypes
): event is InvoiceEventTypes {
    return event.subject.startsWith("invoice:");
}

export function isPaymentEvent(
    event: AllEventTypes
): event is InvoicePaymentEventTypes {
    return (
        event.subject.startsWith("payment:") ||
        event.subject.includes(":payment:") ||
        event.subject.endsWith(":paid")
    );
}

export function isSystemEvent(event: AllEventTypes): event is SystemEventTypes {
    return (
        event.subject.startsWith("system:") ||
        event.subject.startsWith("data:") ||
        event.subject.startsWith("audit:") ||
        event.subject.startsWith("config:")
    );
}

// Event validation helpers
export function validateEventStructure<T extends AllEventTypes>(
    event: any,
    expectedSubject: T["subject"]
): event is T {
    return (
        event &&
        typeof event === "object" &&
        event.subject === expectedSubject &&
        event.data &&
        typeof event.data === "object"
    );
}

// Event metrics and monitoring
export interface EventMetrics {
    eventCount: number;
    averageProcessingTime: number;
    errorRate: number;
    lastProcessedAt?: string;
    topEventTypes: Array<{
        subject: string;
        count: number;
        percentage: number;
    }>;
}

export function createEventMetrics(): EventMetrics {
    return {
        eventCount: 0,
        averageProcessingTime: 0,
        errorRate: 0,
        topEventTypes: [],
    };
}
