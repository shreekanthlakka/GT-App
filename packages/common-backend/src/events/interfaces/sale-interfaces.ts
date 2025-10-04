// packages/common-backend/src/events/interfaces/saleInterfaces.ts

import { BaseEvent } from "./base-interfaces";
import { Subjects } from "@repo/common/subjects";

// ========================================
// SALE LIFECYCLE EVENTS
// ========================================

export interface SaleCreatedEvent extends BaseEvent {
    subject: Subjects.SaleCreated;
    data: {
        id: string;
        voucherId: string;
        saleNo: string;
        date: string;
        amount: number;
        paidAmount: number;
        remainingAmount: number;
        status:
            | "PENDING"
            | "PARTIALLY_PAID"
            | "PAID"
            | "OVERDUE"
            | "CANCELLED"
            | "RETURNED";
        itemCount?: number;
        totalQuantity?: number;
        items?: Array<{
            name: string;
            type?: string;
            design?: string;
            color?: string;
            price: number;
            quantity: number;
            total: number;
            hsnCode?: string;
            productId?: string;
        }>;
        taxAmount?: number;
        discountAmount?: number;
        roundOffAmount?: number;
        notes?: string;
        customerId: string;
        customerName: string;
        salesPerson?: string | null;
        deliveryDate?: string;
        deliveryAddress?: string;
        transportation?: string;
        vehicleNo?: string;
        createdBy?: string;
        createdAt: string;
    };
}

export interface SaleUpdatedEvent extends BaseEvent {
    subject: Subjects.SaleUpdated;
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
        customerId: string;
        statusChanged?: boolean;
        paymentUpdated?: boolean;
        itemsModified?: boolean;
        deliveryUpdated?: boolean;
    };
}

export interface SaleDeletedEvent extends BaseEvent {
    subject: Subjects.SaleDeleted;
    data: {
        id: string;
        saleNo: string;
        customerId: string;
        customerName: string;
        amount: number;
        deletedAt: string;
        deletedBy: string;
        reason?: string;
        hadPayments?: boolean;
        refundRequired?: boolean;
        inventoryRestored?: boolean;
    };
}

export interface SaleCancelledEvent extends BaseEvent {
    subject: Subjects.SaleCancelled;
    data: {
        id: string;
        saleNo: string;
        customerId: string;
        customerName: string;
        amount: number;
        cancelledAt: string;
        cancelledBy: string;
        reason:
            | "CUSTOMER_REQUEST"
            | "STOCK_UNAVAILABLE"
            | "PAYMENT_FAILED"
            | "BUSINESS_DECISION"
            | "OTHER";
        refundAmount?: number;
        restockRequired: boolean;
        customerNotified?: boolean;
    };
}

export interface SaleCompletedEvent extends BaseEvent {
    subject: Subjects.SaleCompleted;
    data: {
        id: string;
        saleNo: string;
        customerId: string;
        customerName: string;
        amount: number;
        finalPaymentDate: string;
        totalDaysToComplete: number;
        deliveryStatus: "PENDING" | "DELIVERED" | "PICKUP";
        completedAt: string;
        customerSatisfactionRating?: number;
        completionMethod:
            | "FULL_PAYMENT"
            | "INSTALLMENT_COMPLETE"
            | "CREDIT_APPROVED";
    };
}

// ========================================
// SALE PAYMENT EVENTS
// ========================================

export interface SalePaidEvent extends BaseEvent {
    subject: Subjects.SalePaid;
    data: {
        saleId: string;
        saleNo: string;
        customerId: string;
        customerName: string;
        amount: number;
        paymentId: string;
        paymentMethod: string;
        paymentDate: string;
        isFullPayment: boolean;
        remainingAmount?: number;
        receiptGenerated: boolean;
        receiptNumber?: string;
        paidAt: string;
    };
}

export interface SalePartiallyPaidEvent extends BaseEvent {
    subject: Subjects.SalePartiallyPaid;
    data: {
        saleId: string;
        saleNo: string;
        customerId: string;
        customerName: string;
        totalAmount: number;
        paidAmount: number;
        remainingAmount: number;
        paymentPercentage: number;
        paymentId: string;
        paymentMethod: string;
        paymentDate: string;
        nextPaymentDue?: string;
        installmentPlan?: {
            totalInstallments: number;
            completedInstallments: number;
            nextAmount: number;
            nextDueDate: string;
        };
    };
}

export interface SaleCreditSaleEvent extends BaseEvent {
    subject: Subjects.SaleCreditSale;
    data: {
        saleId: string;
        saleNo: string;
        customerId: string;
        customerName: string;
        amount: number;
        creditTerms: number; // days
        dueDate: string;
        currentCreditUtilization: number;
        creditLimit: number;
        availableCredit: number;
        approvedBy?: string;
        riskLevel: "LOW" | "MEDIUM" | "HIGH";
        autoApproved: boolean;
        reminderScheduled?: boolean;
    };
}

export interface SaleCashSaleEvent extends BaseEvent {
    subject: Subjects.SaleCashSale;
    data: {
        saleId: string;
        saleNo: string;
        customerId: string;
        customerName: string;
        amount: number;
        cashReceived: number;
        changeGiven: number;
        paymentMethod: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";
        receiptPrinted: boolean;
        receiptNumber: string;
        cashierName: string;
        transactionTime: string;
    };
}

export interface SaleOverdueEvent extends BaseEvent {
    subject: Subjects.SaleOverdue;
    data: {
        saleId: string;
        saleNo: string;
        customerId: string;
        customerName: string;
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
        remindersSent: number;
        lastReminderDate?: string;
        customerPhone?: string;
        customerEmail?: string;
        escalationLevel:
            | "FRIENDLY_REMINDER"
            | "FORMAL_NOTICE"
            | "FINAL_NOTICE"
            | "COLLECTION";
        actionRequired: string[];
    };
}

// ========================================
// SALE RETURN & EXCHANGE EVENTS
// ========================================

export interface SaleReturnedEvent extends BaseEvent {
    subject: Subjects.SaleReturned;
    data: {
        originalSaleId: string;
        originalSaleNo: string;
        returnId: string;
        returnNo: string;
        customerId: string;
        customerName: string;
        returnType: "FULL_RETURN" | "PARTIAL_RETURN";
        returnAmount: number;
        returnedItems: Array<{
            name: string;
            quantity: number;
            returnPrice: number;
            reason:
                | "DEFECTIVE"
                | "WRONG_SIZE"
                | "COLOR_MISMATCH"
                | "CUSTOMER_CHANGE_OF_MIND"
                | "QUALITY_ISSUE";
            condition: "NEW" | "USED" | "DAMAGED";
            restockable: boolean;
        }>;
        totalReturnValue: number;
        refundMethod: "CASH" | "BANK_TRANSFER" | "STORE_CREDIT" | "EXCHANGE";
        refundAmount: number;
        restockingFee?: number;
        returnedAt: string;
        processedBy: string;
        customerSatisfaction?: "SATISFIED" | "NEUTRAL" | "DISSATISFIED";
    };
}

export interface SalePartiallyReturnedEvent extends BaseEvent {
    subject: Subjects.SalePartiallyReturned;
    data: {
        originalSaleId: string;
        originalSaleNo: string;
        returnId: string;
        customerId: string;
        customerName: string;
        returnedItems: Array<{
            name: string;
            quantity: number;
            returnPrice: number;
            reason: string;
        }>;
        returnValue: number;
        remainingSaleValue: number;
        refundMethod: string;
        refundAmount: number;
        returnedAt: string;
        processedBy: string;
    };
}

export interface SaleExchangedEvent extends BaseEvent {
    subject: Subjects.SaleExchanged;
    data: {
        originalSaleId: string;
        originalSaleNo: string;
        exchangeId: string;
        exchangeNo: string;
        customerId: string;
        customerName: string;
        exchangedItems: Array<{
            originalItem: {
                name: string;
                quantity: number;
                price: number;
            };
            newItem: {
                name: string;
                quantity: number;
                price: number;
            };
            priceDifference: number;
        }>;
        totalPriceDifference: number;
        additionalPayment?: number;
        refundAmount?: number;
        exchangeReason:
            | "SIZE_CHANGE"
            | "COLOR_CHANGE"
            | "STYLE_PREFERENCE"
            | "DEFECT_REPLACEMENT";
        exchangedAt: string;
        processedBy: string;
        customerSatisfaction?: "SATISFIED" | "NEUTRAL" | "DISSATISFIED";
    };
}

// ========================================
// SALE RECEIPT & COMMUNICATION EVENTS
// ========================================

export interface SaleReceiptPrintedEvent extends BaseEvent {
    subject: Subjects.SaleReceiptPrinted;
    data: {
        saleId: string;
        saleNo: string;
        receiptNo: string;
        customerId: string;
        customerName: string;
        printedAt: string;
        printedBy: string;
        printerName?: string;
        copies: number;
        receiptType:
            | "ORIGINAL"
            | "DUPLICATE"
            | "CUSTOMER_COPY"
            | "MERCHANT_COPY";
    };
}

export interface SaleReceiptEmailedEvent extends BaseEvent {
    subject: Subjects.SaleReceiptEmailed;
    data: {
        saleId: string;
        saleNo: string;
        receiptNo: string;
        customerId: string;
        customerName: string;
        customerEmail: string;
        emailSubject: string;
        sentAt: string;
        sentBy: string;
        deliveryStatus: "SENT" | "DELIVERED" | "OPENED" | "FAILED";
        failureReason?: string;
        attachmentSize?: number;
    };
}

export interface SaleReceiptWhatsAppSentEvent extends BaseEvent {
    subject: Subjects.SaleReceiptWhatsAppSent;
    data: {
        saleId: string;
        saleNo: string;
        receiptNo: string;
        customerId: string;
        customerName: string;
        customerPhone: string;
        messageId?: string;
        sentAt: string;
        sentBy: string;
        deliveryStatus: "SENT" | "DELIVERED" | "READ" | "FAILED";
        failureReason?: string;
        messageType: "TEXT" | "PDF" | "IMAGE";
    };
}

// ========================================
// SALE ANALYTICS & BUSINESS EVENTS
// ========================================

export interface SaleTrendAnalyzedEvent extends BaseEvent {
    subject: Subjects.SaleTrendAnalyzed;
    data: {
        analysisId: string;
        period: {
            startDate: string;
            endDate: string;
        };
        trendType: "DAILY" | "WEEKLY" | "MONTHLY" | "SEASONAL";
        metrics: {
            totalSales: number;
            totalAmount: number;
            averageOrderValue: number;
            growthPercentage: number;
            comparisonPeriod: string;
        };
        trends: {
            topSellingProducts: Array<{
                productName: string;
                quantitySold: number;
                revenue: number;
            }>;
            topCustomers: Array<{
                customerId: string;
                customerName: string;
                totalPurchases: number;
                totalAmount: number;
            }>;
            salesByCategory: Array<{
                category: string;
                count: number;
                amount: number;
                percentage: number;
            }>;
        };
        insights: string[];
        analyzedAt: string;
        analyzedBy: string;
    };
}

// export interface SaleTargetEvent extends BaseEvent {
//     subject: Subjects.SaleTargetAchieved | Subjects.SaleTargetMissed;
//     data: {
//         targetId: string;
//         targetType: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
//         period: {
//             startDate: string;
//             endDate: string;
//         };
//         targetAmount: number;
//         actualAmount: number;
//         achievementPercentage: number;
//         variance: number;
//         salesPerson?: string;
//         team?: string;
//         department?: string;
//         evaluatedAt: string;
//         bonusEarned?: number;
//         recognitionGiven?: string;
//         improvementAreas?: string[];
//     };
// }

// ========================================
// SALE LOGISTICS & DELIVERY EVENTS
// ========================================

// export interface SaleDeliveryScheduledEvent extends BaseEvent {
//     subject: Subjects.SaleDeliveryScheduled;
//     data: {
//         saleId: string;
//         saleNo: string;
//         customerId: string;
//         customerName: string;
//         deliveryAddress: {
//             street: string;
//             city: string;
//             state: string;
//             pincode: string;
//             landmark?: string;
//         };
//         scheduledDate: string;
//         timeSlot?: string;
//         deliveryMethod:
//             | "SELF_PICKUP"
//             | "HOME_DELIVERY"
//             | "COURIER"
//             | "LOGISTICS_PARTNER";
//         deliveryCharges?: number;
//         specialInstructions?: string;
//         contactPerson?: string;
//         contactPhone?: string;
//         scheduledBy: string;
//         scheduledAt: string;
//     };
// }

// export interface SaleDeliveredEvent extends BaseEvent {
//     subject: Subjects.SaleDelivered;
//     data: {
//         saleId: string;
//         saleNo: string;
//         customerId: string;
//         customerName: string;
//         deliveredAt: string;
//         deliveredBy: string;
//         deliveryMethod: string;
//         receivedBy?: string;
//         deliveryStatus:
//             | "DELIVERED"
//             | "PARTIALLY_DELIVERED"
//             | "FAILED_DELIVERY"
//             | "RETURNED_TO_SENDER";
//         deliveryProof?: {
//             signature?: boolean;
//             photo?: boolean;
//             otp?: boolean;
//         };
//         customerFeedback?: {
//             rating: number;
//             comments?: string;
//         };
//         deliveryTime?: number; // minutes from scheduled time
//         issues?: string[];
//     };
// }

// ========================================
// EXPORT ALL SALE EVENT TYPES
// ========================================

export type SaleEventTypes =
    | SaleCreatedEvent
    | SaleUpdatedEvent
    | SaleDeletedEvent
    | SaleCancelledEvent
    | SaleCompletedEvent
    | SalePaidEvent
    | SalePartiallyPaidEvent
    | SaleCreditSaleEvent
    | SaleCashSaleEvent
    | SaleOverdueEvent
    | SaleReturnedEvent
    | SalePartiallyReturnedEvent
    | SaleExchangedEvent
    | SaleReceiptPrintedEvent
    | SaleReceiptEmailedEvent
    | SaleReceiptWhatsAppSentEvent
    | SaleTrendAnalyzedEvent;
// | SaleTargetEvent
// | SaleDeliveryScheduledEvent
// | SaleDeliveredEvent;
