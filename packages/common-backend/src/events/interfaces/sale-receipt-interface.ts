import { Subjects } from "@repo/common/subjects";
import { BaseEvent } from "./base-interfaces";

export interface SaleReceiptCreatedEvent extends BaseEvent {
    subject: Subjects.SaleReceiptCreated;
    data: {
        id: string;
        voucherId: string;
        receiptNo: string;
        customerId: string;
        customerName: string;
        customerPhone?: string | null;
        customerEmail?: string | null;
        saleId?: string | null;
        saleNo?: string | null;
        date: string; // ISO string
        amount: number;
        method: string; // CASH, UPI, BANK_TRANSFER, CHEQUE, etc.
        reference?: string | null;
        bankName?: string | null;
        chequeNo?: string | null;
        userId: string;
        createdBy: string;
        createdAt: string;
        paymentType: "SALE_PAYMENT" | "ADVANCE_PAYMENT";
        businessMetrics: {
            collectionEfficiency?: number;
            paymentMethod: string;
            hasImageProof: boolean;
        };
    };
}

export interface SaleReceiptUpdatedEvent extends BaseEvent {
    subject: Subjects.SaleReceiptUpdated;
    data: {
        id: string;
        voucherId: string;
        receiptNo: string;
        updatedAt: string;
        changes: Record<string, { oldValue: any; newValue: any }>;
        updatedBy: string;
        amountChanged: boolean;
        amountDifference?: number;
        customerName: string;
        currentAmount: number;
        saleNo?: string;
        clearanceStatusChanged: boolean;
    };
}

export interface SaleReceiptDeletedEvent extends BaseEvent {
    subject: Subjects.SaleReceiptDeleted;
    data: {
        id: string;
        voucherId: string;
        receiptNo: string;
        customerId: string;
        customerName: string;
        saleId?: string;
        saleNo?: string;
        amount: number;
        method: string;
        deletedAt: string;
        deletedBy: string;
        reason: string;
        wasCleared: boolean;
    };
}

// export interface SaleReceiptChequeBouncedEvent extends BaseEvent {
//     subject: Subjects.SaleReceiptChequeBounced;
//     data: {
//         id: string;
//         voucherId: string;
//         receiptNo: string;
//         customerId: string;
//         customerName: string;
//         customerPhone?: string;
//         chequeNo: string;
//         amount: number;
//         chequeDate: string;
//         bounceDate: string;
//         bounceReason: string;
//         bankCharges: number;
//         userId: string;
//         requiresAction: boolean;
//         bouncePenalty?: number;
//     };
// }
