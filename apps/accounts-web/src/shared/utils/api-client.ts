import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { store } from "@/app/store";
import { logout } from "@/app/store/slices/authSlice";

// API Response types
export interface ApiResponse<T> {
    statusCode: number;
    message: string;
    data: T;
}

export interface ApiError {
    statusCode: number;
    message: string;
    errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

// Create service-specific clients
const createServiceClient = (baseURL: string) => {
    const client = axios.create({
        baseURL,
        headers: {
            "Content-Type": "application/json",
        },
        timeout: 30000,
    });

    // Request interceptor - add auth token
    client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const token = store.getState().auth.token;
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response interceptor - handle errors
    client.interceptors.response.use(
        (response) => response.data,
        (error: AxiosError<ApiError>) => {
            // Handle 401 - unauthorized
            if (error.response?.status === 401) {
                store.dispatch(logout());
                window.location.href = "/login";
            }

            // Return error data
            return Promise.reject(
                error.response?.data || {
                    statusCode: 500,
                    message: "An unexpected error occurred",
                }
            );
        }
    );

    return client;
};

// Service clients
export const authService = createServiceClient(
    import.meta.env.VITE_AUTH_API_URL || "http://localhost:3002/api/v1/internal"
);

export const accountsService = createServiceClient(
    import.meta.env.VITE_ACCOUNTS_API_URL || "http://localhost:3001/api/v1"
);

export const ocrService = createServiceClient(
    import.meta.env.VITE_OCR_API_URL || "http://localhost:3003/api/v1"
);

export const notificationService = createServiceClient(
    import.meta.env.VITE_NOTIFICATION_API_URL || "http://localhost:3004/api/v1"
);

export const customerService = createServiceClient(
    import.meta.env.VITE_CUSTOMER_API_URL || "http://localhost:3002/api/v1"
);

export const invoiceService = createServiceClient(
    import.meta.env.VITE_INVOICE_API_URL || "http://localhost:3002/api/v1"
);

export const invoicePaymentService = createServiceClient(
    import.meta.env.VITE_INVOICE_PAYMENT_API_URL ||
        "http://localhost:3002/api/v1"
);

export const partiesService = createServiceClient(
    import.meta.env.VITE_INVOICE_PAYMENT_API_URL ||
        "http://localhost:3002/api/v1"
);

export const salesService = createServiceClient(
    import.meta.env.VITE_INVOICE_PAYMENT_API_URL ||
        "http://localhost:3002/api/v1"
);
