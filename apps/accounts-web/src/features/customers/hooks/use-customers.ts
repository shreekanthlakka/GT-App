// apps/accounts-web/src/features/customers/hooks/use-customers.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "../api/customers.api";

import { toast } from "sonner";
import type {
    CreateCustomerType,
    UpdateCustomerType,
    CustomerQueryType,
} from "@repo/common/schemas";

export const CUSTOMER_QUERY_KEYS = {
    all: ["customers"] as const,
    lists: () => [...CUSTOMER_QUERY_KEYS.all, "list"] as const,
    list: (params?: CustomerQueryType) =>
        [...CUSTOMER_QUERY_KEYS.lists(), params] as const,
    details: () => [...CUSTOMER_QUERY_KEYS.all, "detail"] as const,
    detail: (id: string) => [...CUSTOMER_QUERY_KEYS.details(), id] as const,
    ledger: (id: string, params?: any) =>
        [...CUSTOMER_QUERY_KEYS.all, "ledger", id, params] as const,
    statement: (id: string, params?: any) =>
        [...CUSTOMER_QUERY_KEYS.all, "statement", id, params] as const,
};

// Get all customers
export const useCustomers = (params?: CustomerQueryType) => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.list(params),
        queryFn: () => customersApi.getCustomers(params),
    });
};

// Get customer by ID
export const useCustomer = (id: string) => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.detail(id),
        queryFn: () => customersApi.getCustomerById(id),
        enabled: !!id,
    });
};

// Get customer ledger
export const useCustomerLedger = (
    id: string,
    params?: { startDate?: string; endDate?: string }
) => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.ledger(id, params),
        queryFn: () => customersApi.getCustomerLedger(id, params),
        enabled: !!id,
    });
};

// Get customer statement
export const useCustomerStatement = (
    id: string,
    params?: { startDate?: string; endDate?: string }
) => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.statement(id, params),
        queryFn: () => customersApi.getCustomerStatement(id, params),
        enabled: !!id,
    });
};

// Create customer mutation
export const useCreateCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCustomerType) =>
            customersApi.createCustomer(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: CUSTOMER_QUERY_KEYS.lists(),
            });
            toast.success("Customer created successfully");
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message || "Failed to create customer"
            );
        },
    });
};

// Update customer mutation
export const useUpdateCustomer = (id: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateCustomerType) =>
            customersApi.updateCustomer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: CUSTOMER_QUERY_KEYS.detail(id),
            });
            queryClient.invalidateQueries({
                queryKey: CUSTOMER_QUERY_KEYS.lists(),
            });
            toast.success("Customer updated successfully");
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message || "Failed to update customer"
            );
        },
    });
};

// Delete customer mutation
export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => customersApi.deleteCustomer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: CUSTOMER_QUERY_KEYS.lists(),
            });
            toast.success("Customer deleted successfully");
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message || "Failed to delete customer"
            );
        },
    });
};
