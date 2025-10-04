// packages/common-backend/src/events/interfaces/invoicePaymentInterfaces.ts

import { BaseEvent } from "./base-interfaces";
import { Subjects } from "@repo/common/subjects";

// ========================================
// INVOICE PAYMENT LIFECYCLE EVENTS
// ========================================

export interface InvoicePaymentCreatedEvent extends BaseEvent {
    subject: Subjects.InvoicePaymentCreated;
    data: {
        id: string;
        voucherId: string;
        amount: number;
        date: string;
        method:
            | "CASH"
            | "BANK_TRANSFER"
            | "CHEQUE"
            | "UPI"
            | "CARD"
            | "ONLINE"
            | "OTHER";
        status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED";
        reference?: string;
        description?: string;

        // Relations
        partyId: string;
        partyName: string;
        invoiceId?: string;
        invoiceNumber?: string;

        // Payment allocation details
        appliedToInvoices?: Array<{
            invoiceId: string;
            invoiceNumber: string;
            amountApplied: number;
            remainingAmount: number;
        }>;

        // Advanced payment handling
        unappliedAmount?: number;
        prepayment?: boolean;

        // Method-specific details stored as discriminated union
        methodDetails:
            | {
                  method: "CASH";
                  denomination?: {
                      notes: Record<string, number>;
                      coins: Record<string, number>;
                  };
                  totalCounted: number;
                  variance?: number;
                  cashierName?: string;
                  registerNumber?: string;
                  securityLevel: "NORMAL" | "HIGH_VALUE" | "SUSPICIOUS";
              }
            | {
                  method: "UPI";
                  upiTransactionId: string;
                  upiReference: string;
                  payerVPA: string;
                  payeeVPA: string;
                  upiApp?: string;
                  bankReferenceNo?: string;
                  instantSettlement: boolean;
              }
            | {
                  method: "BANK_TRANSFER";
                  bankReference: string;
                  transferMode: "NEFT" | "RTGS" | "IMPS" | "WIRE_TRANSFER";
                  payerBankName: string;
                  payeeBankName: string;
                  ifscCode: string;
                  transferDate: string;
                  valueDate: string;
                  charges?: number;
                  narration?: string;
              }
            | {
                  method: "CHEQUE";
                  chequeNo: string;
                  chequeDate: string;
                  bankName: string;
                  branchName?: string;
                  ifscCode?: string;
                  clearanceStatus:
                      | "ISSUED"
                      | "HANDED_OVER"
                      | "DEPOSITED"
                      | "IN_CLEARING"
                      | "CLEARED"
                      | "BOUNCED";
                  postDated: boolean;
                  micr?: string;
              }
            | {
                  method: "CARD";
                  cardType: "CREDIT" | "DEBIT" | "PREPAID";
                  cardScheme:
                      | "VISA"
                      | "MASTERCARD"
                      | "RUPAY"
                      | "AMEX"
                      | "OTHER";
                  maskedCardNo: string;
                  authCode?: string;
                  rrn?: string;
                  emvChip: boolean;
                  contactless: boolean;
                  mdr?: number;
              }
            | {
                  method: "ONLINE";
                  gatewayName: string;
                  gatewayOrderId?: string;
                  gatewayPaymentId?: string;
                  transactionId?: string;
                  processingFees?: number;
              }
            | {
                  method: "OTHER";
                  description: string;
                  additionalDetails?: Record<string, any>;
              };

        createdBy: string;
        createdAt: string;
    };
}

export interface InvoicePaymentUpdatedEvent extends BaseEvent {
    subject: Subjects.InvoicePaymentUpdated;
    data: {
        id: string;
        voucherId: string;
        updatedAt: string;
        changes: Record<
            string,
            {
                oldValue: any;
                newValue: any;
            }
        >;
        updatedBy: string;

        // Specific change flags for event handling
        statusChanged?: boolean;
        amountChanged?: boolean;
        methodChanged?: boolean;
        allocationChanged?: boolean; // Invoice allocation changed
        bankDetailsChanged?: boolean;

        // Additional context
        reason?: string; // Reason for update
        autoUpdated?: boolean; // System vs manual update
    };
}

export interface InvoicePaymentDeletedEvent extends BaseEvent {
    subject: Subjects.InvoicePaymentDeleted;
    data: {
        id: string;
        voucherId: string;
        amount: number;
        method: string;
        date: string;
        partyId: string;
        partyName: string;
        invoiceId?: string;
        invoiceNumber?: string;

        deletedAt: string;
        deletedBy: string;
        reason?: string;

        // Impact assessment
        ledgerAdjustmentRequired: boolean;
        invoiceStatusReverted?: boolean; // If invoice status needs to revert
        outstandingAmountIncreased?: number;

        // Backup data for potential restore
        backupData: any;
    };
}

export interface InvoicePaymentVoidedEvent extends BaseEvent {
    subject: Subjects.InvoicePaymentVoided;
    data: {
        id: string;
        voucherId: string;
        amount: number;
        originalStatus: string;
        voidedAt: string;
        voidedBy: string;
        reason:
            | "DUPLICATE"
            | "ERROR"
            | "FRAUDULENT"
            | "DISPUTE"
            | "BANK_REVERSAL"
            | "CANCELLED_ORDER"
            | "SUPPLIER_REQUEST"
            | "OTHER";

        // Reversal details
        reversalPaymentId?: string;
        bankCharges?: number;
        netReversalAmount?: number;

        // Impact on related entities
        invoiceStatusReverted?: boolean;
        partyLedgerAdjusted?: boolean;

        // Compliance and audit
        auditTrailMaintained: boolean;
        approvalRequired?: boolean;
        approvedBy?: string;
    };
}

// ========================================
// INVOICE PAYMENT PROCESSING EVENTS
// ========================================

export interface InvoicePaymentProcessedEvent extends BaseEvent {
    subject: Subjects.InvoicePaymentProcessed;
    data: {
        id: string;
        voucherId: string;
        amount: number;
        method: string;
        processingStatus: "INITIATED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

        // Gateway processing details
        gatewayOrderId?: string;
        gatewayPaymentId?: string;
        gatewayTransactionId?: string;
        gatewayStatus?: string;
        processingTime?: number; // milliseconds
        gatewayCharges?: number;
        netAmount: number;

        processedAt: string;

        // Gateway response details
        gatewayResponse?: {
            code: string;
            message: string;
            additionalInfo?: any;
        };

        // Next action required
        nextAction?:
            | "NONE"
            | "MANUAL_VERIFICATION"
            | "RETRY"
            | "CONTACT_GATEWAY"
            | "UPDATE_INVOICE_STATUS";

        // Relations
        partyId: string;
        invoiceId?: string;
    };
}

export interface InvoicePaymentFailedEvent extends BaseEvent {
    subject: Subjects.InvoicePaymentFailed;
    data: {
        paymentId: string;
        voucherId: string;
        amount: number;
        method: string;
        reason:
            | "INSUFFICIENT_FUNDS"
            | "INVALID_ACCOUNT"
            | "NETWORK_ERROR"
            | "GATEWAY_ERROR"
            | "BANK_REJECTION"
            | "FRAUD_DETECTED"
            | "LIMIT_EXCEEDED"
            | "CHEQUE_BOUNCED"
            | "SIGNATURE_MISMATCH"
            | "OTHER";

        failureCode?: string;
        failureMessage: string;

        // Entity details
        partyId: string;
        partyName: string;
        invoiceId?: string;
        invoiceNumber?: string;

        // Gateway details for online payments
        gatewayOrderId?: string;
        gatewayResponse?: any;

        // Retry mechanism
        attemptNumber: number;
        maxRetries: number;
        canRetry: boolean;

        suggestedAction:
            | "RETRY"
            | "CHANGE_METHOD"
            | "CONTACT_BANK"
            | "MANUAL_PAYMENT"
            | "CONTACT_SUPPLIER";

        failedAt: string;

        // Communication
        supplierNotified: boolean;
        internalTeamNotified: boolean;
        alternativeMethodsAvailable?: string[];
    };
}

export interface InvoicePaymentPendingEvent extends BaseEvent {
    subject: Subjects.InvoicePaymentPending;
    data: {
        id: string;
        voucherId: string;
        amount: number;
        method: string;
        pendingReason:
            | "BANK_PROCESSING"
            | "GATEWAY_DELAY"
            | "MANUAL_VERIFICATION"
            | "COMPLIANCE_CHECK"
            | "CHEQUE_CLEARANCE"
            | "SUPPLIER_CONFIRMATION";

        estimatedCompletionTime?: string;
        maxWaitTime?: string;

        // Entity relations
        partyId: string;
        partyName: string;
        invoiceId?: string;
        invoiceNumber?: string;

        pendingSince: string;
        monitoringRequired: boolean;
        escalationLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH";
        statusCheckInterval?: number; // minutes

        // Communication status
        supplierNotified: boolean;
        lastStatusUpdate?: string;
    };
}

export interface InvoicePaymentConfirmedEvent extends BaseEvent {
    subject: Subjects.InvoicePaymentConfirmed;
    data: {
        id: string;
        voucherId: string;
        amount: number;
        method: string;
        confirmationSource:
            | "GATEWAY"
            | "BANK_STATEMENT"
            | "MANUAL_VERIFICATION"
            | "SUPPLIER_ACKNOWLEDGMENT"
            | "CHEQUE_CLEARANCE";

        confirmationReference: string;
        confirmedAt: string;
        confirmedBy?: string;

        // Final amounts after charges
        finalAmount: number;
        bankCharges?: number;
        processingFees?: number;

        // Timing details
        timeTakenToConfirm: number; // hours
        autoConfirmed: boolean;
        confidenceLevel: "HIGH" | "MEDIUM" | "LOW";

        // Relations
        partyId: string;
        invoiceId?: string;

        // Post-confirmation actions
        invoiceStatusUpdated: boolean;
        ledgerEntryCreated: boolean;
        supplierNotified: boolean;

        additionalVerificationRequired?: boolean;
    };
}

export interface InvoicePaymentReconciledEvent extends BaseEvent {
    subject: Subjects.InvoicePaymentReconciled;
    data: {
        id: string;
        voucherId: string;
        amount: number;

        // Bank statement matching
        bankStatementEntry: {
            date: string;
            amount: number;
            reference: string;
            description: string;
            transactionId?: string;
        };

        matchType:
            | "EXACT_MATCH"
            | "AMOUNT_MATCH"
            | "REFERENCE_MATCH"
            | "MANUAL_MATCH"
            | "PARTIAL_MATCH";

        matchConfidence: number; // percentage 0-100
        variance?: number;
        varianceReason?: string;

        reconciledAt: string;
        reconciledBy: string;
        autoReconciled: boolean;

        // Reconciliation rules applied
        reconciliationRules?: string[];
        exceptions?: string[];

        // Relations
        partyId: string;
        invoiceId?: string;

        // Post-reconciliation status
        discrepancyResolved: boolean;
        adjustmentRequired?: boolean;
        adjustmentAmount?: number;
    };
}

export interface InvoicePaymentRefundedEvent extends BaseEvent {
    subject: Subjects.InvoicePaymentRefunded;
    data: {
        originalPaymentId: string;
        refundId: string;
        originalVoucherId: string;
        refundVoucherId: string;

        originalAmount: number;
        refundAmount: number;

        refundReason:
            | "OVERPAYMENT"
            | "CANCELLED_INVOICE"
            | "SUPPLIER_CREDIT"
            | "DUPLICATE_PAYMENT"
            | "BUSINESS_ERROR"
            | "QUALITY_ISSUE"
            | "RETURN_OF_GOODS"
            | "SETTLEMENT_ADJUSTMENT"
            | "OTHER";

        refundMethod:
            | "ORIGINAL_SOURCE"
            | "BANK_TRANSFER"
            | "CASH"
            | "ADJUSTMENT_NOTE"
            | "CREDIT_NOTE"
            | "OTHER";

        refundReference?: string;
        processingFee?: number;
        netRefundAmount: number;

        // Parties involved
        partyId: string;
        partyName: string;
        invoiceId?: string;
        invoiceNumber?: string;

        // Approval workflow
        initiatedBy: string;
        approvedBy?: string;
        approvalRequired: boolean;

        processedAt: string;
        estimatedSettlement?: string;
        refundStatus: "INITIATED" | "PROCESSING" | "COMPLETED" | "FAILED";

        // Impact on related entities
        invoiceStatusUpdated?: boolean;
        ledgerAdjustmentMade?: boolean;
        partyBalanceUpdated?: boolean;
    };
}

// ========================================
// PAYMENT METHOD SPECIFIC STATUS EVENTS
// ========================================
// These events track status changes specific to payment methods
// that occur after the initial payment creation

export interface ChequeStatusUpdatedEvent extends BaseEvent {
    subject: Subjects.ChequeStatusUpdated;
    data: {
        paymentId: string;
        voucherId: string;
        chequeNo: string;
        oldStatus: string;
        newStatus:
            | "ISSUED"
            | "HANDED_OVER"
            | "DEPOSITED"
            | "IN_CLEARING"
            | "CLEARED"
            | "BOUNCED"
            | "CANCELLED";
        statusDate: string;

        // Bounce specific details
        bounceReason?: string;
        bounceCharges?: number;

        // Clearance details
        clearanceDate?: string;
        bankReference?: string;

        partyId: string;
        partyName: string;
        invoiceId?: string;

        updatedBy: string;
        updatedAt: string;
    };
}

export interface BankTransferStatusUpdatedEvent extends BaseEvent {
    subject: Subjects.BankTransferStatusUpdated;
    data: {
        paymentId: string;
        voucherId: string;
        bankReference: string;
        oldStatus: string;
        newStatus:
            | "INITIATED"
            | "IN_TRANSIT"
            | "SETTLED"
            | "FAILED"
            | "RETURNED";
        statusDate: string;

        // Settlement details
        actualSettlementDate?: string;
        settlementReference?: string;

        // Failure details
        failureReason?: string;
        returnReason?: string;

        partyId: string;
        partyName: string;

        updatedAt: string;
    };
}

// ========================================
// INVOICE PAYMENT ALLOCATION EVENTS
// ========================================

export interface InvoicePaymentAllocatedEvent extends BaseEvent {
    subject: Subjects.InvoicePaymentAllocated;
    data: {
        paymentId: string;
        voucherId: string;
        totalAmount: number;

        // Allocation details
        allocations: Array<{
            invoiceId: string;
            invoiceNumber: string;
            invoiceDueDate: string;
            invoiceAmount: number;
            previousPaidAmount: number;
            allocationAmount: number;
            newPaidAmount: number;
            remainingAmount: number;
            fullyPaid: boolean;
        }>;

        totalAllocated: number;
        unappliedAmount: number;

        // Party information
        partyId: string;
        partyName: string;

        allocatedBy: string;
        allocatedAt: string;

        // Auto allocation details
        autoAllocated: boolean;
        allocationRules?: string[]; // FIFO, specific invoice, etc.

        // Impact summary
        invoicesFullyPaid: number;
        invoicesPartiallyPaid: number;
        overdueReduced: number;

        notes?: string;
    };
}

// ========================================
// INVOICE PAYMENT ANALYTICS EVENTS
// ========================================

export interface InvoicePaymentTrendAnalyzedEvent extends BaseEvent {
    subject: Subjects.InvoicePaymentTrendAnalyzed;
    data: {
        analysisId: string;
        period: {
            startDate: string;
            endDate: string;
        };

        // Overall metrics
        metrics: {
            totalPaymentsMade: number;
            totalAmountPaid: number;
            averagePaymentAmount: number;
            averagePaymentTime: number; // days from invoice to payment

            // Payment method breakdown
            paymentMethodDistribution: {
                cash: number;
                upi: number;
                bankTransfer: number;
                cheque: number;
                card: number;
                other: number;
            };

            // Timeliness metrics
            earlyPaymentRate: number; // percentage
            onTimePaymentRate: number;
            latePaymentRate: number;
            averageDaysEarly: number;
            averageDaysLate: number;

            // Efficiency metrics
            paymentFailureRate: number;
            averageProcessingTime: number; // hours
            reconciliationRate: number;
        };

        // Trends analysis
        trends: {
            dailyVolume: Array<{
                date: string;
                count: number;
                amount: number;
            }>;

            methodPreferences: Array<{
                method: string;
                percentage: number;
                growth: number; // month-over-month growth
            }>;

            supplierPaymentPatterns: Array<{
                partyId: string;
                partyName: string;
                averagePaymentTime: number;
                preferredMethod: string;
                totalPaid: number;
                paymentFrequency: number;
            }>;
        };

        // Insights and recommendations
        insights: string[];
        recommendations: string[];
        cashFlowOptimization: string[];

        analyzedAt: string;
        analyzedBy: string;

        // Context
        businessMetrics: {
            totalPurchases: number;
            averageCreditPeriod: number;
            cashFlowImpact: number;
            workingCapitalDays: number;
        };
    };
}

// ========================================
// EXPORT ALL INVOICE PAYMENT EVENT TYPES
// ========================================

export type InvoicePaymentEventTypes =
    | InvoicePaymentCreatedEvent
    | InvoicePaymentUpdatedEvent
    | InvoicePaymentDeletedEvent
    | InvoicePaymentVoidedEvent
    | InvoicePaymentProcessedEvent
    | InvoicePaymentFailedEvent
    | InvoicePaymentPendingEvent
    | InvoicePaymentConfirmedEvent
    | InvoicePaymentReconciledEvent
    | InvoicePaymentRefundedEvent
    | ChequeStatusUpdatedEvent
    | BankTransferStatusUpdatedEvent
    | InvoicePaymentAllocatedEvent
    | InvoicePaymentTrendAnalyzedEvent;
