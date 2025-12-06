// apps/accounts-web/src/features/invoice-payments/api/invoice-payments.api.ts

import { invoicePaymentService as apiClient } from "@/shared/utils/api-client";
import type {
    CreateInvoicePaymentType,
    UpdateInvoicePaymentType,
    InvoicePaymentQueryType,
} from "@repo/common/schemas";
import {
    PaginatedResponse,
    PartyPaymentHistory,
    PaymentMethodSummary,
    InvoicePayment,
    InvoicePaymentAnalytics,
    InvoicePaymentSummary,
    CashFlowAnalysis,
} from "@repo/common/types";

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
//     status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED";
//     gatewayOrderId?: string | null;
//     gatewayPaymentId?: string | null;
//     transactionId?: string | null;
//     failureReason?: string | null;
//     bankName?: string | null;
//     chequeNo?: string | null;
//     chequeDate?: string | null;
//     clearanceDate?: string | null;
//     charges?: number | null;
//     partyId: string;
//     party: {
//         id: string;
//         name: string;
//         phone?: string | null;
//         email?: string | null;
//     };
//     invoiceId?: string | null;
//     invoice?: {
//         id: string;
//         invoiceNo: string;
//         amount: number;
//     } | null;
//     userId: string;
//     createdAt: string;
//     updatedAt: string;
// }

// // ========================================
// // NEW: Analytics and Summary Interfaces
// // ========================================

// export interface InvoicePaymentAnalytics {
//     totalPayments: number;
//     totalAmount: number;
//     completedAmount: number;
//     pendingAmount: number;
//     failedAmount: number;
//     avgPaymentAmount: number;
//     paymentsByMethod: {
//         method: string;
//         count: number;
//         amount: number;
//     }[];
//     paymentsByStatus: {
//         status: string;
//         count: number;
//         amount: number;
//     }[];
//     paymentsByParty: {
//         partyId: string;
//         partyName: string;
//         count: number;
//         amount: number;
//     }[];
//     monthlyTrend: {
//         month: string;
//         count: number;
//         amount: number;
//     }[];
// }

// export interface InvoicePaymentSummary {
//     todayPayments: {
//         count: number;
//         amount: number;
//     };
//     weekPayments: {
//         count: number;
//         amount: number;
//     };
//     monthPayments: {
//         count: number;
//         amount: number;
//     };
//     pendingCheques: {
//         count: number;
//         amount: number;
//         cheques: {
//             id: string;
//             chequeNo: string;
//             amount: number;
//             chequeDate: string;
//             partyName: string;
//         }[];
//     };
//     recentPayments: InvoicePayment[];
//     topParties: {
//         partyId: string;
//         partyName: string;
//         totalPaid: number;
//         paymentCount: number;
//     }[];
// }

// export interface PaymentMethodSummary {
//     method: string;
//     count: number;
//     amount: number;
//     percentage: number;
//     avgAmount: number;
// }

// export interface PartyPaymentHistory {
//     party: {
//         id: string;
//         name: string;
//         phone?: string | null;
//         email?: string | null;
//     };
//     totalPaid: number;
//     paymentCount: number;
//     lastPaymentDate?: string;
//     payments: InvoicePayment[];
//     invoices: {
//         id: string;
//         invoiceNo: string;
//         amount: number;
//         paidAmount: number;
//         remainingAmount: number;
//     }[];
// }

// ========================================
// API Client with ALL Endpoints
// ========================================

export const invoicePaymentsApi = {
    // ========================================
    // CRUD Operations
    // ========================================

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

    // ========================================
    // NEW: Analytics Endpoints
    // ========================================

    // Get comprehensive payment analytics
    getPaymentAnalytics: async (params?: {
        startDate?: string;
        endDate?: string;
        partyId?: string;
    }): Promise<InvoicePaymentAnalytics> => {
        const { data } = await apiClient.get("/invoice-payments/analytics", {
            params,
        });
        return data.data;
    },

    // Get payment summary for dashboard
    getPaymentSummary: async (): Promise<InvoicePaymentSummary> => {
        const { data } = await apiClient.get("/invoice-payments/summary");
        return data.data;
    },

    // Get payment method breakdown
    getPaymentMethodSummary: async (params?: {
        startDate?: string;
        endDate?: string;
    }): Promise<PaymentMethodSummary[]> => {
        const { data } = await apiClient.get(
            "/invoice-payments/methods-summary",
            { params }
        );
        return data.data;
    },

    // Get payment history for a specific party
    getPartyPaymentHistory: async (
        partyId: string,
        params?: {
            startDate?: string;
            endDate?: string;
        }
    ): Promise<PartyPaymentHistory> => {
        const { data } = await apiClient.get(
            `/invoice-payments/party/${partyId}/history`,
            { params }
        );
        return data.data;
    },

    // Get cash flow analysis
    getCashFlowAnalysis: async (params?: {
        startDate?: string;
        endDate?: string;
    }): Promise<CashFlowAnalysis> => {
        const { data } = await apiClient.get("/invoice-payments/cash-flow", {
            params,
        });
        return data.data;
    },

    // ========================================
    // NEW: Status & Filter Endpoints
    // ========================================

    // Get pending payments
    getPendingPayments: async (): Promise<InvoicePayment[]> => {
        const { data } = await apiClient.get("/invoice-payments/pending");
        return data.data;
    },

    // Get failed payments
    getFailedPayments: async (): Promise<InvoicePayment[]> => {
        const { data } = await apiClient.get("/invoice-payments/failed");
        return data.data;
    },

    // Get cheques pending clearance
    getPendingCheques: async (): Promise<InvoicePayment[]> => {
        const { data } = await apiClient.get(
            "/invoice-payments/pending-cheques"
        );
        return data.data;
    },

    // Get payments by date range
    getPaymentsByDateRange: async (
        startDate: string,
        endDate: string
    ): Promise<InvoicePayment[]> => {
        const { data } = await apiClient.get("/invoice-payments/date-range", {
            params: { startDate, endDate },
        });
        return data.data;
    },

    // ========================================
    // Special Operations
    // ========================================

    // Mark cheque clearance
    markChequeClearance: async (
        id: string,
        data: { clearanceDate?: string; charges?: number; notes?: string }
    ): Promise<InvoicePayment> => {
        const { data: response } = await apiClient.patch(
            `/invoice-payments/${id}/cheque-clearance`,
            data
        );
        return response.data;
    },

    // Retry failed payment
    retryPayment: async (id: string): Promise<InvoicePayment> => {
        const { data } = await apiClient.post(`/invoice-payments/${id}/retry`);
        return data.data;
    },

    // Cancel payment
    cancelPayment: async (
        id: string,
        reason: string
    ): Promise<InvoicePayment> => {
        const { data } = await apiClient.patch(
            `/invoice-payments/${id}/cancel`,
            { reason }
        );
        return data.data;
    },

    // Refund payment
    refundPayment: async (
        id: string,
        data: { amount: number; reason: string }
    ): Promise<InvoicePayment> => {
        const { data: response } = await apiClient.post(
            `/invoice-payments/${id}/refund`,
            data
        );
        return response.data;
    },

    // ========================================
    // Export & Reports
    // ========================================

    // Export payments to Excel
    exportPayments: async (params?: {
        startDate?: string;
        endDate?: string;
        partyId?: string;
        method?: string;
    }): Promise<Blob> => {
        const { data } = await apiClient.get("/invoice-payments/export", {
            params,
            responseType: "blob",
        });
        return data;
    },

    // Generate payment report PDF
    generatePaymentReport: async (params?: {
        startDate?: string;
        endDate?: string;
        partyId?: string;
    }): Promise<Blob> => {
        const { data } = await apiClient.get("/invoice-payments/report/pdf", {
            params,
            responseType: "blob",
        });
        return data;
    },
};
