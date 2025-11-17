// // apps/accounts-web/src/features/customers/hooks/use-customers.ts

// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { customersApi } from "../api/customers.api";

// import { toast } from "sonner";
// import type {
//     CreateCustomerType,
//     UpdateCustomerType,
//     CustomerQueryType,
// } from "@repo/common/schemas";

// export const CUSTOMER_QUERY_KEYS = {
//     all: ["customers"] as const,
//     lists: () => [...CUSTOMER_QUERY_KEYS.all, "list"] as const,
//     list: (params?: CustomerQueryType) =>
//         [...CUSTOMER_QUERY_KEYS.lists(), params] as const,
//     details: () => [...CUSTOMER_QUERY_KEYS.all, "detail"] as const,
//     detail: (id: string) => [...CUSTOMER_QUERY_KEYS.details(), id] as const,
//     ledger: (id: string, params?: any) =>
//         [...CUSTOMER_QUERY_KEYS.all, "ledger", id, params] as const,
//     statement: (id: string, params?: any) =>
//         [...CUSTOMER_QUERY_KEYS.all, "statement", id, params] as const,
// };

// // Get all customers
// export const useCustomers = (params?: CustomerQueryType) => {
//     return useQuery({
//         queryKey: CUSTOMER_QUERY_KEYS.list(params),
//         queryFn: () => customersApi.getCustomers(params),
//     });
// };

// // Get customer by ID
// export const useCustomer = (id: string) => {
//     return useQuery({
//         queryKey: CUSTOMER_QUERY_KEYS.detail(id),
//         queryFn: () => customersApi.getCustomerById(id),
//         enabled: !!id,
//     });
// };

// // Get customer ledger
// export const useCustomerLedger = (
//     id: string,
//     params?: { startDate?: string; endDate?: string }
// ) => {
//     return useQuery({
//         queryKey: CUSTOMER_QUERY_KEYS.ledger(id, params),
//         queryFn: () => customersApi.getCustomerLedger(id, params),
//         enabled: !!id,
//     });
// };

// // Get customer statement
// export const useCustomerStatement = (
//     id: string,
//     params?: { startDate?: string; endDate?: string }
// ) => {
//     return useQuery({
//         queryKey: CUSTOMER_QUERY_KEYS.statement(id, params),
//         queryFn: () => customersApi.getCustomerStatement(id, params),
//         enabled: !!id,
//     });
// };

// // Create customer mutation
// export const useCreateCustomer = () => {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: (data: CreateCustomerType) =>
//             customersApi.createCustomer(data),
//         onSuccess: () => {
//             queryClient.invalidateQueries({
//                 queryKey: CUSTOMER_QUERY_KEYS.lists(),
//             });
//             toast.success("Customer created successfully");
//         },
//         onError: (error: any) => {
//             toast.error(
//                 error?.response?.data?.message || "Failed to create customer"
//             );
//         },
//     });
// };

// // Update customer mutation
// export const useUpdateCustomer = (id: string) => {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: (data: UpdateCustomerType) =>
//             customersApi.updateCustomer(id, data),
//         onSuccess: () => {
//             queryClient.invalidateQueries({
//                 queryKey: CUSTOMER_QUERY_KEYS.detail(id),
//             });
//             queryClient.invalidateQueries({
//                 queryKey: CUSTOMER_QUERY_KEYS.lists(),
//             });
//             toast.success("Customer updated successfully");
//         },
//         onError: (error: any) => {
//             toast.error(
//                 error?.response?.data?.message || "Failed to update customer"
//             );
//         },
//     });
// };

// // Delete customer mutation
// export const useDeleteCustomer = () => {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: (id: string) => customersApi.deleteCustomer(id),
//         onSuccess: () => {
//             queryClient.invalidateQueries({
//                 queryKey: CUSTOMER_QUERY_KEYS.lists(),
//             });
//             toast.success("Customer deleted successfully");
//         },
//         onError: (error: any) => {
//             toast.error(
//                 error?.response?.data?.message || "Failed to delete customer"
//             );
//         },
//     });
// };

// apps/accounts-web/src/features/customers/hooks/use-customers.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "../api/customers.api";
import { toast } from "sonner";
import type {
    CreateCustomerType,
    UpdateCustomerType,
    CustomerQueryType,
} from "@repo/common/schemas"; // apps/accounts-web/src/features/customers/hooks/use-customers.ts
import { ApiErrorResponse } from "@repo/common/types";

// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { customersApi } from "../api/customers.api";

// import { toast } from "sonner";
// import type {
//     CreateCustomerType,
//     UpdateCustomerType,
//     CustomerQueryType,
// } from "@repo/common/schemas";

// export const CUSTOMER_QUERY_KEYS = {
//     all: ["customers"] as const,
//     lists: () => [...CUSTOMER_QUERY_KEYS.all, "list"] as const,
//     list: (params?: CustomerQueryType) =>
//         [...CUSTOMER_QUERY_KEYS.lists(), params] as const,
//     details: () => [...CUSTOMER_QUERY_KEYS.all, "detail"] as const,
//     detail: (id: string) => [...CUSTOMER_QUERY_KEYS.details(), id] as const,
//     ledger: (id: string, params?: any) =>
//         [...CUSTOMER_QUERY_KEYS.all, "ledger", id, params] as const,
//     statement: (id: string, params?: any) =>
//         [...CUSTOMER_QUERY_KEYS.all, "statement", id, params] as const,
// };

// // Get all customers
// export const useCustomers = (params?: CustomerQueryType) => {
//     return useQuery({
//         queryKey: CUSTOMER_QUERY_KEYS.list(params),
//         queryFn: () => customersApi.getCustomers(params),
//     });
// };

// // Get customer by ID
// export const useCustomer = (id: string) => {
//     return useQuery({
//         queryKey: CUSTOMER_QUERY_KEYS.detail(id),
//         queryFn: () => customersApi.getCustomerById(id),
//         enabled: !!id,
//     });
// };

// // Get customer ledger
// export const useCustomerLedger = (
//     id: string,
//     params?: { startDate?: string; endDate?: string }
// ) => {
//     return useQuery({
//         queryKey: CUSTOMER_QUERY_KEYS.ledger(id, params),
//         queryFn: () => customersApi.getCustomerLedger(id, params),
//         enabled: !!id,
//     });
// };

// // Get customer statement
// export const useCustomerStatement = (
//     id: string,
//     params?: { startDate?: string; endDate?: string }
// ) => {
//     return useQuery({
//         queryKey: CUSTOMER_QUERY_KEYS.statement(id, params),
//         queryFn: () => customersApi.getCustomerStatement(id, params),
//         enabled: !!id,
//     });
// };

// // Create customer mutation
// export const useCreateCustomer = () => {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: (data: CreateCustomerType) =>
//             customersApi.createCustomer(data),
//         onSuccess: () => {
//             queryClient.invalidateQueries({
//                 queryKey: CUSTOMER_QUERY_KEYS.lists(),
//             });
//             toast.success("Customer created successfully");
//         },
//         onError: (error: any) => {
//             toast.error(
//                 error?.response?.data?.message || "Failed to create customer"
//             );
//         },
//     });
// };

// // Update customer mutation
// export const useUpdateCustomer = (id: string) => {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: (data: UpdateCustomerType) =>
//             customersApi.updateCustomer(id, data),
//         onSuccess: () => {
//             queryClient.invalidateQueries({
//                 queryKey: CUSTOMER_QUERY_KEYS.detail(id),
//             });
//             queryClient.invalidateQueries({
//                 queryKey: CUSTOMER_QUERY_KEYS.lists(),
//             });
//             toast.success("Customer updated successfully");
//         },
//         onError: (error: any) => {
//             toast.error(
//                 error?.response?.data?.message || "Failed to update customer"
//             );
//         },
//     });
// };

// // Delete customer mutation
// export const useDeleteCustomer = () => {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: (id: string) => customersApi.deleteCustomer(id),
//         onSuccess: () => {
//             queryClient.invalidateQueries({
//                 queryKey: CUSTOMER_QUERY_KEYS.lists(),
//             });
//             toast.success("Customer deleted successfully");
//         },
//         onError: (error: any) => {
//             toast.error(
//                 error?.response?.data?.message || "Failed to delete customer"
//             );
//         },
//     });
// };

export const CUSTOMER_QUERY_KEYS = {
    all: ["customers"] as const,
    lists: () => [...CUSTOMER_QUERY_KEYS.all, "list"] as const,
    list: (params?: CustomerQueryType) =>
        [...CUSTOMER_QUERY_KEYS.lists(), params] as const,
    details: () => [...CUSTOMER_QUERY_KEYS.all, "detail"] as const,
    detail: (id: string) => [...CUSTOMER_QUERY_KEYS.details(), id] as const,
    ledger: (id: string, params?: any) =>
        [...CUSTOMER_QUERY_KEYS.all, "ledger", id, params] as const,
    statement: (id: string, params: { startDate: string; endDate: string }) =>
        [...CUSTOMER_QUERY_KEYS.all, "statement", id, params] as const,
    analytics: (params?: { startDate?: string; endDate?: string }) =>
        [...CUSTOMER_QUERY_KEYS.all, "analytics", params] as const,
    lifetimeValue: (id: string) =>
        [...CUSTOMER_QUERY_KEYS.all, "lifetime-value", id] as const,
    creditStatus: (status: string) =>
        [...CUSTOMER_QUERY_KEYS.all, "credit-status", status] as const,
    outstanding: () => [...CUSTOMER_QUERY_KEYS.all, "outstanding"] as const,
    birthdays: () => [...CUSTOMER_QUERY_KEYS.all, "birthdays"] as const,
    anniversaries: () => [...CUSTOMER_QUERY_KEYS.all, "anniversaries"] as const,
    search: (query: string) =>
        [...CUSTOMER_QUERY_KEYS.all, "search", query] as const,
};

// ========================================
// Query Hooks
// ========================================

export const useCustomers = (params?: CustomerQueryType) => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.list(params),
        queryFn: () => customersApi.getCustomers(params),
    });
};

export const useCustomer = (id: string) => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.detail(id),
        queryFn: () => customersApi.getCustomerById(id),
        enabled: !!id,
    });
};

export const useCustomerLedger = (
    id: string,
    params?: {
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    },
    options?: {
        enabled?: boolean;
    }
) => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.ledger(id, params),
        queryFn: () => customersApi.getCustomerLedger(id, params),
        // enabled: !!id,
        enabled: options?.enabled ?? !!id,
    });
};

export const useCustomerStatement = (
    id: string,
    params: {
        startDate: string;
        endDate: string;
    },
    options?: {
        enabled?: boolean;
    }
) => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.statement(id, params),
        queryFn: () => customersApi.getCustomerStatement(id, params),
        // enabled: !!id && !!params.startDate && !!params.endDate,
        enabled:
            (options?.enabled ?? true) &&
            !!id &&
            !!params.startDate &&
            !!params.endDate,
    });
};

export const useCustomerAnalytics = (params?: {
    startDate?: string;
    endDate?: string;
}) => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.analytics(params),
        queryFn: () => customersApi.getCustomerAnalytics(params),
    });
};

export const useCustomerLifetimeValue = (id: string) => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.lifetimeValue(id),
        queryFn: () => customersApi.getCustomerLifetimeValue(id),
        enabled: !!id,
    });
};

export const useCustomersByCreditStatus = (
    status: "SAFE" | "WARNING" | "EXCEEDED"
) => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.creditStatus(status),
        queryFn: () => customersApi.getCustomersByCreditStatus(status),
    });
};

export const useCustomersWithOutstanding = () => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.outstanding(),
        queryFn: () => customersApi.getCustomersWithOutstanding(),
    });
};

export const useBirthdayCustomers = () => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.birthdays(),
        queryFn: () => customersApi.getBirthdayCustomers(),
    });
};

export const useAnniversaryCustomers = () => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.anniversaries(),
        queryFn: () => customersApi.getAnniversaryCustomers(),
    });
};

export const useSearchCustomers = (query: string) => {
    return useQuery({
        queryKey: CUSTOMER_QUERY_KEYS.search(query),
        queryFn: () => customersApi.searchCustomers(query),
        enabled: query.length >= 2,
    });
};

// ========================================
// Mutation Hooks
// ========================================

export const useCreateCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCustomerType) =>
            customersApi.createCustomer(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: CUSTOMER_QUERY_KEYS.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: CUSTOMER_QUERY_KEYS.analytics(),
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

export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => customersApi.deleteCustomer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: CUSTOMER_QUERY_KEYS.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: CUSTOMER_QUERY_KEYS.analytics(),
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

export const useSendPaymentReminder = () => {
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: {
                channel: "EMAIL" | "WHATSAPP" | "SMS";
                message?: string;
            };
        }) => customersApi.sendPaymentReminder(id, data),
        onSuccess: () => {
            toast.success("Payment reminder sent successfully");
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                    "Failed to send payment reminder"
            );
        },
    });
};

export const useUpdateCreditLimit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            creditLimit,
        }: {
            id: string;
            creditLimit: number;
        }) => customersApi.updateCreditLimit(id, creditLimit),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: CUSTOMER_QUERY_KEYS.detail(variables.id),
            });
            queryClient.invalidateQueries({
                queryKey: CUSTOMER_QUERY_KEYS.lists(),
            });
            toast.success("Credit limit updated successfully");
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                    "Failed to update credit limit"
            );
        },
    });
};

export const useToggleActiveStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => customersApi.toggleActiveStatus(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({
                queryKey: CUSTOMER_QUERY_KEYS.detail(id),
            });
            queryClient.invalidateQueries({
                queryKey: CUSTOMER_QUERY_KEYS.lists(),
            });
            toast.success("Customer status updated successfully");
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message || "Failed to update status"
            );
        },
    });
};

export const useMergeCustomers = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sourceId,
            targetId,
        }: {
            sourceId: string;
            targetId: string;
        }) => customersApi.mergeCustomers(sourceId, targetId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: CUSTOMER_QUERY_KEYS.all,
            });
            toast.success("Customers merged successfully");
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message || "Failed to merge customers"
            );
        },
    });
};
