// packages/common-backend/src/events/interfaces/customerInterfaces.ts

import { BaseEvent } from "./base-interfaces";
import { Subjects } from "@repo/common/subjects";

// ========================================
// CUSTOMER LIFECYCLE EVENTS
// ========================================

export interface CustomerCreatedEvent extends BaseEvent {
    subject: Subjects.CustomerCreated;
    data: {
        id: string;
        name: string;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
        city?: string | null;
        state?: string | null;
        pincode?: string | null;
        gstNumber?: string | null;
        creditLimit: number;
        dateOfBirth?: string | null;
        anniversary?: string | null;
        preferredContact?: string | null;
        tags: string[];
        notes?: string | null;
        createdBy: string;
        createdAt: string;
        userId: string;
    };
}

export interface CustomerUpdatedEvent extends BaseEvent {
    subject: Subjects.CustomerUpdated;
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
        nameChanged?: boolean;
        contactChanged?: boolean;
        creditLimitChanged?: boolean;
        addressChanged?: boolean;
        tagsChanged?: boolean;
        preferencesChanged?: boolean;
    };
}

export interface CustomerDeletedEvent extends BaseEvent {
    subject: Subjects.CustomerDeleted;
    data: {
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
        deletedAt: string;
        deletedBy: string;
        hasOutstandingBalance?: boolean;
        finalBalance?: number;
        reason?: string;
    };
}

export interface CustomerActivatedEvent extends BaseEvent {
    subject: Subjects.CustomerActivated;
    data: {
        id: string;
        name: string;
        activatedBy: string;
        activatedAt: string;
        reason?: string;
        previousStatus?: string;
    };
}

export interface CustomerDeactivatedEvent extends BaseEvent {
    subject: Subjects.CustomerDeactivated;
    data: {
        id: string;
        name: string;
        deactivatedBy: string;
        deactivatedAt: string;
        reason?: string;
        hasOutstandingBalance?: boolean;
        outstandingAmount?: number;
    };
}

// ========================================
// CUSTOMER CONTACT EVENTS
// ========================================

export interface CustomerContactUpdatedEvent extends BaseEvent {
    subject: Subjects.CustomerContactUpdated;
    data: {
        id: string;
        name: string;
        contactChanges: {
            phone?: {
                oldValue?: string;
                newValue?: string;
            };
            email?: {
                oldValue?: string;
                newValue?: string;
            };
            address?: {
                oldValue?: string;
                newValue?: string;
            };
        };
        updatedBy: string;
        updatedAt: string;
        notificationsSent?: string[]; // channels where update notifications were sent
    };
}

// ========================================
// CUSTOMER CREDIT EVENTS
// ========================================

export interface CustomerCreditLimitUpdatedEvent extends BaseEvent {
    subject: Subjects.CustomerCreditLimitUpdated;
    data: {
        customerId: string;
        customerName: string;
        oldLimit: number;
        newLimit: number;
        changeAmount: number;
        changePercentage: number;
        reason: string;
        approvedBy?: string;
        updatedBy: string;
        updatedAt: string;
        currentBalance?: number;
        availableCredit?: number;
    };
}

export interface CustomerCreditLimitExceededEvent extends BaseEvent {
    subject: Subjects.CustomerCreditLimitExceeded;
    data: {
        customerId: string;
        customerName: string;
        creditLimit: number;
        currentBalance: number;
        excessAmount: number;
        transactionId?: string;
        transactionType?: "SALE" | "INVOICE" | "ADJUSTMENT";
        transactionAmount?: number;
        detectedAt: string;
        alertLevel: "WARNING" | "CRITICAL";
        actionTaken?: "BLOCKED" | "ALLOWED_WITH_APPROVAL" | "REQUIRES_REVIEW";
    };
}

export interface CustomerCreditLimitWarningEvent extends BaseEvent {
    subject: Subjects.CustomerCreditLimitWarning;
    data: {
        customerId: string;
        customerName: string;
        creditLimit: number;
        currentBalance: number;
        utilizationPercentage: number;
        warningThreshold: number;
        remainingCredit: number;
        warningLevel: "75%" | "90%" | "95%";
        detectedAt: string;
        recommendedAction?: string;
    };
}

// ========================================
// CUSTOMER LIFECYCLE MILESTONES
// ========================================

export interface CustomerFirstVisitEvent extends BaseEvent {
    subject: Subjects.CustomerFirstVisit;
    data: {
        customerId: string;
        customerName: string;
        visitDate: string;
        visitType: "PHYSICAL" | "ONLINE" | "PHONE";
        source?: string;
        referredBy?: string;
        initialInterest?: string[];
        staffAssigned?: string;
        welcomeMessageSent?: boolean;
    };
}

// export interface CustomerBecameVIPEvent extends BaseEvent {
//     subject: Subjects.CustomerBecameVIP;
//     data: {
//         customerId: string;
//         customerName: string;
//         totalPurchases: number;
//         totalAmount: number;
//         averageOrderValue: number;
//         memberSince: string;
//         promotedAt: string;
//         promotionCriteria: {
//             totalSpent?: number;
//             totalOrders?: number;
//             averageOrderValue?: number;
//             loyaltyPeriod?: number;
//         };
//         vipBenefits: string[];
//         notificationSent?: boolean;
//     };
// }

// export interface CustomerReturnVisitEvent extends BaseEvent {
//     subject: Subjects.CustomerReturnVisit;
//     data: {
//         customerId: string;
//         customerName: string;
//         visitDate: string;
//         visitNumber: number;
//         daysSinceLastVisit: number;
//         visitType: "PHYSICAL" | "ONLINE" | "PHONE";
//         purchaseMade?: boolean;
//         purchaseAmount?: number;
//         engagementLevel: "HIGH" | "MEDIUM" | "LOW";
//     };
// }

// export interface CustomerLongTimeNoVisitEvent extends BaseEvent {
//     subject: Subjects.CustomerLongTimeNoVisit;
//     data: {
//         customerId: string;
//         customerName: string;
//         lastVisitDate: string;
//         daysSinceLastVisit: number;
//         lastPurchaseDate?: string;
//         daysSinceLastPurchase?: number;
//         totalLifetimeValue: number;
//         riskLevel: "LOW" | "MEDIUM" | "HIGH";
//         recommendedAction:
//             | "REMINDER"
//             | "SPECIAL_OFFER"
//             | "PERSONAL_CALL"
//             | "WIN_BACK_CAMPAIGN";
//         detectedAt: string;
//     };
// }

// ========================================
// CUSTOMER LOYALTY EVENTS
// ========================================

export interface CustomerLoyaltyPointsEarnedEvent extends BaseEvent {
    subject: Subjects.CustomerLoyaltyPointsEarned;
    data: {
        customerId: string;
        customerName: string;
        pointsEarned: number;
        totalPoints: number;
        earnedFrom:
            | "PURCHASE"
            | "REFERRAL"
            | "BONUS"
            | "BIRTHDAY"
            | "ANNIVERSARY"
            | "REVIEW";
        referenceId?: string;
        referenceType?: "SALE" | "INVOICE" | "REFERRAL";
        multiplier?: number;
        campaignId?: string;
        earnedAt: string;
        expiryDate?: string;
    };
}

export interface CustomerLoyaltyPointsRedeemedEvent extends BaseEvent {
    subject: Subjects.CustomerLoyaltyPointsRedeemed;
    data: {
        customerId: string;
        customerName: string;
        pointsRedeemed: number;
        remainingPoints: number;
        redeemValue: number;
        redemptionType: "DISCOUNT" | "CASHBACK" | "GIFT" | "SERVICE";
        saleId?: string;
        discountAmount?: number;
        redeemedAt: string;
        staffProcessed?: string;
    };
}

// export interface CustomerReferralMadeEvent extends BaseEvent {
//     subject: Subjects.CustomerReferralMade;
//     data: {
//         referrerCustomerId: string;
//         referrerName: string;
//         referredCustomerId: string;
//         referredName: string;
//         referralCode?: string;
//         referralChannel:
//             | "WORD_OF_MOUTH"
//             | "SOCIAL_MEDIA"
//             | "EMAIL"
//             | "WHATSAPP"
//             | "OTHER";
//         referralDate: string;
//         referredCustomerFirstPurchase?: boolean;
//         referralRewardEarned?: number;
//         referralStatus: "PENDING" | "QUALIFIED" | "REWARDED";
//     };
// }

// // ========================================
// // CUSTOMER BEHAVIOR EVENTS
// // ========================================

// export interface CustomerPreferenceUpdatedEvent extends BaseEvent {
//     subject: Subjects.CustomerPreferenceUpdated;
//     data: {
//         customerId: string;
//         customerName: string;
//         preferenceType:
//             | "FABRIC"
//             | "COLOR"
//             | "STYLE"
//             | "PRICE_RANGE"
//             | "BRAND"
//             | "COMMUNICATION";
//         preferences: {
//             fabrics?: string[];
//             colors?: string[];
//             styles?: string[];
//             priceRange?: {
//                 min: number;
//                 max: number;
//             };
//             brands?: string[];
//             communicationChannel?: "EMAIL" | "WHATSAPP" | "SMS" | "PHONE";
//             frequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "SPECIAL_EVENTS";
//         };
//         updatedBy?: string;
//         updatedAt: string;
//         source:
//             | "CUSTOMER_REQUEST"
//             | "PURCHASE_BEHAVIOR"
//             | "SURVEY"
//             | "STAFF_OBSERVATION";
//     };
// }

// export interface CustomerComplaintReceivedEvent extends BaseEvent {
//     subject: Subjects.CustomerComplaintReceived;
//     data: {
//         customerId: string;
//         customerName: string;
//         complaintId: string;
//         complaintType:
//             | "PRODUCT_QUALITY"
//             | "SERVICE"
//             | "BILLING"
//             | "DELIVERY"
//             | "STAFF_BEHAVIOR"
//             | "OTHER";
//         severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
//         description: string;
//         relatedTransaction?: {
//             type: "SALE" | "INVOICE";
//             id: string;
//             number: string;
//             date: string;
//         };
//         channel: "PHONE" | "EMAIL" | "WHATSAPP" | "IN_PERSON" | "SOCIAL_MEDIA";
//         receivedBy: string;
//         receivedAt: string;
//         status:
//             | "NEW"
//             | "ACKNOWLEDGED"
//             | "INVESTIGATING"
//             | "RESOLVED"
//             | "CLOSED";
//         priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
//     };
// }

// export interface CustomerFeedbackReceivedEvent extends BaseEvent {
//     subject: Subjects.CustomerFeedbackReceived;
//     data: {
//         customerId: string;
//         customerName: string;
//         feedbackId: string;
//         feedbackType:
//             | "PRODUCT_REVIEW"
//             | "SERVICE_RATING"
//             | "SUGGESTION"
//             | "TESTIMONIAL"
//             | "GENERAL";
//         rating?: number; // 1-5 scale
//         feedback: string;
//         relatedTransaction?: {
//             type: "SALE" | "INVOICE";
//             id: string;
//             number: string;
//         };
//         channel: "EMAIL" | "WHATSAPP" | "PHONE" | "IN_PERSON" | "ONLINE_FORM";
//         isPositive: boolean;
//         tags?: string[];
//         receivedAt: string;
//         requiresResponse?: boolean;
//         publicReview?: boolean;
//     };
// }

// ========================================
// EXPORT ALL CUSTOMER EVENT TYPES
// ========================================

export type CustomerEventTypes =
    | CustomerCreatedEvent
    | CustomerUpdatedEvent
    | CustomerDeletedEvent
    | CustomerActivatedEvent
    | CustomerDeactivatedEvent
    | CustomerContactUpdatedEvent
    | CustomerCreditLimitUpdatedEvent
    | CustomerCreditLimitExceededEvent
    | CustomerCreditLimitWarningEvent
    | CustomerFirstVisitEvent
    // | CustomerBecameVIPEvent
    // | CustomerReturnVisitEvent
    // | CustomerLongTimeNoVisitEvent
    | CustomerLoyaltyPointsEarnedEvent
    | CustomerLoyaltyPointsRedeemedEvent;
// | CustomerReferralMadeEvent
// | CustomerPreferenceUpdatedEvent
// | CustomerComplaintReceivedEvent
// | CustomerFeedbackReceivedEvent;
