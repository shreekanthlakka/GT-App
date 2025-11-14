// // apps/accounts-web/src/features/customers/api/customers.api.ts

// import { customerService as apiClient } from "@/shared/utils/api-client";
// import type {
//     CreateCustomerType,
//     UpdateCustomerType,
//     CustomerQueryType,
// } from "@repo/common/schemas";

// export interface Customer {
//     id: string;
//     name: string;
//     phone?: string | null;
//     email?: string | null;
//     address?: string | null;
//     city?: string | null;
//     state?: string | null;
//     pincode?: string | null;
//     gstNumber?: string | null;
//     creditLimit: number;
//     dateOfBirth?: string | null;
//     anniversary?: string | null;
//     preferredContact?: string | null;
//     tags: string[];
//     notes?: string | null;
//     isActive: boolean;
//     createdAt: string;
//     updatedAt: string;
//     userId: string;
// }

// export interface CustomerLedger {
//     id: string;
//     date: string;
//     description: string;
//     debit: number;
//     credit: number;
//     balance: number;
//     type: string;
//     reference?: string;
// }

// export interface CustomerStatement {
//     customer: Customer;
//     openingBalance: number;
//     closingBalance: number;
//     totalSales: number;
//     totalReceipts: number;
//     entries: CustomerLedger[];
//     period: {
//         startDate: string;
//         endDate: string;
//     };
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

// export const customersApi = {
//     // Get all customers with filters
//     getCustomers: async (
//         params?: CustomerQueryType
//     ): Promise<PaginatedResponse<Customer>> => {
//         const { data } = await apiClient.get("/customers", { params });
//         return data;
//     },

//     // Get customer by ID
//     getCustomerById: async (id: string): Promise<Customer> => {
//         const { data } = await apiClient.get(`/customers/${id}`);
//         return data.data;
//     },

//     // Create customer
//     createCustomer: async (
//         customerData: CreateCustomerType
//     ): Promise<Customer> => {
//         const { data } = await apiClient.post("/customers", customerData);
//         return data.data;
//     },

//     // Update customer
//     updateCustomer: async (
//         id: string,
//         customerData: UpdateCustomerType
//     ): Promise<Customer> => {
//         const { data } = await apiClient.put(`/customers/${id}`, customerData);
//         return data.data;
//     },

//     // Delete customer
//     deleteCustomer: async (id: string): Promise<void> => {
//         await apiClient.delete(`/customers/${id}`);
//     },

//     // Get customer ledger
//     getCustomerLedger: async (
//         id: string,
//         params?: { startDate?: string; endDate?: string }
//     ): Promise<CustomerLedger[]> => {
//         const { data } = await apiClient.get(`/customers/${id}/ledger`, {
//             params,
//         });
//         return data.data;
//     },

//     // Get customer statement
//     getCustomerStatement: async (
//         id: string,
//         params?: { startDate?: string; endDate?: string }
//     ): Promise<CustomerStatement> => {
//         const { data } = await apiClient.get(`/customers/${id}/statement`, {
//             params,
//         });
//         return data.data;
//     },
// };

// apps/accounts-web/src/features/customers/api/customers.api.ts

import { customerService as apiClient } from "@/shared/utils/api-client";
import type {
    CreateCustomerType,
    UpdateCustomerType,
    CustomerQueryType,
} from "@repo/common/schemas";
import { PaginatedResponse } from "@repo/common/types";

export interface Customer {
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
    isActive: boolean;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerLedgerEntry {
    id: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    type: string;
    reference?: string | null;
}

export interface CustomerStatement {
    customer: Customer;
    period: {
        startDate: string;
        endDate: string;
    };
    openingBalance: number;
    closingBalance: number;
    totalSales: number;
    totalReceipts: number;
    entries: CustomerLedgerEntry[];
}

export interface CustomerAnalytics {
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
    totalCreditLimit: number;
    averageCreditLimit: number;
    customersWithGST: number;
    customersWithoutGST: number;
    topCustomersByRevenue: Array<{
        customer: Customer;
        totalRevenue: number;
        totalSales: number;
    }>;
    cityWiseDistribution: Array<{
        city: string;
        count: number;
        totalRevenue: number;
    }>;
    tagDistribution: Record<string, number>;
}

export interface CustomerLifetimeValue {
    customer: Customer;
    lifetimeValue: {
        totalSales: number;
        totalPayments: number;
        totalOutstanding: number;
        averageOrderValue: number;
        orderCount: number;
        firstPurchaseDate: string;
        lastPurchaseDate: string;
        customerAge: number; // in days
    };
    recentActivity: {
        lastSaleDate?: string;
        lastPaymentDate?: string;
        recentSales: Array<{
            id: string;
            saleNo: string;
            date: string;
            amount: number;
        }>;
    };
}

export interface CustomerCreditSummary {
    customerId: string;
    customerName: string;
    creditLimit: number;
    creditUsed: number;
    creditAvailable: number;
    utilizationPercentage: number;
    overdueAmount: number;
    status: "SAFE" | "WARNING" | "EXCEEDED";
}

// ========================================
// API Client with ALL Endpoints
// ========================================

export const customersApi = {
    // ========================================
    // CRUD Operations
    // ========================================

    // Get all customers with filters
    getCustomers: async (
        params?: CustomerQueryType
    ): Promise<PaginatedResponse<Customer>> => {
        const { data } = await apiClient.get("/customers", { params });
        return data;
    },

    // Get customer by ID
    getCustomerById: async (id: string): Promise<Customer> => {
        const { data } = await apiClient.get(`/customers/${id}`);
        return data.data;
    },

    // Create customer
    createCustomer: async (
        customerData: CreateCustomerType
    ): Promise<Customer> => {
        const { data } = await apiClient.post("/customers", customerData);
        return data.data;
    },

    // Update customer
    updateCustomer: async (
        id: string,
        customerData: UpdateCustomerType
    ): Promise<Customer> => {
        const { data } = await apiClient.put(`/customers/${id}`, customerData);
        return data.data;
    },

    // Delete customer
    deleteCustomer: async (id: string): Promise<void> => {
        await apiClient.delete(`/customers/${id}`);
    },

    // ========================================
    // Ledger & Statement Endpoints
    // ========================================

    // Get customer ledger
    getCustomerLedger: async (
        id: string,
        params?: {
            startDate?: string;
            endDate?: string;
            page?: number;
            limit?: number;
        }
    ): Promise<{
        customer: Customer;
        ledgerEntries: CustomerLedgerEntry[];
        summary: {
            openingBalance: number;
            totalDebits: number;
            totalCredits: number;
            closingBalance: number;
        };
    }> => {
        const { data } = await apiClient.get(`/customers/${id}/ledger`, {
            params,
        });
        return data.data;
    },

    // Get customer statement
    getCustomerStatement: async (
        id: string,
        params: {
            startDate: string;
            endDate: string;
        }
    ): Promise<CustomerStatement> => {
        const { data } = await apiClient.get(`/customers/${id}/statement`, {
            params,
        });
        return data.data;
    },

    // ========================================
    // Analytics Endpoints
    // ========================================

    // Get comprehensive customer analytics
    getCustomerAnalytics: async (params?: {
        startDate?: string;
        endDate?: string;
    }): Promise<CustomerAnalytics> => {
        const { data } = await apiClient.get("/customers/analytics", {
            params,
        });
        return data.data;
    },

    // Get customer lifetime value
    getCustomerLifetimeValue: async (
        id: string
    ): Promise<CustomerLifetimeValue> => {
        const { data } = await apiClient.get(`/customers/${id}/lifetime-value`);
        return data.data;
    },

    // Get customers by credit status
    getCustomersByCreditStatus: async (
        status: "SAFE" | "WARNING" | "EXCEEDED"
    ): Promise<CustomerCreditSummary[]> => {
        const { data } = await apiClient.get("/customers/credit-status", {
            params: { status },
        });
        return data.data;
    },

    // Get customers with outstanding balance
    getCustomersWithOutstanding: async (): Promise<
        Array<{
            customer: Customer;
            outstandingAmount: number;
            oldestDue: string;
        }>
    > => {
        const { data } = await apiClient.get("/customers/outstanding");
        return data.data;
    },

    // Get birthday customers (for current month)
    getBirthdayCustomers: async (): Promise<Customer[]> => {
        const { data } = await apiClient.get("/customers/birthdays");
        return data.data;
    },

    // Get anniversary customers (for current month)
    getAnniversaryCustomers: async (): Promise<Customer[]> => {
        const { data } = await apiClient.get("/customers/anniversaries");
        return data.data;
    },

    // ========================================
    // Search & Filter Operations
    // ========================================

    // Search customers for quick lookup
    searchCustomers: async (query: string): Promise<Customer[]> => {
        const { data } = await apiClient.get("/customers/search", {
            params: { q: query },
        });
        return data.data;
    },

    // Get customers by city
    getCustomersByCity: async (city: string): Promise<Customer[]> => {
        const { data } = await apiClient.get("/customers/by-city", {
            params: { city },
        });
        return data.data;
    },

    // Get customers by tag
    getCustomersByTag: async (tag: string): Promise<Customer[]> => {
        const { data } = await apiClient.get("/customers/by-tag", {
            params: { tag },
        });
        return data.data;
    },

    // ========================================
    // Export & Reports
    // ========================================

    // Export customers to Excel
    exportCustomers: async (params?: {
        city?: string;
        state?: string;
        hasGST?: boolean;
        isActive?: boolean;
    }): Promise<Blob> => {
        const { data } = await apiClient.get("/customers/export", {
            params,
            responseType: "blob",
        });
        return data;
    },

    // Generate customer report PDF
    generateCustomerReport: async (id: string): Promise<Blob> => {
        const { data } = await apiClient.get(`/customers/${id}/report/pdf`, {
            responseType: "blob",
        });
        return data;
    },

    // Export ledger to Excel
    exportLedger: async (
        id: string,
        params: {
            startDate: string;
            endDate: string;
            format: "pdf" | "excel";
        }
    ): Promise<Blob> => {
        const { data } = await apiClient.get(`/customers/${id}/ledger/export`, {
            params,
            responseType: "blob",
        });
        return data;
    },

    // ========================================
    // Special Operations
    // ========================================

    // Send payment reminder
    sendPaymentReminder: async (
        id: string,
        data: {
            channel: "EMAIL" | "WHATSAPP" | "SMS";
            message?: string;
        }
    ): Promise<{ success: boolean; message: string }> => {
        const { data: response } = await apiClient.post(
            `/customers/${id}/send-reminder`,
            data
        );
        return response.data;
    },

    // Update credit limit
    updateCreditLimit: async (
        id: string,
        creditLimit: number
    ): Promise<Customer> => {
        const { data } = await apiClient.patch(
            `/customers/${id}/credit-limit`,
            {
                creditLimit,
            }
        );
        return data.data;
    },

    // Toggle active status
    toggleActiveStatus: async (id: string): Promise<Customer> => {
        const { data } = await apiClient.patch(
            `/customers/${id}/toggle-active`
        );
        return data.data;
    },

    // Merge customers
    mergeCustomers: async (
        sourceId: string,
        targetId: string
    ): Promise<Customer> => {
        const { data } = await apiClient.post("/customers/merge", {
            sourceId,
            targetId,
        });
        return data.data;
    },
};
