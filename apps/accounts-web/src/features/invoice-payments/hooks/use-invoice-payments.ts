// apps/accounts-web/src/features/invoice-payments/hooks/use-invoice-payments.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoicePaymentsApi } from "../api/invoice-payments.api";
import { toast } from "sonner";
import type {
    CreateInvoicePaymentType,
    UpdateInvoicePaymentType,
    InvoicePaymentQueryType,
} from "@repo/common/schemas";

export const INVOICE_PAYMENT_QUERY_KEYS = {
    all: ["invoice-payments"] as const,
    lists: () => [...INVOICE_PAYMENT_QUERY_KEYS.all, "list"] as const,
    list: (params?: InvoicePaymentQueryType) =>
        [...INVOICE_PAYMENT_QUERY_KEYS.lists(), params] as const,
    details: () => [...INVOICE_PAYMENT_QUERY_KEYS.all, "detail"] as const,
    detail: (id: string) =>
        [...INVOICE_PAYMENT_QUERY_KEYS.details(), id] as const,
    summary: (params?: {
        startDate?: string;
        endDate?: string;
        partyId?: string;
    }) => [...INVOICE_PAYMENT_QUERY_KEYS.all, "summary", params] as const,
    analytics: (params?: {
        startDate?: string;
        endDate?: string;
        method?: string;
    }) => [...INVOICE_PAYMENT_QUERY_KEYS.all, "analytics", params] as const,
    cashFlow: (params?: { months?: number }) =>
        [...INVOICE_PAYMENT_QUERY_KEYS.all, "cash-flow", params] as const,
};

// Get all invoice payments
export const useInvoicePayments = (params?: InvoicePaymentQueryType) => {
    return useQuery({
        queryKey: INVOICE_PAYMENT_QUERY_KEYS.list(params),
        queryFn: () => invoicePaymentsApi.getInvoicePayments(params),
    });
};

// Get invoice payment by ID
export const useInvoicePayment = (id: string) => {
    return useQuery({
        queryKey: INVOICE_PAYMENT_QUERY_KEYS.detail(id),
        queryFn: () => invoicePaymentsApi.getInvoicePaymentById(id),
        enabled: !!id,
    });
};

// Get payment summary
export const usePaymentSummary = (params?: {
    startDate?: string;
    endDate?: string;
    partyId?: string;
}) => {
    return useQuery({
        queryKey: INVOICE_PAYMENT_QUERY_KEYS.summary(params),
        queryFn: () => invoicePaymentsApi.getPaymentSummary(params),
    });
};

// Get payment analytics
export const usePaymentAnalytics = (params?: {
    startDate?: string;
    endDate?: string;
    method?: string;
}) => {
    return useQuery({
        queryKey: INVOICE_PAYMENT_QUERY_KEYS.analytics(params),
        queryFn: () => invoicePaymentsApi.getPaymentAnalytics(params),
    });
};

// Get cash flow analysis
export const useCashFlowAnalysis = (params?: { months?: number }) => {
    return useQuery({
        queryKey: INVOICE_PAYMENT_QUERY_KEYS.cashFlow(params),
        queryFn: () => invoicePaymentsApi.getCashFlowAnalysis(params),
    });
};

// Create invoice payment mutation
export const useCreateInvoicePayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateInvoicePaymentType) =>
            invoicePaymentsApi.createInvoicePayment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: INVOICE_PAYMENT_QUERY_KEYS.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: INVOICE_PAYMENT_QUERY_KEYS.summary(),
            });
            toast.success("Invoice payment created successfully");
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                    "Failed to create invoice payment"
            );
        },
    });
};

// Update invoice payment mutation
export const useUpdateInvoicePayment = (id: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateInvoicePaymentType) =>
            invoicePaymentsApi.updateInvoicePayment(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: INVOICE_PAYMENT_QUERY_KEYS.detail(id),
            });
            queryClient.invalidateQueries({
                queryKey: INVOICE_PAYMENT_QUERY_KEYS.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: INVOICE_PAYMENT_QUERY_KEYS.summary(),
            });
            toast.success("Invoice payment updated successfully");
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                    "Failed to update invoice payment"
            );
        },
    });
};

// Delete invoice payment mutation
export const useDeleteInvoicePayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => invoicePaymentsApi.deleteInvoicePayment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: INVOICE_PAYMENT_QUERY_KEYS.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: INVOICE_PAYMENT_QUERY_KEYS.summary(),
            });
            toast.success("Invoice payment deleted successfully");
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                    "Failed to delete invoice payment"
            );
        },
    });
};
