export { prisma } from "./client";

export {
    SaleStatus,
    OCRStatus,
    NotificationType,
    InvoiceStatus,
    LedgerType,
} from "./generated/prisma";

// export * from "./generated/prisma";

export type { Prisma } from "./generated/prisma";

export type {
    EcommerceUserSession,
    LedgerEntry,
    Invoice,
    InvoicePayment,
    SaleReceipt,
} from "./generated/prisma";
