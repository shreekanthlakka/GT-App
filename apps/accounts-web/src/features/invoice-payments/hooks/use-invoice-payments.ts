// apps/accounts-web/src/features/invoice-payments/hooks/use-invoice-payments.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoicePaymentsApi } from "../api/invoice-payments.api";
import { toast } from "sonner";
import type {
    CreateInvoicePaymentType,
    UpdateInvoicePaymentType,
    InvoicePaymentQueryType,
} from "@repo/common/schemas";
import { AxiosError } from "axios";
import { ApiErrorResponse } from "@repo/common/types";

export const INVOICE_PAYMENT_QUERY_KEYS = {
    all: ["invoice-payments"] as const,
    lists: () => [...INVOICE_PAYMENT_QUERY_KEYS.all, "list"] as const,
    list: (params?: InvoicePaymentQueryType) =>
        [...INVOICE_PAYMENT_QUERY_KEYS.lists(), params] as const,
    details: () => [...INVOICE_PAYMENT_QUERY_KEYS.all, "detail"] as const,
    detail: (id: string) =>
        [...INVOICE_PAYMENT_QUERY_KEYS.details(), id] as const,

    // NEW: Analytics keys
    analytics: (params?: {
        startDate?: string;
        endDate?: string;
        partyId?: string;
    }) => [...INVOICE_PAYMENT_QUERY_KEYS.all, "analytics", params] as const,
    summary: () => [...INVOICE_PAYMENT_QUERY_KEYS.all, "summary"] as const,
    methodSummary: (params?: { startDate?: string; endDate?: string }) =>
        [...INVOICE_PAYMENT_QUERY_KEYS.all, "method-summary", params] as const,
    partyHistory: (
        partyId: string,
        params?: {
            startDate?: string;
            endDate?: string;
        }
    ) =>
        [
            ...INVOICE_PAYMENT_QUERY_KEYS.all,
            "party-history",
            partyId,
            params,
        ] as const,
    pending: () => [...INVOICE_PAYMENT_QUERY_KEYS.all, "pending"] as const,
    failed: () => [...INVOICE_PAYMENT_QUERY_KEYS.all, "failed"] as const,
    pendingCheques: () =>
        [...INVOICE_PAYMENT_QUERY_KEYS.all, "pending-cheques"] as const,
};

// Existing hooks...
export const useInvoicePayments = (params?: InvoicePaymentQueryType) => {
    return useQuery({
        queryKey: INVOICE_PAYMENT_QUERY_KEYS.list(params),
        queryFn: () => invoicePaymentsApi.getInvoicePayments(params),
    });
};

export const useInvoicePayment = (id: string) => {
    return useQuery({
        queryKey: INVOICE_PAYMENT_QUERY_KEYS.detail(id),
        queryFn: () => invoicePaymentsApi.getInvoicePaymentById(id),
        enabled: !!id,
    });
};

// ========================================
// NEW: Analytics Hooks
// ========================================

// Get payment analytics
export const usePaymentAnalytics = (params?: {
    startDate?: string;
    endDate?: string;
    partyId?: string;
}) => {
    return useQuery({
        queryKey: INVOICE_PAYMENT_QUERY_KEYS.analytics(params),
        queryFn: () => invoicePaymentsApi.getPaymentAnalytics(params),
    });
};

// Get payment summary
export const usePaymentSummary = () => {
    return useQuery({
        queryKey: INVOICE_PAYMENT_QUERY_KEYS.summary(),
        queryFn: () => invoicePaymentsApi.getPaymentSummary(),
    });
};

// Get payment method summary
export const usePaymentMethodSummary = (params?: {
    startDate?: string;
    endDate?: string;
}) => {
    return useQuery({
        queryKey: INVOICE_PAYMENT_QUERY_KEYS.methodSummary(params),
        queryFn: () => invoicePaymentsApi.getPaymentMethodSummary(params),
    });
};

// Get party payment history
export const usePartyPaymentHistory = (
    partyId: string,
    params?: {
        startDate?: string;
        endDate?: string;
    }
) => {
    return useQuery({
        queryKey: INVOICE_PAYMENT_QUERY_KEYS.partyHistory(partyId, params),
        queryFn: () =>
            invoicePaymentsApi.getPartyPaymentHistory(partyId, params),
        enabled: !!partyId,
    });
};

// Get pending payments
export const usePendingPayments = () => {
    return useQuery({
        queryKey: INVOICE_PAYMENT_QUERY_KEYS.pending(),
        queryFn: () => invoicePaymentsApi.getPendingPayments(),
    });
};

// Get failed payments
export const useFailedPayments = () => {
    return useQuery({
        queryKey: INVOICE_PAYMENT_QUERY_KEYS.failed(),
        queryFn: () => invoicePaymentsApi.getFailedPayments(),
    });
};

// Get pending cheques
export const usePendingCheques = () => {
    return useQuery({
        queryKey: INVOICE_PAYMENT_QUERY_KEYS.pendingCheques(),
        queryFn: () => invoicePaymentsApi.getPendingCheques(),
    });
};

// ========================================
// NEW: Action Mutations
// ========================================

// Retry failed payment
export const useRetryPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => invoicePaymentsApi.retryPayment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: INVOICE_PAYMENT_QUERY_KEYS.all,
            });
            toast.success("Payment retry initiated");
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
            toast.error(
                error?.response?.data?.message || "Failed to retry payment"
            );
        },
    });
};

// Cancel payment
export const useCancelPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            invoicePaymentsApi.cancelPayment(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: INVOICE_PAYMENT_QUERY_KEYS.all,
            });
            toast.success("Payment cancelled successfully");
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
            toast.error(
                error?.response?.data?.message || "Failed to cancel payment"
            );
        },
    });
};

// Refund payment
export const useRefundPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            amount,
            reason,
        }: {
            id: string;
            amount: number;
            reason: string;
        }) => invoicePaymentsApi.refundPayment(id, { amount, reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: INVOICE_PAYMENT_QUERY_KEYS.all,
            });
            toast.success("Payment refunded successfully");
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
            toast.error(
                error?.response?.data?.message || "Failed to refund payment"
            );
        },
    });
};

// Existing mutations (create, update, delete, mark cheque clearance)...
export const useCreateInvoicePayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateInvoicePaymentType) =>
            invoicePaymentsApi.createInvoicePayment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: INVOICE_PAYMENT_QUERY_KEYS.lists(),
            });
            toast.success("Payment created successfully");
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
            toast.error(
                error?.response?.data?.message || "Failed to create payment"
            );
        },
    });
};

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
            toast.success("Payment updated successfully");
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
            toast.error(
                error?.response?.data?.message || "Failed to update payment"
            );
        },
    });
};

export const useDeleteInvoicePayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => invoicePaymentsApi.deleteInvoicePayment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: INVOICE_PAYMENT_QUERY_KEYS.lists(),
            });
            toast.success("Payment deleted successfully");
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
            toast.error(
                error?.response?.data?.message || "Failed to delete payment"
            );
        },
    });
};

export const useMarkChequeClearance = (id: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            clearanceDate?: string;
            charges?: number;
            notes?: string;
        }) => invoicePaymentsApi.markChequeClearance(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: INVOICE_PAYMENT_QUERY_KEYS.detail(id),
            });
            queryClient.invalidateQueries({
                queryKey: INVOICE_PAYMENT_QUERY_KEYS.lists(),
            });
            toast.success("Cheque clearance marked successfully");
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
            toast.error(
                error?.response?.data?.message ||
                    "Failed to mark cheque clearance"
            );
        },
    });
};
