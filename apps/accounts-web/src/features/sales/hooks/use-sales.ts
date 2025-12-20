// apps/accounts-web/src/features/sales/hooks/use-sales.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesApi } from "../api/sales.api";
import { toast } from "sonner";
import type {
    CreateSaleType,
    UpdateSaleType,
    SaleQueryType,
} from "@repo/common/schemas";
import { ApiErrorResponse } from "@repo/common/types";
import { AxiosError } from "axios";

export const SALE_QUERY_KEYS = {
    all: ["sales"] as const,
    lists: () => [...SALE_QUERY_KEYS.all, "list"] as const,
    list: (params?: SaleQueryType) =>
        [...SALE_QUERY_KEYS.lists(), params] as const,
    details: () => [...SALE_QUERY_KEYS.all, "detail"] as const,
    detail: (id: string) => [...SALE_QUERY_KEYS.details(), id] as const,
    overdue: () => [...SALE_QUERY_KEYS.all, "overdue"] as const,
    analytics: (params?: {
        startDate?: string;
        endDate?: string;
        limit?: number;
        sort?: "asc" | "desc";
    }) => [...SALE_QUERY_KEYS.all, "analytics", params] as const,
};

// Get all sales
export const useSales = (params?: SaleQueryType) => {
    return useQuery({
        queryKey: SALE_QUERY_KEYS.list(params),
        queryFn: () => salesApi.getSales(params),
    });
};

// Get sale by ID
export const useSale = (id: string) => {
    return useQuery({
        queryKey: SALE_QUERY_KEYS.detail(id),
        queryFn: () => salesApi.getSaleById(id),
        enabled: !!id,
    });
};

// Get overdue sales
export const useOverdueSales = () => {
    return useQuery({
        queryKey: SALE_QUERY_KEYS.overdue(),
        queryFn: () => salesApi.getOverdueSales(),
    });
};

// Get sale analytics
export const useSaleAnalytics = (params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    sort?: "asc" | "desc";
}) => {
    return useQuery({
        queryKey: SALE_QUERY_KEYS.analytics(params),
        queryFn: () => salesApi.getSaleAnalytics(params),
    });
};

// Create sale mutation
export const useCreateSale = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSaleType) => salesApi.createSale(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: SALE_QUERY_KEYS.lists(),
            });
            toast.success("Sale created successfully");
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
            toast.error(
                error?.response?.data?.message || "Failed to create sale"
            );
        },
    });
};

// Update sale mutation
export const useUpdateSale = (id: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateSaleType) => salesApi.updateSale(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: SALE_QUERY_KEYS.detail(id),
            });
            queryClient.invalidateQueries({
                queryKey: SALE_QUERY_KEYS.lists(),
            });
            toast.success("Sale updated successfully");
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
            toast.error(
                error?.response?.data?.message || "Failed to update sale"
            );
        },
    });
};

// Delete sale mutation
export const useDeleteSale = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => salesApi.deleteSale(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: SALE_QUERY_KEYS.lists(),
            });
            toast.success("Sale deleted successfully");
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
            toast.error(
                error?.response?.data?.message || "Failed to delete sale"
            );
        },
    });
};

// Cancel sale mutation
export const useCancelSale = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => salesApi.cancelSale(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: SALE_QUERY_KEYS.lists(),
            });
            toast.success("Sale cancelled successfully");
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
            toast.error(
                error?.response?.data?.message || "Failed to cancel sale"
            );
        },
    });
};
