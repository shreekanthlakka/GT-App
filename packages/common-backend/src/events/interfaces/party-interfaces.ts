// packages/common-backend/src/events/interfaces/partyInterfaces.ts

import { BaseEvent } from "./base-interfaces";
import { Subjects } from "@repo/common/subjects";

// ========================================
// PARTY LIFECYCLE EVENTS
// ========================================

export interface PartyCreatedEvent extends BaseEvent {
    subject: Subjects.PartyCreated;
    data: {
        id: string;
        name: string;
        gstNo?: string;
        panNo?: string;
        phone?: string;
        email?: string;
        address?: string;
        city?: string;
        state?: string;
        pincode?: string;
        contactPerson?: string;
        bankDetails?: {
            bankName?: string;
            accountNo?: string;
            ifsc?: string;
            branch?: string;
        };
        category?: string;
        paymentTerms?: number;
        creditLimit: number;
        taxId?: string;
        website?: string;
        notes?: string;
        createdBy: string;
        createdAt: string;
    };
}

export interface PartyUpdatedEvent extends BaseEvent {
    subject: Subjects.PartyUpdated;
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
        gstChanged?: boolean;
        contactChanged?: boolean;
        bankDetailsChanged?: boolean;
        creditLimitChanged?: boolean;
        categoryChanged?: boolean;
    };
}

export interface PartyDeletedEvent extends BaseEvent {
    subject: Subjects.PartyDeleted;
    data: {
        id: string;
        name: string;
        gstNo?: string;
        category?: string;
        deletedAt: string;
        deletedBy: string;
        hasOutstandingInvoices?: boolean;
        finalBalance?: number;
        reason?: string;
    };
}

export interface PartyActivatedEvent extends BaseEvent {
    subject: Subjects.PartyActivated;
    data: {
        id: string;
        name: string;
        activatedBy: string;
        activatedAt: string;
        reason?: string;
        previousStatus?: string;
    };
}

export interface PartyDeactivatedEvent extends BaseEvent {
    subject: Subjects.PartyDeactivated;
    data: {
        id: string;
        name: string;
        deactivatedBy: string;
        deactivatedAt: string;
        reason?: string;
        hasOutstandingInvoices?: boolean;
        outstandingAmount?: number;
    };
}

// ========================================
// PARTY CONTACT & INFORMATION EVENTS
// ========================================

export interface PartyContactUpdatedEvent extends BaseEvent {
    subject: Subjects.PartyContactUpdated;
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
            contactPerson?: {
                oldValue?: string;
                newValue?: string;
            };
        };
        updatedBy: string;
        updatedAt: string;
        notificationsSent?: string[];
    };
}

export interface PartyGSTUpdatedEvent extends BaseEvent {
    subject: Subjects.PartyGSTUpdated;
    data: {
        partyId: string;
        partyName: string;
        oldGSTNo?: string;
        newGSTNo?: string;
        gstStatus?: "ACTIVE" | "CANCELLED" | "SUSPENDED";
        updatedBy: string;
        updatedAt: string;
        verificationStatus?: "PENDING" | "VERIFIED" | "FAILED";
        complianceImpact?: boolean;
    };
}

export interface PartyBankDetailsUpdatedEvent extends BaseEvent {
    subject: Subjects.PartyBankDetailsUpdated;
    data: {
        partyId: string;
        partyName: string;
        bankDetailsChanges: {
            bankName?: {
                oldValue?: string;
                newValue?: string;
            };
            accountNo?: {
                oldValue?: string;
                newValue?: string;
            };
            ifsc?: {
                oldValue?: string;
                newValue?: string;
            };
            branch?: {
                oldValue?: string;
                newValue?: string;
            };
        };
        updatedBy: string;
        updatedAt: string;
        verificationRequired?: boolean;
        paymentMethodsAffected?: string[];
    };
}

export interface PartyPaymentTermsUpdatedEvent extends BaseEvent {
    subject: Subjects.PartyPaymentTermsUpdated;
    data: {
        partyId: string;
        partyName: string;
        oldPaymentTerms?: number;
        newPaymentTerms?: number;
        reason?: string;
        updatedBy: string;
        updatedAt: string;
        affectsExistingInvoices?: boolean;
        pendingInvoicesCount?: number;
    };
}

// ========================================
// PARTY BUSINESS RELATIONSHIP EVENTS
// ========================================

// export interface PartyPerformanceEvaluatedEvent extends BaseEvent {
//     subject: Subjects.PartyPerformanceEvaluated;
//     data: {
//         partyId: string;
//         partyName: string;
//         evaluationPeriod: {
//             startDate: string;
//             endDate: string;
//         };
//         metrics: {
//             totalInvoices: number;
//             totalAmount: number;
//             averageInvoiceValue: number;
//             paymentTimeliness: number; // percentage
//             qualityRating?: number; // 1-5 scale
//             deliveryPerformance?: number; // percentage
//             responseTime?: number; // hours
//         };
//         rating: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR" | "CRITICAL";
//         recommendations?: string[];
//         evaluatedBy: string;
//         evaluatedAt: string;
//         nextEvaluationDate?: string;
//     };
// }

// export interface PartyContractRenewedEvent extends BaseEvent {
//     subject: Subjects.PartyContractRenewed;
//     data: {
//         partyId: string;
//         partyName: string;
//         contractId: string;
//         contractType: "SUPPLY" | "SERVICE" | "EXCLUSIVE" | "GENERAL";
//         oldContractExpiry?: string;
//         newContractExpiry: string;
//         termsChanged?: boolean;
//         rateChanges?: {
//             item: string;
//             oldRate: number;
//             newRate: number;
//         }[];
//         renewedBy: string;
//         renewedAt: string;
//         autoRenewal?: boolean;
//     };
// }

// export interface PartyRiskAssessmentUpdatedEvent extends BaseEvent {
//     subject: Subjects.PartyRiskAssessmentUpdated;
//     data: {
//         partyId: string;
//         partyName: string;
//         oldRiskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
//         newRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
//         riskFactors: {
//             paymentHistory: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR";
//             financialStability: "STABLE" | "MODERATE" | "UNSTABLE";
//             marketReputation: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR";
//             businessContinuity: "SECURE" | "STABLE" | "UNCERTAIN" | "RISKY";
//         };
//         actions: string[];
//         assessedBy: string;
//         assessedAt: string;
//         nextAssessmentDate?: string;
//         creditLimitRecommendation?: number;
//     };
// }

// ========================================
// PARTY TRANSACTION RELATED EVENTS
// ========================================

// export interface PartyFirstTransactionEvent extends BaseEvent {
//     subject: Subjects.PartyFirstTransaction;
//     data: {
//         partyId: string;
//         partyName: string;
//         transactionType: "INVOICE" | "PAYMENT";
//         transactionId: string;
//         transactionNumber: string;
//         amount: number;
//         transactionDate: string;
//         onboardingCompleted: boolean;
//         relationshipManager?: string;
//         welcomePackageSent?: boolean;
//     };
// }

// export interface PartyLargeTransactionEvent extends BaseEvent {
//     subject: Subjects.PartyLargeTransaction;
//     data: {
//         partyId: string;
//         partyName: string;
//         transactionType: "INVOICE" | "PAYMENT";
//         transactionId: string;
//         transactionNumber: string;
//         amount: number;
//         threshold: number;
//         percentageAboveAverage: number;
//         transactionDate: string;
//         requiresApproval?: boolean;
//         approvedBy?: string;
//         flaggedForReview?: boolean;
//     };
// }

// export interface PartyPaymentDelayedEvent extends BaseEvent {
//     subject: Subjects.PartyPaymentDelayed;
//     data: {
//         partyId: string;
//         partyName: string;
//         invoiceId: string;
//         invoiceNumber: string;
//         invoiceAmount: number;
//         dueDate: string;
//         daysPastDue: number;
//         totalOutstanding: number;
//         paymentTerms: number;
//         remindersSent: number;
//         lastReminderDate?: string;
//         escalationLevel:
//             | "FIRST_NOTICE"
//             | "SECOND_NOTICE"
//             | "FINAL_NOTICE"
//             | "LEGAL_ACTION";
//         contactAttempts?: {
//             method: "EMAIL" | "PHONE" | "WHATSAPP" | "LETTER";
//             date: string;
//             success: boolean;
//         }[];
//     };
// }

// export interface PartyComplianceIssueEvent extends BaseEvent {
//     subject: Subjects.PartyComplianceIssue;
//     data: {
//         partyId: string;
//         partyName: string;
//         issueType:
//             | "GST_MISMATCH"
//             | "INVALID_PAN"
//             | "MISSING_DOCUMENTS"
//             | "REGULATORY_VIOLATION"
//             | "TAX_DEFAULT";
//         severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
//         description: string;
//         affectedTransactions?: {
//             transactionId: string;
//             transactionNumber: string;
//             amount: number;
//         }[];
//         detectAt: string;
//         actionRequired: string[];
//         deadline?: string;
//         regulatoryBody?: string;
//         penaltyRisk?: boolean;
//         estimatedPenalty?: number;
//     };
// }

// ========================================
// PARTY COMMUNICATION EVENTS
// ========================================

export interface PartyStatementSentEvent extends BaseEvent {
    subject: Subjects.PartyStatementSent;
    data: {
        partyId: string;
        partyName: string;
        statementPeriod: {
            startDate: string;
            endDate: string;
        };
        statementType: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "ON_DEMAND";
        totalTransactions: number;
        totalInvoiced: number;
        totalPaid: number;
        outstandingBalance: number;
        sentVia: "EMAIL" | "WHATSAPP" | "POST" | "HAND_DELIVERY";
        sentTo: string;
        sentBy: string;
        sentAt: string;
        deliveryConfirmed?: boolean;
        readConfirmed?: boolean;
    };
}

// export interface PartyNewsletterSentEvent extends BaseEvent {
//     subject: Subjects.PartyNewsletterSent;
//     data: {
//         partyId: string;
//         partyName: string;
//         newsletterType:
//             | "PRODUCT_UPDATES"
//             | "PRICE_CHANGES"
//             | "POLICY_UPDATES"
//             | "SEASONAL_OFFERS"
//             | "COMPANY_NEWS";
//         subject: string;
//         sentVia: "EMAIL" | "WHATSAPP" | "POST";
//         sentTo: string;
//         sentAt: string;
//         deliveryStatus: "SENT" | "DELIVERED" | "READ" | "FAILED";
//         engagementMetrics?: {
//             opened?: boolean;
//             clicked?: boolean;
//             replied?: boolean;
//         };
//     };
// }

// ========================================
// PARTY CATEGORY & CLASSIFICATION EVENTS
// ========================================

// export interface PartyCategoryChangedEvent extends BaseEvent {
//     subject: Subjects.PartyCategoryChanged;
//     data: {
//         partyId: string;
//         partyName: string;
//         oldCategory?: string;
//         newCategory: string;
//         reason: string;
//         changedBy: string;
//         changedAt: string;
//         impactOnTerms: {
//             paymentTermsChanged?: boolean;
//             creditLimitChanged?: boolean;
//             discountRatesChanged?: boolean;
//             priorityChanged?: boolean;
//         };
//         autoClassification?: boolean;
//         classificationCriteria?: {
//             annualVolume?: number;
//             transactionFrequency?: number;
//             paymentReliability?: number;
//         };
//     };
// }

// export interface PartyTierUpgradedEvent extends BaseEvent {
//     subject: Subjects.PartyTierUpgraded;
//     data: {
//         partyId: string;
//         partyName: string;
//         oldTier?: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
//         newTier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
//         upgradeCriteria: {
//             annualVolume?: number;
//             relationshipPeriod?: number;
//             paymentRecord?: number;
//             exclusiveDeals?: number;
//         };
//         benefits: string[];
//         upgradedAt: string;
//         notificationSent?: boolean;
//         celebrationRequired?: boolean;
//     };
// }

// ========================================
// PARTY SEASONAL & BUSINESS EVENTS
// ========================================

// export interface PartySeasonalOrderEvent extends BaseEvent {
//     subject: Subjects.PartySeasonalOrder;
//     data: {
//         partyId: string;
//         partyName: string;
//         season: "SUMMER" | "WINTER" | "MONSOON" | "FESTIVAL" | "WEDDING";
//         orderType:
//             | "ADVANCE_BOOKING"
//             | "SEASONAL_STOCK"
//             | "FESTIVAL_SPECIAL"
//             | "BULK_ORDER";
//         orderValue: number;
//         expectedDeliveryPeriod: {
//             startDate: string;
//             endDate: string;
//         };
//         specialTerms?: {
//             advancePayment?: number;
//             seasonalDiscount?: number;
//             earlyBirdBonus?: number;
//         };
//         products: {
//             category: string;
//             quantity: number;
//             estimatedValue: number;
//         }[];
//         orderDate: string;
//         expectedCompletion: string;
//     };
// }

// export interface PartyExclusiveDealEvent extends BaseEvent {
//     subject: Subjects.PartyExclusiveDeal;
//     data: {
//         partyId: string;
//         partyName: string;
//         dealType:
//             | "EXCLUSIVE_PRODUCT"
//             | "TERRITORY_EXCLUSIVE"
//             | "VOLUME_COMMITMENT"
//             | "SEASONAL_EXCLUSIVE";
//         dealValue: number;
//         exclusivityPeriod: {
//             startDate: string;
//             endDate: string;
//         };
//         terms: {
//             minimumVolume?: number;
//             exclusiveTerritory?: string[];
//             exclusiveProducts?: string[];
//             specialPricing?: boolean;
//             marketingSupport?: boolean;
//         };
//         dealManager: string;
//         approvedBy: string;
//         signedAt: string;
//         complianceRequirements?: string[];
//     };
// }

// ========================================
// EXPORT ALL PARTY EVENT TYPES
// ========================================

export type PartyEventTypes =
    | PartyCreatedEvent
    | PartyUpdatedEvent
    | PartyDeletedEvent
    | PartyActivatedEvent
    | PartyDeactivatedEvent
    | PartyContactUpdatedEvent
    | PartyGSTUpdatedEvent
    | PartyBankDetailsUpdatedEvent
    | PartyPaymentTermsUpdatedEvent
    // | PartyPerformanceEvaluatedEvent
    // | PartyContractRenewedEvent
    // | PartyRiskAssessmentUpdatedEvent
    // | PartyFirstTransactionEvent
    // | PartyLargeTransactionEvent
    // | PartyPaymentDelayedEvent
    // | PartyComplianceIssueEvent
    | PartyStatementSentEvent;
// | PartyNewsletterSentEvent
// | PartyCategoryChangedEvent
// | PartyTierUpgradedEvent
// | PartySeasonalOrderEvent
// | PartyExclusiveDealEvent;
