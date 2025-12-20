/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_AUTH_API_URL: string;
    readonly VITE_ACCOUNTS_API_URL: string;
    readonly VITE_OCR_API_URL: string;
    readonly VITE_NOTIFICATION_API_URL: string;
    readonly VITE_CUSTOMER_API_URL: string;
    readonly VITE_INVOICE_API_URL: string;
    readonly VITE_INVOICE_PAYMENT_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
