// apps/accounts-web/src/features/invoices/hooks/use-invoices.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "../api/invoices.api";
import { toast } from "sonner";
import type {
    CreateInvoiceType,
    UpdateInvoiceType,
    InvoiceQueryType,
} from "@repo/common/schemas";
import { ApiErrorResponse, DateRange } from "@repo/common/types";
import { AxiosError } from "axios";

export const INVOICE_QUERY_KEYS = {
    all: ["invoices"] as const,
    lists: () => [...INVOICE_QUERY_KEYS.all, "list"] as const,
    list: (params?: InvoiceQueryType) =>
        [...INVOICE_QUERY_KEYS.lists(), params] as const,
    details: () => [...INVOICE_QUERY_KEYS.all, "detail"] as const,
    detail: (id: string) => [...INVOICE_QUERY_KEYS.details(), id] as const,
    overdue: () => [...INVOICE_QUERY_KEYS.all, "overdue"] as const,
    analytics: (params?: DateRange) =>
        [...INVOICE_QUERY_KEYS.all, "analytics", params] as const,
};

export const useInvoices = (params?: InvoiceQueryType) => {
    return useQuery({
        queryKey: INVOICE_QUERY_KEYS.list(params),
        queryFn: () => invoicesApi.getInvoices(params),
    });
};

export const useInvoice = (id: string) => {
    return useQuery({
        queryKey: INVOICE_QUERY_KEYS.detail(id),
        queryFn: () => invoicesApi.getInvoiceById(id),
        enabled: !!id,
    });
};

export const useOverdueInvoices = () => {
    return useQuery({
        queryKey: INVOICE_QUERY_KEYS.overdue(),
        queryFn: () => invoicesApi.getOverdueInvoices(),
    });
};

export const useCreateInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateInvoiceType) =>
            invoicesApi.createInvoice(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: INVOICE_QUERY_KEYS.lists(),
            });
            toast.success("Invoice created successfully");
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
            toast.error(
                error?.response?.data?.message || "Failed to create invoice"
            );
        },
    });
};

export const useUpdateInvoice = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateInvoiceType) =>
            invoicesApi.updateInvoice(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: INVOICE_QUERY_KEYS.detail(id),
            });
            queryClient.invalidateQueries({
                queryKey: INVOICE_QUERY_KEYS.lists(),
            });
            toast.success("Invoice updated successfully");
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
            toast.error(
                error?.response?.data?.message || "Failed to update invoice"
            );
        },
    });
};

export const useDeleteInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => invoicesApi.deleteInvoice(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: INVOICE_QUERY_KEYS.lists(),
            });
            toast.success("Invoice deleted successfully");
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
            toast.error(
                error?.response?.data?.message || "Failed to delete invoice"
            );
        },
    });
};

export const useInvoiceAnalytics = (params?: DateRange) => {
    return useQuery({
        queryKey: INVOICE_QUERY_KEYS.analytics(params),
        queryFn: () => invoicesApi.getInvoiceAnalytics(params),
    });
};
