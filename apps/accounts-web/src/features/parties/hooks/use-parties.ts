// apps/accounts-web/src/features/parties/hooks/use-parties.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partiesApi } from "../api/parties.api";
import { toast } from "sonner";
import type {
    CreatePartyType,
    UpdatePartyType,
    PartyQueryType,
} from "@repo/common/schemas";
import { DateRange, Party } from "@repo/common/types";
import { AxiosError } from "axios";

export const PARTY_QUERY_KEYS = {
    all: ["parties"] as const,
    lists: () => [...PARTY_QUERY_KEYS.all, "list"] as const,
    list: (params?: PartyQueryType) =>
        [...PARTY_QUERY_KEYS.lists(), params] as const,
    details: () => [...PARTY_QUERY_KEYS.all, "detail"] as const,
    detail: (id: string) => [...PARTY_QUERY_KEYS.details(), id] as const,
    invoices: (id: string) =>
        [...PARTY_QUERY_KEYS.all, "invoices", id] as const,
    ledger: (
        id: string,
        params?: {
            startDate?: string;
            endDate?: string;
        }
    ) => [...PARTY_QUERY_KEYS.all, "ledger", id, params] as const,
    statement: (id: string, params: DateRange) =>
        [...PARTY_QUERY_KEYS.all, "statement", id, params] as const,
    outstanding: (id: string) =>
        [...PARTY_QUERY_KEYS.all, "outstanding", id] as const,
    comparison: (params?: {
        startDate?: string;
        endDate?: string;
        metric?: string;
    }) => [...PARTY_QUERY_KEYS.all, "comparison", params] as const,
    topParties: (params?: {
        limit: number;
        startDate?: string;
        endDate?: string;
        sortBy?: "amount" | "count" | "outstanding" | "paymentRate";
    }) => [...PARTY_QUERY_KEYS.all, "top-parties", params] as const,
};

// ========================================
// Query Hooks
// ========================================

export const useParties = (params?: PartyQueryType) => {
    return useQuery({
        queryKey: PARTY_QUERY_KEYS.list(params),
        queryFn: () => partiesApi.getParties(params),
    });
};

export const useParty = (id: string) => {
    return useQuery({
        queryKey: PARTY_QUERY_KEYS.detail(id),
        queryFn: () => partiesApi.getPartyById(id),
        enabled: !!id,
    });
};

export const usePartyInvoices = (id: string) => {
    return useQuery({
        queryKey: PARTY_QUERY_KEYS.invoices(id),
        queryFn: () => partiesApi.getPartyInvoices(id),
        enabled: !!id,
    });
};

export const usePartyLedger = (
    id: string,
    params?: {
        startDate?: string;
        endDate?: string;
    }
) => {
    return useQuery({
        queryKey: PARTY_QUERY_KEYS.ledger(id, params),
        queryFn: () => partiesApi.getPartyLedger(id, params),
        enabled: !!id,
    });
};

export const usePartyStatement = (id: string, params: DateRange) => {
    return useQuery({
        queryKey: PARTY_QUERY_KEYS.statement(id, params),
        queryFn: () => partiesApi.getPartyStatement(id, params),
        enabled: !!id && !!params.startDate && !!params.endDate,
    });
};

export const usePartyOutstanding = (id: string) => {
    return useQuery({
        queryKey: PARTY_QUERY_KEYS.outstanding(id),
        queryFn: () => partiesApi.getPartyOutstanding(id),
        enabled: !!id,
    });
};

export const usePartyComparison = (params?: {
    startDate?: string;
    endDate?: string;
    metric?: "amount" | "count" | "payments" | "outstanding";
}) => {
    return useQuery({
        queryKey: PARTY_QUERY_KEYS.comparison(params),
        queryFn: () => partiesApi.getPartyComparison(params),
    });
};

export const useTopParties = (
    limit: number = 10,
    params?: {
        startDate?: string;
        endDate?: string;
        sortBy?: "amount" | "count" | "outstanding" | "paymentRate";
    }
) => {
    const queryParams = { limit, ...params };
    return useQuery({
        queryKey: PARTY_QUERY_KEYS.topParties(queryParams),
        queryFn: () => partiesApi.getTopParties(queryParams),
    });
};

// ========================================
// Mutation Hooks
// ========================================

export const useCreateParty = () => {
    const queryClient = useQueryClient();

    return useMutation<Party, AxiosError<{ message: string }>, CreatePartyType>(
        {
            mutationFn: (data: CreatePartyType) => partiesApi.createParty(data),
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: PARTY_QUERY_KEYS.lists(),
                });
                toast.success("Party created successfully");
            },
            onError: (error) => {
                toast.error(
                    error?.response?.data?.message || "Failed to create party"
                );
            },
        }
    );
};

export const useUpdateParty = (id: string) => {
    const queryClient = useQueryClient();

    return useMutation<Party, AxiosError<{ message: string }>, UpdatePartyType>(
        {
            mutationFn: (data: UpdatePartyType) =>
                partiesApi.updateParty(id, data),
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: PARTY_QUERY_KEYS.detail(id),
                });
                queryClient.invalidateQueries({
                    queryKey: PARTY_QUERY_KEYS.lists(),
                });
                toast.success("Party updated successfully");
            },
            onError: (error) => {
                toast.error(
                    error?.response?.data?.message || "Failed to update party"
                );
            },
        }
    );
};

export const useDeleteParty = () => {
    const queryClient = useQueryClient();

    return useMutation<void, AxiosError<{ message: string }>, string>({
        mutationFn: (id: string) => partiesApi.deleteParty(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: PARTY_QUERY_KEYS.lists(),
            });
            toast.success("Party deleted successfully");
        },
        onError: (error) => {
            toast.error(
                error?.response?.data?.message || "Failed to delete party"
            );
        },
    });
};
