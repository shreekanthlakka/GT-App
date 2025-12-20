// apps/accounts-web/src/features/parties/api/parties.api.ts

import { partiesService as apiClient } from "@/shared/utils/api-client";
import type {
    CreatePartyType,
    UpdatePartyType,
    PartyQueryType,
} from "@repo/common/schemas";
import {
    Party,
    PartyAnalytics,
    PartyPerformance,
    PartyStatement,
    DateRange,
    PaginatedResponse,
    PartyComparisonAnalytics,
    PartyLedgerEntry,
    Invoice,
    InvoiceStatus,
    PartyOutstanding,
    TopParty,
} from "@repo/common/types";

export const partiesApi = {
    // CRUD Operations
    getParties: async (
        params?: PartyQueryType
    ): Promise<PaginatedResponse<Party>> => {
        const { data } = await apiClient.get("/parties", { params });
        return data;
    },

    getPartyInvoices: async (
        id: string,
        params?: {
            page?: number;
            limit?: number;
            status?: InvoiceStatus;
            sortBy?: string;
            sortOrder?: "asc" | "desc";
        }
    ): Promise<PaginatedResponse<Invoice>> => {
        const { data } = await apiClient.get(`/parties/${id}/invoices`, {
            params,
        });
        return data.data;
    },

    getPartyById: async (id: string): Promise<Party> => {
        const { data } = await apiClient.get(`/parties/${id}`);
        return data.data;
    },

    createParty: async (partyData: CreatePartyType): Promise<Party> => {
        const { data } = await apiClient.post("/parties", partyData);
        return data.data;
    },

    updateParty: async (
        id: string,
        partyData: UpdatePartyType
    ): Promise<Party> => {
        const { data } = await apiClient.put(`/parties/${id}`, partyData);
        return data.data;
    },

    deleteParty: async (id: string): Promise<void> => {
        await apiClient.delete(`/parties/${id}`);
    },

    // Ledger & Statement
    getPartyLedger: async (
        id: string,
        params?: {
            startDate?: string;
            endDate?: string;
            page?: number;
            limit?: number;
        }
    ): Promise<PartyLedgerEntry[]> => {
        const { data } = await apiClient.get(`/parties/${id}/ledger`, {
            params,
        });
        return data.data;
    },

    getPartyStatement: async (
        id: string,
        params: DateRange
    ): Promise<PartyStatement> => {
        const { data } = await apiClient.get(`/parties/${id}/statement`, {
            params,
        });
        return data.data;
    },

    // Get party outstanding balance
    getPartyOutstanding: async (id: string): Promise<PartyOutstanding> => {
        const { data } = await apiClient.get(`/parties/${id}/outstanding`);
        return data.data;
    },
    // Analytics
    getPartyAnalytics: async (params?: {
        startDate?: string;
        endDate?: string;
        metric?: "amount" | "count" | "payments" | "outstanding";
    }): Promise<PartyAnalytics> => {
        const { data } = await apiClient.get("/parties/analytics", { params });
        return data.data;
    },

    getPartyPerformance: async (
        id: string,
        params?: {
            startDate?: string;
            endDate?: string;
        }
    ): Promise<PartyPerformance> => {
        const { data } = await apiClient.get(`/parties/${id}/performance`, {
            params,
        });
        return data.data;
    },

    exportLedger: async (
        id: string,
        params: {
            startDate?: string;
            endDate?: string;
            format?: "pdf" | "excel";
        }
    ): Promise<Blob> => {
        const { data } = await apiClient.get(`/parties/${id}/ledger/export`, {
            params,
            responseType: "blob",
        });
        return data;
    },

    // ========================================
    // Analytics Endpoints
    // ========================================

    // Get party comparison analytics
    getPartyComparison: async (params?: {
        startDate?: string;
        endDate?: string;
        metric?: "amount" | "count" | "payments" | "outstanding";
    }): Promise<PartyComparisonAnalytics> => {
        const { data } = await apiClient.get("/parties/analytics/comparison", {
            params,
        });
        return data.data;
    },

    // Get top parties by purchase volume
    getTopParties: async (params?: {
        limit?: number;
        startDate?: string;
        endDate?: string;
        sortBy?: "amount" | "count" | "outstanding" | "paymentRate";
    }): Promise<TopParty> => {
        const { data } = await apiClient.get("/parties/analytics/top", {
            params,
        });
        return data.data;
    },

    // ========================================
    // Export & Reports
    // ========================================

    // Export parties to Excel
    exportParties: async (params?: {
        city?: string;
        state?: string;
        isActive?: boolean;
    }): Promise<Blob> => {
        const { data } = await apiClient.get("/parties/export", {
            params,
            responseType: "blob",
        });
        return data;
    },

    // Generate party report PDF
    generatePartyReport: async (id: string): Promise<Blob> => {
        const { data } = await apiClient.get(`/parties/${id}/report/pdf`, {
            responseType: "blob",
        });
        return data;
    },
};
