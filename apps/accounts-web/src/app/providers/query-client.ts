import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        },
        mutations: {
            retry: 0,
        },
    },
});

// Query keys factory for organized cache management
export const queryKeys = {
    auth: {
        all: ["auth"] as const,
        profile: () => [...queryKeys.auth.all, "profile"] as const,
    },
    parties: {
        all: ["parties"] as const,
        lists: () => [...queryKeys.parties.all, "list"] as const,
        list: (filters: any) =>
            [...queryKeys.parties.lists(), filters] as const,
        details: () => [...queryKeys.parties.all, "detail"] as const,
        detail: (id: string) => [...queryKeys.parties.details(), id] as const,
        ledger: (id: string) =>
            [...queryKeys.parties.detail(id), "ledger"] as const,
    },
    customers: {
        all: ["customers"] as const,
        lists: () => [...queryKeys.customers.all, "list"] as const,
        list: (filters: any) =>
            [...queryKeys.customers.lists(), filters] as const,
        details: () => [...queryKeys.customers.all, "detail"] as const,
        detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    },
    invoices: {
        all: ["invoices"] as const,
        lists: () => [...queryKeys.invoices.all, "list"] as const,
        list: (filters: any) =>
            [...queryKeys.invoices.lists(), filters] as const,
    },
    sales: {
        all: ["sales"] as const,
        lists: () => [...queryKeys.sales.all, "list"] as const,
        list: (filters: any) => [...queryKeys.sales.lists(), filters] as const,
    },
};
