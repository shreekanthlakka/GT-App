// apps/accounts-web/src/features/invoices/api/invoices.api.ts

import { invoiceService as apiClient } from "@/shared/utils/api-client";
import type {
    CreateInvoiceType,
    UpdateInvoiceType,
    InvoiceQueryType,
} from "@repo/common/schemas";

import {
    PaginatedResponse,
    Invoice,
    InvoiceAnalytics,
    DateRange,
} from "@repo/common/types";

export const invoicesApi = {
    // ========================================
    // CRUD Operations
    // ========================================

    // Get all invoices with filters
    getInvoices: async (
        params?: InvoiceQueryType
    ): Promise<PaginatedResponse<Invoice>> => {
        const { data } = await apiClient.get("/invoices", { params });
        return data;
    },

    // Get invoice by ID
    getInvoiceById: async (id: string): Promise<Invoice> => {
        const { data } = await apiClient.get(`/invoices/${id}`);
        return data.data;
    },

    createInvoice: async (invoiceData: CreateInvoiceType): Promise<Invoice> => {
        const { data } = await apiClient.post("/invoices", invoiceData);
        return data.data;
    },

    updateInvoice: async (
        id: string,
        invoiceData: UpdateInvoiceType
    ): Promise<Invoice> => {
        const { data } = await apiClient.put(`/invoices/${id}`, invoiceData);
        return data.data;
    },

    deleteInvoice: async (id: string): Promise<void> => {
        await apiClient.delete(`/invoices/${id}`);
    },

    getOverdueInvoices: async (): Promise<Invoice[]> => {
        const { data } = await apiClient.get("/invoices/overdue");
        return data.data;
    },

    // Get invoice analytics
    getInvoiceAnalytics: async (
        params?: DateRange
    ): Promise<InvoiceAnalytics> => {
        const { data } = await apiClient.get("/invoices/analytics", { params });
        return data.data;
    },

    // Get invoice by invoice number
    getInvoiceByInvoiceNo: async (invoiceNo: string): Promise<Invoice> => {
        const { data } = await apiClient.get(
            `/invoices/invoice-no/${invoiceNo}`
        );
        return data.data;
    },
};
