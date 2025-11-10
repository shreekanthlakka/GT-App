// apps/accounts-web/src/features/invoice-payments/api/invoice-payments.api.ts

import { invoicePaymentService as apiClient } from "@/shared/utils/api-client";
import type {
    CreateInvoicePaymentType,
    UpdateInvoicePaymentType,
    InvoicePaymentQueryType,
} from "@repo/common/schemas";

import {
    InvoicePayment,
    PaginatedResponse,
    PaymentSummary,
} from "@repo/common/types";

// export interface Party {
//     id: string;
//     name: string;
//     email?: string | null;
//     phone?: string | null;
// }

// export interface Invoice {
//     id: string;
//     invoiceNo: string;
//     amount: number;
//     remainingAmount: number;
// }

// export interface InvoicePayment {
//     id: string;
//     voucherId: string;
//     amount: number;
//     date: string;
//     method:
//         | "CASH"
//         | "BANK_TRANSFER"
//         | "CHEQUE"
//         | "UPI"
//         | "CARD"
//         | "ONLINE"
//         | "OTHER";
//     reference?: string | null;
//     description?: string | null;
//     status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

//     // Gateway fields
//     gatewayOrderId?: string | null;
//     gatewayPaymentId?: string | null;
//     transactionId?: string | null;
//     failureReason?: string | null;

//     // Banking details
//     bankName?: string | null;
//     chequeNo?: string | null;
//     chequeDate?: string | null;
//     clearanceDate?: string | null;
//     charges?: number | null;

//     // Relations
//     partyId: string;
//     party: Party;
//     invoiceId?: string | null;
//     invoice?: Invoice | null;

//     userId: string;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface PaymentSummary {
//     period: {
//         startDate: string;
//         endDate: string;
//     };
//     overview: {
//         totalPayments: number;
//         totalCharges: number;
//         paymentCount: number;
//         averagePayment: number;
//         netPayments: number;
//     };
//     statusBreakdown: Array<{
//         status: string;
//         amount: number;
//         count: number;
//     }>;
//     methodBreakdown: Array<{
//         method: string;
//         amount: number;
//         count: number;
//         charges: number;
//         averageAmount: number;
//     }>;
// }

export const invoicePaymentsApi = {
    // Get all invoice payments with filters
    getInvoicePayments: async (
        params?: InvoicePaymentQueryType
    ): Promise<PaginatedResponse<InvoicePayment>> => {
        const { data } = await apiClient.get("/invoice-payments", { params });
        return data;
    },

    // Get invoice payment by ID
    getInvoicePaymentById: async (id: string): Promise<InvoicePayment> => {
        const { data } = await apiClient.get(`/invoice-payments/${id}`);
        return data.data;
    },

    // Create invoice payment
    createInvoicePayment: async (
        paymentData: CreateInvoicePaymentType
    ): Promise<InvoicePayment> => {
        const { data } = await apiClient.post("/invoice-payments", paymentData);
        return data.data;
    },

    // Update invoice payment
    updateInvoicePayment: async (
        id: string,
        paymentData: UpdateInvoicePaymentType
    ): Promise<InvoicePayment> => {
        const { data } = await apiClient.put(
            `/invoice-payments/${id}`,
            paymentData
        );
        return data.data;
    },

    // Delete invoice payment
    deleteInvoicePayment: async (id: string): Promise<void> => {
        await apiClient.delete(`/invoice-payments/${id}`);
    },

    // Get payment summary
    getPaymentSummary: async (params?: {
        startDate?: string;
        endDate?: string;
        partyId?: string;
    }): Promise<PaymentSummary> => {
        const { data } = await apiClient.get("/invoice-payments/summary", {
            params,
        });
        return data.data;
    },

    // Get payment analytics
    getPaymentAnalytics: async (params?: {
        startDate?: string;
        endDate?: string;
        method?: string;
    }): Promise<any> => {
        const { data } = await apiClient.get("/invoice-payments/analytics", {
            params,
        });
        return data.data;
    },

    // Get cash flow analysis
    getCashFlowAnalysis: async (params?: { months?: number }): Promise<any> => {
        const { data } = await apiClient.get("/invoice-payments/cash-flow", {
            params,
        });
        return data.data;
    },
};
