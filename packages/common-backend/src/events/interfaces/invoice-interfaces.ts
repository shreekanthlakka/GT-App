// packages/common-backend/src/events/interfaces/invoiceInterfaces.ts

import { BaseEvent } from "./base-interfaces";
import { Subjects } from "@repo/common/subjects";

// ========================================
// INVOICE LIFECYCLE EVENTS
// ========================================

export interface InvoiceCreatedEvent extends BaseEvent {
    subject: Subjects.InvoiceCreated;
    data: {
        id: string;
        voucherId: string;
        invoiceNo: string;
        date: string;
        dueDate?: string;
        amount: number;
        paidAmount: number;
        remainingAmount?: number;
        status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
        description?: string | null;
        taxAmount?: number;
        discountAmount?: number;
        roundOffAmount?: number;
        notes?: string | null;
        partyId: string;
        partyName: string;
        partyGSTNo?: string | null;
        poNumber?: string | null;
        transportMode?: string | null;
        vehicleNo?: string | null;
        deliveryNote?: string | null;
        supplierRef?: string | null;
        otherRef?: string | null;
        buyersOrderNo?: string | null;
        dispatchedThrough?: string | null;
        destination?: string | null;
        createdBy: string;
        createdAt: string;
        userId: string;
    };
}

export interface InvoiceUpdatedEvent extends BaseEvent {
    subject: Subjects.InvoiceUpdated;
    data: {
        id: string;
        updatedAt: string;
        changes: Record<
            string,
            {
                oldValue: any;
                newValue: any;
            }
        >;
        updatedBy: string;
        partyId: string;
        statusChanged?: boolean;
        paymentUpdated?: boolean;
        dueDateChanged?: boolean;
        amountChanged?: boolean;
    };
}

export interface InvoiceDeletedEvent extends BaseEvent {
    subject: Subjects.InvoiceDeleted;
    data: {
        id: string;
        invoiceNo: string;
        partyId: string;
        partyName: string;
        amount: number;
        deletedAt: string;
        deletedBy: string;
        reason?: string;
        hadPayments?: boolean;
        refundRequired?: boolean;
        complianceImpact?: boolean;
    };
}

export interface InvoiceCancelledEvent extends BaseEvent {
    subject: Subjects.InvoiceCancelled;
    data: {
        id: string;
        invoiceNo: string;
        partyId: string;
        partyName: string;
        amount: number;
        cancelledAt: string;
        cancelledBy: string;
        reason:
            | "PARTY_REQUEST"
            | "GOODS_NOT_DELIVERED"
            | "BILLING_ERROR"
            | "BUSINESS_DECISION"
            | "DISPUTE"
            | "OTHER";
        refundAmount?: number;
        creditNoteRequired?: boolean;
        partyNotified?: boolean;
        complianceNotificationRequired?: boolean;
    };
}

export interface InvoiceVoidedEvent extends BaseEvent {
    subject: Subjects.InvoiceVoided;
    data: {
        id: string;
        invoiceNo: string;
        partyId: string;
        partyName: string;
        amount: number;
        voidedAt: string;
        voidedBy: string;
        reason:
            | "DUPLICATE"
            | "ERROR"
            | "FRAUDULENT"
            | "COMPLIANCE_ISSUE"
            | "OTHER";
        replacementInvoiceId?: string;
        auditTrailMaintained: boolean;
        complianceReported?: boolean;
    };
}

export interface InvoiceDraftCreatedEvent extends BaseEvent {
    subject: Subjects.InvoiceDraftCreated;
    data: {
        id: string;
        draftNo: string;
        partyId: string;
        partyName: string;
        estimatedAmount: number;
        createdBy: string;
        createdAt: string;
        validUntil?: string;
        notes?: string;
        autoConversionScheduled?: boolean;
    };
}

// ========================================
// INVOICE COMMUNICATION EVENTS
// ========================================

export interface InvoiceSentEvent extends BaseEvent {
    subject: Subjects.InvoiceSent;
    data: {
        id: string;
        invoiceNo: string;
        partyId: string;
        partyName: string;
        sentTo: {
            email?: string;
            phone?: string;
            contactPerson?: string;
        };
        sentVia: "EMAIL" | "WHATSAPP" | "POST" | "HAND_DELIVERY" | "COURIER";
        sentBy: string;
        sentAt: string;
        documentFormat: "PDF" | "PRINTED" | "BOTH";
        deliveryConfirmation?: boolean;
        trackingId?: string;
        estimatedDelivery?: string;
    };
}

export interface InvoiceViewedEvent extends BaseEvent {
    subject: Subjects.InvoiceViewed;
    data: {
        id: string;
        invoiceNo: string;
        partyId: string;
        partyName: string;
        viewedAt: string;
        viewedBy?: string;
        viewMethod:
            | "EMAIL_LINK"
            | "WHATSAPP_LINK"
            | "PORTAL_ACCESS"
            | "PRINTED_COPY";
        ipAddress?: string;
        deviceInfo?: string;
        viewDuration?: number; // seconds
        actionsAfterView?: "DOWNLOADED" | "PRINTED" | "FORWARDED" | "NONE";
    };
}

export interface InvoicePrintedEvent extends BaseEvent {
    subject: Subjects.InvoicePrinted;
    data: {
        id: string;
        invoiceNo: string;
        partyId: string;
        partyName: string;
        printedAt: string;
        printedBy: string;
        copies: number;
        printerName?: string;
        printType: "ORIGINAL" | "DUPLICATE" | "COPY" | "DRAFT";
        paperSize?: string;
        printQuality?: "DRAFT" | "NORMAL" | "HIGH";
    };
}

export interface InvoiceEmailedEvent extends BaseEvent {
    subject: Subjects.InvoiceEmailed;
    data: {
        id: string;
        invoiceNo: string;
        partyId: string;
        partyName: string;
        recipientEmail: string;
        emailSubject: string;
        sentAt: string;
        sentBy: string;
        deliveryStatus: "SENT" | "DELIVERED" | "OPENED" | "FAILED" | "BOUNCED";
        failureReason?: string;
        attachments: {
            fileName: string;
            fileSize: number;
            fileType: string;
        }[];
        trackingEnabled: boolean;
        reminderScheduled?: boolean;
    };
}

export interface InvoiceWhatsAppSentEvent extends BaseEvent {
    subject: Subjects.InvoiceWhatsAppSent;
    data: {
        id: string;
        invoiceNo: string;
        partyId: string;
        partyName: string;
        recipientPhone: string;
        messageId?: string;
        sentAt: string;
        sentBy: string;
        messageType: "TEXT" | "DOCUMENT" | "IMAGE" | "LINK";
        deliveryStatus: "SENT" | "DELIVERED" | "READ" | "FAILED";
        failureReason?: string;
        templateUsed?: string;
        mediaSize?: number;
    };
}

// ========================================
// INVOICE PAYMENT STATUS EVENTS
// ========================================

export interface InvoicePaidEvent extends BaseEvent {
    subject: Subjects.InvoicePaid;
    data: {
        invoiceId: string;
        invoiceNo: string;
        partyId: string;
        partyName: string;
        amount: number;
        paymentId: string;
        paymentMethod: string;
        paymentDate: string;
        paymentReference?: string | null;
        fullPayment: boolean;
        daysToPayment: number;
        onTimePayment: boolean;
        paidAt: string;
        receiptGenerated?: boolean;
        receiptNo?: string;
    };
}

export interface InvoicePartiallyPaidEvent extends BaseEvent {
    subject: Subjects.InvoicePartiallyPaid;
    data: {
        invoiceId: string;
        invoiceNo: string;
        partyId: string;
        partyName: string;
        totalAmount: number;
        paidAmount: number;
        remainingAmount: number;
        paymentPercentage: number;
        paymentId: string;
        paymentMethod: string;
        paymentDate: string;
        nextPaymentExpected?: string;
        installmentPlan?: {
            totalInstallments: number;
            completedInstallments: number;
            nextInstallmentAmount: number;
            nextInstallmentDate: string;
        };
    };
}

export interface InvoiceOverdueEvent extends BaseEvent {
    subject: Subjects.InvoiceOverdue;
    data: {
        id: string;
        invoiceNo: string;
        amount: number;
        remainingAmount: number;
        dueDate: string;
        daysPastDue: number;
        overdueCategory:
            | "1-7_DAYS"
            | "8-15_DAYS"
            | "16-30_DAYS"
            | "31-60_DAYS"
            | "60+_DAYS";
        partyId: string;
        partyName: string;
        partyPhone?: string;
        partyEmail?: string;
        remindersSent: number;
        lastReminderDate?: string;
        escalationLevel:
            | "FRIENDLY_REMINDER"
            | "FORMAL_NOTICE"
            | "FINAL_NOTICE"
            | "LEGAL_ACTION";
        interestApplicable?: boolean;
        penaltyAmount?: number;
        collectionAgencyInvolved?: boolean;
        legalActionThreatened?: boolean;
    };
}

export interface InvoiceDueSoonEvent extends BaseEvent {
    subject: Subjects.InvoiceDueSoon;
    data: {
        id: string;
        invoiceNo: string;
        amount: number;
        remainingAmount: number;
        dueDate: string;
        daysUntilDue: number;
        partyId: string;
        partyName: string;
        partyPhone?: string;
        partyEmail?: string;
        reminderType: "7_DAY" | "3_DAY" | "1_DAY" | "SAME_DAY";
        autoReminderSent: boolean;
        paymentMethodsAvailable: string[];
        earlyPaymentDiscountAvailable?: boolean;
        discountPercentage?: number;
    };
}

export interface InvoiceDueTodayEvent extends BaseEvent {
    subject: Subjects.InvoiceDueToday;
    data: {
        id: string;
        invoiceNo: string;
        amount: number;
        remainingAmount: number;
        dueDate: string;
        partyId: string;
        partyName: string;
        partyPhone?: string;
        partyEmail?: string;
        reminderSent: boolean;
        urgentFollowUpRequired: boolean;
        accountManagerNotified: boolean;
        penaltyStartsTomorrow?: boolean;
        penaltyRate?: number;
    };
}

export interface InvoicePaymentReceivedEvent extends BaseEvent {
    subject: Subjects.InvoicePaymentReceived;
    data: {
        invoiceId: string;
        invoiceNo: string;
        partyId: string;
        partyName: string;
        paymentAmount: number;
        paymentMethod: string;
        paymentReference?: string;
        receivedAt: string;
        allocationMethod: "AUTO" | "MANUAL";
        appliedAmount: number;
        unappliedAmount?: number;
        overpayment?: number;
        bankCharges?: number;
        netAmountReceived: number;
        reconciliationStatus: "MATCHED" | "PARTIAL_MATCH" | "UNMATCHED";
    };
}

// ========================================
// INVOICE ACTION EVENTS
// ========================================

export interface InvoiceReminderSentEvent extends BaseEvent {
    subject: Subjects.InvoiceReminderSent;
    data: {
        invoiceId: string;
        invoiceNo: string;
        partyId: string;
        partyName: string;
        reminderType:
            | "PAYMENT_DUE"
            | "OVERDUE_NOTICE"
            | "FINAL_NOTICE"
            | "COURTESY_REMINDER";
        reminderNumber: number;
        totalReminders: number;
        channel: "EMAIL" | "WHATSAPP" | "SMS" | "PHONE" | "POST";
        recipientContact: string;
        sentBy: string;
        sentAt: string;
        deliveryStatus: "SENT" | "DELIVERED" | "READ" | "FAILED";
        responseReceived?: boolean;
        responseType?:
            | "PAYMENT_PROMISE"
            | "DISPUTE"
            | "REQUEST_EXTENSION"
            | "ACKNOWLEDGMENT";
        nextReminderScheduled?: string;
        escalationTriggered?: boolean;
    };
}

export interface InvoiceFollowUpRequiredEvent extends BaseEvent {
    subject: Subjects.InvoiceFollowUpRequired;
    data: {
        invoiceId: string;
        invoiceNo: string;
        partyId: string;
        partyName: string;
        amount: number;
        remainingAmount: number;
        daysPastDue: number;
        followUpReason:
            | "NO_RESPONSE_TO_REMINDERS"
            | "PAYMENT_PROMISE_BROKEN"
            | "DISPUTE_RAISED"
            | "PARTIAL_PAYMENT_ISSUES";
        previousActions: string[];
        suggestedActions: string[];
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        assignedTo?: string;
        escalationLevel: number;
        customerRelationshipRisk: "LOW" | "MEDIUM" | "HIGH";
        businessImpact: "MINIMAL" | "MODERATE" | "SIGNIFICANT" | "CRITICAL";
    };
}

// export interface InvoiceDisputeRaisedEvent extends BaseEvent {
//     subject: Subjects.InvoiceDisputeRaised;
//     data: {
//         invoiceId: string;
//         invoiceNo: string;
//         partyId: string;
//         partyName: string;
//         disputeId: string;
//         disputeType:
//             | "BILLING_ERROR"
//             | "GOODS_NOT_RECEIVED"
//             | "QUALITY_ISSUE"
//             | "PRICING_DISPUTE"
//             | "DELIVERY_ISSUE"
//             | "OTHER";
//         disputeAmount: number;
//         totalInvoiceAmount: number;
//         description: string;
//         supportingDocuments?: string[];
//         raisedBy: string;
//         raisedAt: string;
//         urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
//         paymentOnHold: boolean;
//         resolutionSLA: string;
//         assignedInvestigator?: string;
//         initialResponse?: string;
//     };
// }

// ========================================
// INVOICE COMPLIANCE & REGULATORY EVENTS
// ========================================

export interface InvoiceGSTValidatedEvent extends BaseEvent {
    subject: Subjects.InvoiceGSTValidated;
    data: {
        invoiceId: string;
        invoiceNo: string;
        partyId: string;
        partyGSTNo: string;
        validationStatus: "VALID" | "INVALID" | "SUSPENDED" | "CANCELLED";
        validatedAt: string;
        validationSource:
            | "GOVERNMENT_PORTAL"
            | "THIRD_PARTY_API"
            | "MANUAL_VERIFICATION";
        gstDetails?: {
            businessName: string;
            registrationDate: string;
            status: string;
            taxpayerType: string;
        };
        complianceFlag?: boolean;
        actionRequired?: string[];
        riskLevel?: "LOW" | "MEDIUM" | "HIGH";
    };
}

// export interface InvoiceEWayBillGeneratedEvent extends BaseEvent {
//     subject: Subjects.InvoiceEWayBillGenerated;
//     data: {
//         invoiceId: string;
//         invoiceNo: string;
//         eWayBillNo: string;
//         partyId: string;
//         partyName: string;
//         vehicleNo?: string;
//         transporterId?: string;
//         transporterName?: string;
//         distance?: number;
//         validUpto: string;
//         generatedAt: string;
//         generatedBy: string;
//         consignmentValue: number;
//         goodsDescription: string;
//         fromPlace: string;
//         toPlace: string;
//         documentStatus: "ACTIVE" | "CANCELLED" | "EXPIRED";
//     };
// }

// export interface InvoiceEInvoiceGeneratedEvent extends BaseEvent {
//     subject: Subjects.InvoiceEInvoiceGenerated;
//     data: {
//         invoiceId: string;
//         invoiceNo: string;
//         eInvoiceReferenceNo: string;
//         irn: string; // Invoice Reference Number
//         ackNo: string;
//         ackDate: string;
//         partyId: string;
//         partyName: string;
//         partyGSTNo: string;
//         qrCode: string;
//         signedInvoice: string;
//         generatedAt: string;
//         generatedBy: string;
//         validityPeriod: string;
//         complianceStatus: "COMPLIANT" | "NON_COMPLIANT";
//         governmentPortalStatus: "SUCCESS" | "PENDING" | "FAILED";
//     };
// }

// ========================================
// INVOICE ANALYTICS & REPORTING EVENTS
// ========================================

export interface InvoiceAnalyticsGeneratedEvent extends BaseEvent {
    subject: Subjects.InvoiceAnalyticsGenerated;
    data: {
        analysisId: string;
        period: {
            startDate: string;
            endDate: string;
        };
        metrics: {
            totalInvoices: number;
            totalAmount: number;
            averageInvoiceValue: number;
            paymentRate: number; // percentage
            averagePaymentTime: number; // days
            overdueRate: number; // percentage
            disputeRate: number; // percentage
        };
        trends: {
            topParties: Array<{
                partyId: string;
                partyName: string;
                invoiceCount: number;
                totalAmount: number;
                paymentReliability: number;
            }>;
            paymentPatterns: {
                onTime: number;
                early: number;
                late: number;
                veryLate: number;
            };
            monthlyTrends: Array<{
                month: string;
                invoiceCount: number;
                amount: number;
                collectionEfficiency: number;
            }>;
        };
        insights: string[];
        recommendations: string[];
        generatedAt: string;
        generatedBy: string;
    };
}

// ========================================
// EXPORT ALL INVOICE EVENT TYPES
// ========================================

export type InvoiceEventTypes =
    | InvoiceCreatedEvent
    | InvoiceUpdatedEvent
    | InvoiceDeletedEvent
    | InvoiceCancelledEvent
    | InvoiceVoidedEvent
    | InvoiceDraftCreatedEvent
    | InvoiceSentEvent
    | InvoiceViewedEvent
    | InvoicePrintedEvent
    | InvoiceEmailedEvent
    | InvoiceWhatsAppSentEvent
    | InvoicePaidEvent
    | InvoicePartiallyPaidEvent
    | InvoiceOverdueEvent
    | InvoiceDueSoonEvent
    | InvoiceDueTodayEvent
    | InvoicePaymentReceivedEvent
    | InvoiceReminderSentEvent
    | InvoiceFollowUpRequiredEvent
    | InvoiceGSTValidatedEvent
    | InvoiceAnalyticsGeneratedEvent;
// | InvoiceDisputeRaisedEvent
// | InvoiceEWayBillGeneratedEvent
// | InvoiceEInvoiceGeneratedEvent
