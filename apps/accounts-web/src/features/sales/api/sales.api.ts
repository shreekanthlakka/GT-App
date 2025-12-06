// apps/accounts-web/src/features/sales/api/sales.api.ts

import { salesService as apiClient } from "@/shared/utils/api-client";
import type {
    CreateSaleType,
    UpdateSaleType,
    SaleQueryType,
} from "@repo/common/schemas";
import {
    Sale,
    PaginatedResponse,
    SalesAnalytics,
    DateRange,
} from "@repo/common/types";

// export interface SaleItem {
//     inventoryItemId?: string;
//     itemName: string;
//     itemType?: string;
//     design?: string;
//     color?: string;
//     price: number;
//     quantity: number;
//     total: number;
//     hsnCode?: string;
//     unit?: string;
// }

// export interface Sale {
//     id: string;
//     voucherId: string;
//     saleNo: string;
//     date: string;
//     amount: number;
//     paidAmount: number;
//     remainingAmount: number;
//     status:
//         | "PENDING"
//         | "PARTIALLY_PAID"
//         | "PAID"
//         | "OVERDUE"
//         | "CANCELLED"
//         | "RETURNED";
//     items: SaleItem[];
//     taxAmount?: number | null;
//     discountAmount?: number;
//     roundOffAmount?: number;
//     salesPerson?: string | null;
//     deliveryDate?: string | null;
//     deliveryAddress?: string | null;
//     transportation?: string | null;
//     vehicleNo?: string | null;
//     reference?: string | null;
//     terms?: string | null;
//     notes?: string | null;
//     customerId: string;
//     customer: {
//         id: string;
//         name: string;
//         phone?: string | null;
//         email?: string | null;
//     };
//     userId: string;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface SaleAnalytics {
//     totalSales: number;
//     totalAmount: number;
//     paidAmount: number;
//     pendingAmount: number;
//     cancelledAmount: number;
//     avgSaleAmount: number;
//     salesByStatus: {
//         status: string;
//         count: number;
//         amount: number;
//     }[];
// }

// export interface PaginatedResponse<T> {
//     data: T[];
//     meta: {
//         page: number;
//         limit: number;
//         total: number;
//         totalPages: number;
//     };
// }

export const salesApi = {
    // Get all sales with filters
    getSales: async (
        params?: SaleQueryType
    ): Promise<PaginatedResponse<Sale>> => {
        const { data } = await apiClient.get("/sales", { params });
        return data;
    },

    // Get sale by ID
    getSaleById: async (id: string): Promise<Sale> => {
        const { data } = await apiClient.get(`/sales/${id}`);
        return data.data;
    },

    // Create sale
    createSale: async (saleData: CreateSaleType): Promise<Sale> => {
        const { data } = await apiClient.post("/sales", saleData);
        return data.data;
    },

    // Update sale
    updateSale: async (id: string, saleData: UpdateSaleType): Promise<Sale> => {
        const { data } = await apiClient.put(`/sales/${id}`, saleData);
        return data.data;
    },

    // Delete sale
    deleteSale: async (id: string): Promise<void> => {
        await apiClient.delete(`/sales/${id}`);
    },

    // Cancel sale
    cancelSale: async (id: string): Promise<Sale> => {
        const { data } = await apiClient.patch(`/sales/${id}/cancel`);
        return data.data;
    },

    // Get overdue sales
    getOverdueSales: async (): Promise<Sale[]> => {
        const { data } = await apiClient.get("/sales/overdue");
        return data.data;
    },

    // Get sale analytics
    getSaleAnalytics: async (params?: DateRange): Promise<SalesAnalytics> => {
        const { data } = await apiClient.get("/sales/analytics", { params });
        return data.data;
    },
};
