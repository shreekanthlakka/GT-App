// apps/accounts-web/src/features/customers/api/customers.api.ts

import { customerService as apiClient } from "@/shared/utils/api-client";
import type {
    CreateCustomerType,
    UpdateCustomerType,
    CustomerQueryType,
} from "@repo/common/schemas";

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
    createdAt: string;
    updatedAt: string;
    userId: string;
}

export interface CustomerLedger {
    id: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    type: string;
    reference?: string;
}

export interface CustomerStatement {
    customer: Customer;
    openingBalance: number;
    closingBalance: number;
    totalSales: number;
    totalReceipts: number;
    entries: CustomerLedger[];
    period: {
        startDate: string;
        endDate: string;
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const customersApi = {
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

    // Get customer ledger
    getCustomerLedger: async (
        id: string,
        params?: { startDate?: string; endDate?: string }
    ): Promise<CustomerLedger[]> => {
        const { data } = await apiClient.get(`/customers/${id}/ledger`, {
            params,
        });
        return data.data;
    },

    // Get customer statement
    getCustomerStatement: async (
        id: string,
        params?: { startDate?: string; endDate?: string }
    ): Promise<CustomerStatement> => {
        const { data } = await apiClient.get(`/customers/${id}/statement`, {
            params,
        });
        return data.data;
    },
};
