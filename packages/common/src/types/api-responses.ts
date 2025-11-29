// // ============================================
// // COMMON TYPES & UTILITIES
// // ============================================

// export interface ApiResponse<T = any> {
//     success: boolean;
//     message: string;
//     data?: T;
//     error?: any;
//     statusCode: number;
// }

// export interface ApiErrorResponse {
//     statusCode: number;
//     message: string;
//     success: false;
//     errors?: Array<{
//         field: string;
//         message: string;
//     }>;
// }

// export interface PaginationParams {
//     page: number;
//     limit: number;
//     search?: string;
//     sortBy?: string;
//     sortOrder?: "asc" | "desc";
// }

// export interface PaginationMeta {
//     total: number;
//     page: number;
//     limit: number;
//     pages: number;
// }

// // export interface PaginatedResponse<T> {
// //     items: T[];
// //     pagination: PaginationMeta;
// // }

// export interface PaginatedResponse<T> {
//     data: T[];
//     meta: {
//         page: number;
//         limit: number;
//         total: number;
//         totalPages: number;
//     };
// }
// export interface DateRange {
//     startDate: string;
//     endDate: string;
// }
// // Enum types from Prisma
// export type UserRole = "OWNER" | "MANAGER" | "STAFF" | "VIEWER" | "ACCOUNTANT";
// export type InvoiceStatus =
//     | "PENDING"
//     | "PARTIALLY_PAID"
//     | "PAID"
//     | "OVERDUE"
//     | "CANCELLED";
// export type SaleStatus =
//     | "PENDING"
//     | "PARTIALLY_PAID"
//     | "PAID"
//     | "OVERDUE"
//     | "CANCELLED"
//     | "RETURNED";
// export type PaymentMethod =
//     | "CASH"
//     | "BANK_TRANSFER"
//     | "CHEQUE"
//     | "UPI"
//     | "CARD"
//     | "ONLINE"
//     | "OTHER";
// export type PaymentStatus =
//     | "PENDING"
//     | "COMPLETED"
//     | "FAILED"
//     | "CANCELLED"
//     | "REFUNDED";
// export type OrderStatus =
//     | "PENDING"
//     | "CONFIRMED"
//     | "PROCESSING"
//     | "SHIPPED"
//     | "DELIVERED"
//     | "CANCELLED"
//     | "RETURNED";
// export type StockMovementEnumType = "IN" | "OUT" | "ADJUSTMENT";
// export type Gender = "MALE" | "FEMALE" | "OTHER";

// // ============================================
// // AUTH SERVICE TYPES
// // ============================================

// export interface User {
//     id: string;
//     name: string;
//     email: string;
//     phone?: string | null;
//     role: "OWNER" | "MANAGER" | "STAFF";
//     isActive: boolean;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface UserSession {
//     id: string;
//     userId: string;
//     token: string;
//     refreshToken?: string | null;
//     ipAddress?: string | null;
//     userAgent?: string | null;
//     expiresAt: string;
//     createdAt: string;
// }

// export interface LoginRequest {
//     email: string;
//     password: string;
// }

// export interface LoginResponse {
//     user: User;
//     session: UserSession;
//     token: string;
//     refreshToken?: string;
// }

// export interface RegisterRequest {
//     name: string;
//     email: string;
//     password: string;
//     phone?: string;
//     role?: "OWNER" | "MANAGER" | "STAFF";
// }

// export interface RegisterResponse {
//     user: User;
//     session: UserSession;
//     token: string;
// }

// export interface UpdateProfileRequest {
//     name?: string;
//     phone?: string;
//     email?: string;
// }

// export interface ChangePasswordRequest {
//     currentPassword: string;
//     newPassword: string;
// }

// export interface EcommerceUser {
//     id: string;
//     name: string;
//     email: string;
//     phone?: string | null;
//     address?: string | null;
//     city?: string | null;
//     state?: string | null;
//     pincode?: string | null;
//     isActive: boolean;
//     createdAt: string;
//     updatedAt: string;
// }

// // ============================================
// // ACCOUNTS SERVICE - CUSTOMER TYPES
// // ============================================

// export interface Customer {
//     id: string;
//     name: string;
//     phone?: string | null;
//     email?: string | null;
//     address?: string | null;
//     city?: string | null;
//     state?: string | null;
//     pincode?: string | null;
//     gstNumber?: string | null;
//     creditLimit: number;

//     // Additional fields
//     dateOfBirth?: string | null;
//     anniversary?: string | null;
//     preferredContact?: string | null; // email, phone, whatsapp
//     tags: string[]; // VIP, Regular, New, etc.
//     notes?: string | null;
//     isActive: boolean;

//     userId: string;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface CustomerLedger {
//     id: string;
//     date: string;
//     description: string;
//     debit: number;
//     credit: number;
//     balance: number;
//     type: string;
//     reference?: string;
// }

// export interface CustomerStatement {
//     customer: Customer;
//     openingBalance: number;
//     closingBalance: number;
//     totalSales: number;
//     totalReceipts: number;
//     entries: CustomerLedger[];
//     period: DateRange;
// }

// export interface CustomerAnalytics {
//     totalCustomers: number;
//     activeCustomers: number;
//     inactiveCustomers: number;
//     totalCreditLimit: number;
//     averageCreditLimit: number;
//     customersWithGST: number;
//     customersWithoutGST: number;
//     topCustomersByRevenue: Array<{
//         customer: Customer;
//         totalRevenue: number;
//         totalSales: number;
//     }>;
// }

// // ============================================
// // ACCOUNTS SERVICE - PARTY TYPES
// // ============================================

// export interface Party {
//     id: string;
//     name: string;
//     gstNo?: string | null;
//     panNo?: string | null;
//     phone?: string | null;
//     email?: string | null;
//     address?: string | null;
//     city?: string | null;
//     state?: string | null;
//     pincode?: string | null;
//     contactPerson?: string | null;
//     bankDetails?: any | null; // JSON: {bankName, accountNo, ifsc, branch}

//     // Additional fields
//     category?: string | null; // Manufacturer, Distributor, Wholesaler
//     paymentTerms?: number | null; // Payment terms in days
//     creditLimit: number;
//     taxId?: string | null;
//     website?: string | null;
//     notes?: string | null;
//     isActive: boolean;

//     userId: string;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface PartyLedger {
//     id: string;
//     date: string;
//     description: string;
//     debit: number;
//     credit: number;
//     balance: number;
//     type: string;
//     reference?: string;
// }

// export interface PartyStatement {
//     party: Party;
//     openingBalance: number;
//     closingBalance: number;
//     totalInvoices: number;
//     totalPayments: number;
//     entries: PartyLedger[];
//     period: DateRange;
// }

// export interface PartyComparison {
//     partyId: string;
//     partyName: string;
//     invoiceCount: number;
//     invoiceAmount: number;
//     paymentAmount: number;
//     outstandingAmount: number;
//     paymentRate: number; // percentage
// }

// export interface PartyComparisonAnalytics {
//     period: DateRange;
//     metric: "amount" | "count" | "payments" | "outstanding";
//     comparison: PartyComparison[];
//     summary: {
//         totalInvoiceAmount: number;
//         totalPaymentAmount: number;
//         totalOutstanding: number;
//         averagePaymentRate: number;
//     };
// }

// // ============================================
// // ACCOUNTS SERVICE - SALE TYPES
// // ============================================

// // Sale items are stored as JSON in the database
// export interface SaleItem {
//     inventoryItemId?: string;
//     itemName: string;
//     itemType?: string;
//     design?: string;
//     color?: string;
//     price: number;
//     quantity: number;
//     total: number;
//     hsnCode?: string;
//     unit: string;
// }

// export interface Sale {
//     id: string;
//     voucherId: string;
//     saleNo: string;
//     date: string;
//     amount: number;
//     paidAmount: number;
//     remainingAmount: number;
//     status: SaleStatus;

//     // Items stored as JSON
//     items: SaleItem[];

//     // Financial details
//     taxAmount?: number | null;
//     discountAmount?: number | null;
//     roundOffAmount?: number | null;

//     // Additional sale details
//     salesPerson?: string | null;
//     deliveryDate?: string | null;
//     deliveryAddress?: string | null;
//     transportation?: string | null;
//     vehicleNo?: string | null;
//     reference?: string | null;
//     terms?: string | null;
//     notes?: string | null;

//     customerId: string;
//     customer?: Customer;

//     userId: string;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface SaleAnalytics {
//     totalSales: number;
//     totalAmount: number;
//     paidAmount: number;
//     unpaidAmount: number;
//     averageSaleValue: number;
//     salesByStatus: Array<{
//         status: string;
//         count: number;
//         amount: number;
//     }>;
//     salesByPaymentStatus: Array<{
//         paymentStatus: string;
//         count: number;
//         amount: number;
//     }>;
//     topCustomers: Array<{
//         customerId: string;
//         customerName: string;
//         totalSales: number;
//         totalAmount: number;
//     }>;
// }

// export interface OverdueSale {
//     sale: Sale;
//     customer: Customer;
//     daysOverdue: number;
//     balanceAmount: number;
// }

// // ============================================
// // ACCOUNTS SERVICE - SALE RECEIPT TYPES
// // ============================================

// export interface SaleReceipt {
//     id: string;
//     voucherId: string;
//     receiptNo: string;
//     date: string;
//     amount: number;
//     method: PaymentMethod;
//     description?: string | null;
//     reference?: string | null;
//     imageUrl?: string | null;

//     // Banking details
//     bankName?: string | null;
//     chequeNo?: string | null;
//     chequeDate?: string | null;
//     clearanceDate?: string | null;
//     charges?: number | null;

//     customerId: string;
//     customer?: Customer;

//     saleId?: string | null;
//     sale?: Sale;

//     userId: string;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface SaleReceiptAnalytics {
//     totalReceipts: number;
//     totalAmount: number;
//     clearedAmount: number;
//     unclearedAmount: number;
//     averageReceiptValue: number;
//     receiptsByMethod: Array<{
//         method: string;
//         count: number;
//         amount: number;
//     }>;
//     receiptsByStatus: Array<{
//         cleared: boolean;
//         count: number;
//         amount: number;
//     }>;
// }

// // ============================================
// // ACCOUNTS SERVICE - INVOICE TYPES
// // ============================================

// // Invoice items are stored as JSON in the database
// export interface InvoiceItem {
//     description: string;
//     quantity: number;
//     rate: number;
//     amount: number;
//     hsnCode?: string;
//     taxRate?: number;
//     unit?: string;
// }

// export interface Invoice {
//     id: string;
//     voucherId: string;
//     invoiceNo: string;
//     date: string;
//     dueDate?: string | null;
//     amount: number;
//     paidAmount: number;
//     remainingAmount: number;
//     status: InvoiceStatus;

//     // Items stored as JSON
//     items?: InvoiceItem[] | null;

//     description?: string | null;
//     taxAmount?: number | null;
//     discountAmount?: number | null;
//     roundOffAmount?: number | null;
//     notes?: string | null;

//     // Additional invoice fields (textile-specific)
//     poNumber?: string | null;
//     transportMode?: string | null;
//     vehicleNo?: string | null;
//     deliveryNote?: string | null;
//     supplierRef?: string | null;
//     otherRef?: string | null;
//     buyersOrderNo?: string | null;
//     dispatchedThrough?: string | null;
//     destination?: string | null;

//     partyId: string;
//     party?: {
//         id: string;
//         name: string;
//         gstNo?: string | null;
//         email?: string | null;
//         phone?: string | null;
//     };

//     userId: string;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface InvoiceAnalytics {
//     totalInvoices: number;
//     totalAmount: number;
//     paidAmount: number;
//     unpaidAmount: number;
//     averageInvoiceValue: number;
//     invoicesByStatus: Array<{
//         status: string;
//         count: number;
//         amount: number;
//     }>;
//     invoicesByPaymentStatus: Array<{
//         paymentStatus: string;
//         count: number;
//         amount: number;
//     }>;
//     topParties: Array<{
//         partyId: string;
//         partyName: string;
//         totalInvoices: number;
//         totalAmount: number;
//     }>;
// }

// export interface OverdueInvoice {
//     invoice: Invoice;
//     party: Party;
//     daysOverdue: number;
//     balanceAmount: number;
// }

// // ============================================
// // ACCOUNTS SERVICE - INVOICE PAYMENT TYPES
// // ============================================

// export interface InvoicePayment {
//     id: string;
//     voucherId: string;
//     amount: number;
//     date: string;
//     method: PaymentMethod;
//     reference?: string | null;
//     description?: string | null;
//     status: PaymentStatus;

//     // Gateway fields for online payments
//     gatewayOrderId?: string | null;
//     gatewayPaymentId?: string | null;
//     transactionId?: string | null;
//     failureReason?: string | null;

//     // Banking details
//     bankName?: string | null;
//     chequeNo?: string | null;
//     chequeDate?: string | null;
//     clearanceDate?: string | null;
//     charges?: number | null;

//     partyId: string;
//     party?: {
//         id: string;
//         name: string;
//         gstNo?: string | null;
//         email?: string | null;
//         phone?: string | null;
//     };

//     invoiceId?: string | null;
//     invoice?: Invoice;

//     userId: string;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface InvoicePaymentAnalytics {
//     totalPayments: number;
//     totalAmount: number;
//     clearedAmount: number;
//     pendingAmount: number;
//     averagePaymentValue: number;
//     paymentsByMethod: Array<{
//         method: string;
//         count: number;
//         amount: number;
//     }>;
//     paymentsByStatus: Array<{
//         status: string;
//         count: number;
//         amount: number;
//     }>;
// }

// export interface PaymentSummary {
//     period: {
//         startDate: string;
//         endDate: string;
//     };
//     overview: {
//         totalPayments: number;
//         totalCharges: number;
//         paymentCount: number;
//         averagePayment: number;
//         netPayments: number;
//     };
//     statusBreakdown: Array<{
//         status: string;
//         amount: number;
//         count: number;
//     }>;
//     methodBreakdown: Array<{
//         method: string;
//         amount: number;
//         count: number;
//         charges: number;
//         averageAmount: number;
//     }>;
// }
// // ============================================
// // ACCOUNTS SERVICE - INVENTORY TYPES
// // ============================================

// export interface InventoryItem {
//     id: string;
//     productName: string;
//     sku?: string | null;
//     fabricType?: string | null;
//     gsm?: number | null; // grams per square meter
//     width?: number | null; // in cm or inches
//     color?: string | null;
//     design?: string | null;
//     weaveType?: string | null;
//     quantity: number;
//     unit: string;
//     unitPrice: number;
//     reorderQuantity: number;
//     minStockLevel: number;
//     maxStockLevel: number;
//     location?: string | null;
//     description?: string | null;
//     imageUrl?: string | null;
//     tags: string[];
//     isActive: boolean;
//     createdAt: string;
//     updatedAt: string;
//     userId: string;
// }

// export interface StockMovement {
//     id: string;
//     inventoryItemId: string;
//     inventoryItem?: InventoryItem;
//     type: "IN" | "OUT" | "ADJUSTMENT";
//     quantity: number;
//     previousQuantity: number;
//     newQuantity: number;
//     reference?: string | null;
//     referenceType?: "SALE" | "INVOICE" | "ADJUSTMENT" | "RETURN" | null;
//     notes?: string | null;
//     date: string;
//     createdAt: string;
//     userId: string;
// }

// export interface LowStockItem {
//     item: InventoryItem;
//     currentStock: number;
//     minStockLevel: number;
//     reorderQuantity: number;
//     stockDeficit: number;
// }

// export interface InventoryAnalytics {
//     totalItems: number;
//     activeItems: number;
//     inactiveItems: number;
//     lowStockItems: number;
//     totalStockValue: number;
//     averageStockValue: number;
//     itemsByCategory: Array<{
//         fabricType: string;
//         count: number;
//         totalValue: number;
//     }>;
// }

// export interface StockOperationRequest {
//     quantity: number;
//     notes?: string;
//     reference?: string;
//     referenceType?: "SALE" | "INVOICE" | "ADJUSTMENT" | "RETURN";
// }

// export interface StockOperationResponse {
//     item: InventoryItem;
//     movement: StockMovement;
//     previousQuantity: number;
//     newQuantity: number;
// }

// // ============================================
// // ACCOUNTS SERVICE - FINANCIAL REPORT TYPES
// // ============================================

// export interface LedgerEntry {
//     id: string;
//     accountType:
//         | "CUSTOMER"
//         | "PARTY"
//         | "CASH"
//         | "BANK"
//         | "SALES"
//         | "PURCHASES"
//         | "EXPENSES";
//     accountId?: string | null;
//     accountName: string;
//     date: string;
//     description: string;
//     debit: number;
//     credit: number;
//     balance: number;
//     reference?: string | null;
//     referenceType?: string | null;
//     createdAt: string;
//     userId: string;
// }

// export interface TrialBalance {
//     period: DateRange;
//     accounts: Array<{
//         accountName: string;
//         accountType: string;
//         debit: number;
//         credit: number;
//         balance: number;
//     }>;
//     totals: {
//         totalDebit: number;
//         totalCredit: number;
//     };
// }

// export interface BalanceSheet {
//     asOfDate: string;
//     assets: {
//         currentAssets: Array<{
//             name: string;
//             amount: number;
//         }>;
//         fixedAssets: Array<{
//             name: string;
//             amount: number;
//         }>;
//         totalAssets: number;
//     };
//     liabilities: {
//         currentLiabilities: Array<{
//             name: string;
//             amount: number;
//         }>;
//         longTermLiabilities: Array<{
//             name: string;
//             amount: number;
//         }>;
//         totalLiabilities: number;
//     };
//     equity: {
//         capital: number;
//         retainedEarnings: number;
//         currentYearProfit: number;
//         totalEquity: number;
//     };
// }

// export interface ProfitLossStatement {
//     period: DateRange;
//     revenue: {
//         sales: number;
//         otherIncome: number;
//         totalRevenue: number;
//     };
//     expenses: {
//         purchases: number;
//         operatingExpenses: number;
//         otherExpenses: number;
//         totalExpenses: number;
//     };
//     grossProfit: number;
//     netProfit: number;
//     profitMargin: number;
// }

// export interface CashFlowStatement {
//     period: DateRange;
//     operatingActivities: {
//         receiptsFromCustomers: number;
//         paymentsToSuppliers: number;
//         otherOperatingReceipts: number;
//         otherOperatingPayments: number;
//         netOperatingCashFlow: number;
//     };
//     investingActivities: {
//         purchaseOfAssets: number;
//         saleOfAssets: number;
//         netInvestingCashFlow: number;
//     };
//     financingActivities: {
//         capitalIntroduced: number;
//         drawings: number;
//         loansReceived: number;
//         loansRepaid: number;
//         netFinancingCashFlow: number;
//     };
//     netCashFlow: number;
//     openingCash: number;
//     closingCash: number;
// }

// export interface GSTReport {
//     period: DateRange;
//     gstr1: {
//         b2bSales: Array<{
//             customerName: string;
//             gstNumber: string;
//             invoiceNo: string;
//             invoiceDate: string;
//             invoiceValue: number;
//             taxableValue: number;
//             cgst: number;
//             sgst: number;
//             igst: number;
//         }>;
//         b2cSales: Array<{
//             invoiceNo: string;
//             invoiceDate: string;
//             invoiceValue: number;
//             taxableValue: number;
//             taxRate: number;
//             taxAmount: number;
//         }>;
//         totalSales: number;
//         totalTaxCollected: number;
//     };
//     gstr2: {
//         b2bPurchases: Array<{
//             partyName: string;
//             gstNumber: string;
//             invoiceNo: string;
//             invoiceDate: string;
//             invoiceValue: number;
//             taxableValue: number;
//             cgst: number;
//             sgst: number;
//             igst: number;
//         }>;
//         totalPurchases: number;
//         totalInputTaxCredit: number;
//     };
//     gstr3b: {
//         outwardTaxableSupplies: number;
//         inwardTaxableSupplies: number;
//         outputTax: number;
//         inputTaxCredit: number;
//         netGSTPayable: number;
//         interestPayable: number;
//         lateFeesPayable: number;
//         totalPayable: number;
//     };
// }

// export interface TDSReport {
//     period: DateRange;
//     deductions: Array<{
//         partyName: string;
//         panNumber: string;
//         paymentDate: string;
//         amount: number;
//         tdsRate: number;
//         tdsAmount: number;
//         section: string;
//     }>;
//     summary: {
//         totalPayments: number;
//         totalTDSDeducted: number;
//         tdsToBeDeposited: number;
//         tdsDeposited: number;
//         tdsBalance: number;
//     };
// }

// // ============================================
// // OCR SERVICE TYPES
// // ============================================

// export type OCRStatus =
//     | "PENDING"
//     | "PROCESSING"
//     | "COMPLETED"
//     | "FAILED"
//     | "REVIEW_REQUIRED"
//     | "APPROVED"
//     | "REJECTED";

// export interface OCRExtractedData {
//     // Invoice/Receipt fields
//     invoiceNo?: string;
//     invoiceDate?: string;
//     dueDate?: string;

//     // Party/Customer details
//     partyName?: string;
//     partyAddress?: string;
//     partyPhone?: string;
//     partyEmail?: string;
//     partyGST?: string;

//     // Amounts
//     subtotal?: number;
//     taxAmount?: number;
//     totalAmount?: number;
//     discountAmount?: number;

//     // Items
//     items?: Array<{
//         productName?: string;
//         quantity?: number;
//         unit?: string;
//         unitPrice?: number;
//         totalAmount?: number;
//     }>;

//     // Additional fields
//     notes?: string;
//     paymentTerms?: string;

//     // Raw text
//     rawText?: string;
// }

// export interface OCRQualityCheck {
//     imageQuality: "GOOD" | "FAIR" | "POOR";
//     textClarity: "CLEAR" | "MODERATE" | "UNCLEAR";
//     rotation: number;
//     hasMultiplePages: boolean;
//     recommendations: string[];
// }

// export interface OCRDuplicateCheck {
//     isDuplicate: boolean;
//     duplicateOf?: string;
//     similarity?: number;
//     matchedFields?: string[];
// }

// export interface OCRFieldConfidence {
//     [fieldName: string]: number; // confidence score 0-1
// }

// export interface OCRData {
//     id: string;
//     userId: string;
//     imageUrl: string;
//     documentType: "invoice" | "invoice_payment" | "sale_receipt";
//     status: OCRStatus;
//     confidence: number;
//     extractedData: OCRExtractedData;
//     correctedData?: OCRExtractedData;
//     fieldConfidence?: OCRFieldConfidence;
//     lowConfidenceFields?: string[];
//     invalidFields?: string[];
//     qualityCheck?: OCRQualityCheck;
//     duplicateCheck?: OCRDuplicateCheck;
//     reviewedBy?: string | null;
//     reviewedAt?: string | null;
//     reviewNotes?: string | null;
//     approvedBy?: string | null;
//     approvedAt?: string | null;
//     rejectedBy?: string | null;
//     rejectedAt?: string | null;
//     rejectionReason?: string | null;
//     linkedRecordId?: string | null;
//     linkedRecordType?: string | null;
//     processingTime?: number; // milliseconds
//     errorMessage?: string | null;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface OCRUploadRequest {
//     document: File;
//     documentType: "invoice" | "invoice_payment" | "sale_receipt";
// }

// export interface OCRUploadResponse {
//     ocrId: string;
//     imageUrl: string;
//     status: "PROCESSING";
//     message: string;
// }

// export interface OCRReviewRequest {
//     correctedData: Partial<OCRExtractedData>;
//     notes?: string;
//     acceptDuplicate?: boolean;
// }

// export interface OCRApproveRequest {
//     createRecord: boolean;
//     documentType: "invoice" | "invoice_payment" | "sale_receipt";
// }

// export interface OCRApproveResponse {
//     ocrData: OCRData;
//     createdRecordId?: string;
//     createdRecordType?: string;
// }

// export interface OCRRejectRequest {
//     reason: string;
// }

// export interface OCRRetryRequest {
//     documentType: string;
// }

// export interface OCRAnalytics {
//     period: DateRange;
//     summary: {
//         totalDocuments: number;
//         averageConfidence: number;
//         averageProcessingTime: number;
//         qualityIssuesDetected: number;
//         duplicatesDetected: number;
//         validationFailures: number;
//         statusBreakdown: Record<OCRStatus, number>;
//     };
// }

// // ============================================
// // NOTIFICATION SERVICE TYPES
// // ============================================

// export type NotificationChannel =
//     | "EMAIL"
//     | "SMS"
//     | "WHATSAPP"
//     | "PUSH"
//     | "IN_APP";

// export type NotificationStatus =
//     | "PENDING"
//     | "SENT"
//     | "DELIVERED"
//     | "FAILED"
//     | "BOUNCED"
//     | "CLICKED"
//     | "READ";

// export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

// export interface Notification {
//     id: string;
//     userId: string;
//     recipientId?: string | null;
//     recipientEmail?: string | null;
//     recipientPhone?: string | null;
//     templateId?: string | null;
//     channel: NotificationChannel;
//     priority: NotificationPriority;
//     subject?: string | null;
//     body: string;
//     data?: Record<string, any>;
//     status: NotificationStatus;
//     scheduledAt?: string | null;
//     sentAt?: string | null;
//     deliveredAt?: string | null;
//     failedAt?: string | null;
//     readAt?: string | null;
//     clickedAt?: string | null;
//     errorMessage?: string | null;
//     retryCount: number;
//     metadata?: Record<string, any>;
//     cost?: number | null;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface NotificationStats {
//     totalNotifications: number;
//     sentNotifications: number;
//     deliveredNotifications: number;
//     failedNotifications: number;
//     pendingNotifications: number;
//     deliveryRate: number;
//     channelBreakdown: Array<{
//         channel: NotificationChannel;
//         count: number;
//     }>;
//     statusBreakdown: Array<{
//         status: NotificationStatus;
//         count: number;
//     }>;
// }

// export interface NotificationTemplate {
//     id: string;
//     userId: string;
//     name: string;
//     description?: string | null;
//     channel: NotificationChannel;
//     subject?: string | null;
//     bodyTemplate: string;
//     variables: string[];
//     isActive: boolean;
//     usageCount: number;
//     lastUsedAt?: string | null;
//     metadata?: Record<string, any>;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface NotificationDashboard {
//     overview: {
//         total: number;
//         delivered: number;
//         failed: number;
//         pending: number;
//         deliveryRate: number;
//     };
//     channelBreakdown: Array<{
//         channel: NotificationChannel;
//         count: number;
//     }>;
//     period: DateRange;
// }

// export interface ChannelPerformance {
//     channel: NotificationChannel;
//     totalSent: number;
//     delivered: number;
//     failed: number;
//     deliveryRate: number;
//     averageDeliveryTime: number;
//     cost: number;
//     averageCostPerNotification: number;
// }

// export interface CostAnalytics {
//     period: DateRange;
//     totalCost: number;
//     costByChannel: Array<{
//         channel: NotificationChannel;
//         cost: number;
//         count: number;
//         averageCost: number;
//     }>;
//     costTrend: Array<{
//         date: string;
//         cost: number;
//     }>;
// }

// export interface FailureAnalysis {
//     period: DateRange;
//     totalFailures: number;
//     failuresByChannel: Array<{
//         channel: NotificationChannel;
//         count: number;
//         percentage: number;
//     }>;
//     failureReasons: Array<{
//         reason: string;
//         count: number;
//         percentage: number;
//     }>;
//     retrySuccess: {
//         totalRetries: number;
//         successfulRetries: number;
//         successRate: number;
//     };
// }

// export interface DeliveryTrends {
//     period: DateRange;
//     trends: Array<{
//         date: string;
//         sent: number;
//         delivered: number;
//         failed: number;
//         deliveryRate: number;
//     }>;
// }

// export interface RecentActivity {
//     notifications: Notification[];
//     summary: {
//         lastHourSent: number;
//         lastDaySent: number;
//         recentFailures: number;
//         pendingCount: number;
//     };
// }

// export interface TopTemplates {
//     period: DateRange;
//     templates: Array<{
//         template: NotificationTemplate;
//         usageCount: number;
//         deliveryRate: number;
//         averageResponseTime?: number;
//     }>;
// }

// // ============================================
// // ORDER SERVICE TYPES (E-COMMERCE)
// // ============================================

// export interface OrderItem {
//     id: string;
//     inventoryItemId: string;
//     productName: string;
//     fabricType?: string | null;
//     gsm?: number | null;
//     width?: number | null;
//     color?: string | null;
//     design?: string | null;
//     quantity: number;
//     unit: string;
//     unitPrice: number;
//     discount: number;
//     discountType: "percentage" | "amount";
//     taxRate: number;
//     taxAmount: number;
//     totalAmount: number;
// }

// export interface Order {
//     id: string;
//     orderNo: string;
//     ecommerceUserId?: string | null;
//     customerId?: string | null;
//     customer?: Customer | EcommerceUser;
//     date: string;
//     items: OrderItem[];
//     subtotal: number;
//     discountAmount: number;
//     taxAmount: number;
//     shippingCharges: number;
//     amount: number;
//     paidAmount: number;
//     balanceAmount: number;
//     paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
//     status:
//         | "PENDING"
//         | "CONFIRMED"
//         | "PROCESSING"
//         | "SHIPPED"
//         | "DELIVERED"
//         | "CANCELLED";
//     shippingAddress?: string | null;
//     shippingCity?: string | null;
//     shippingState?: string | null;
//     shippingPincode?: string | null;
//     notes?: string | null;
//     trackingNumber?: string | null;
//     estimatedDelivery?: string | null;
//     deliveredAt?: string | null;
//     cancelledAt?: string | null;
//     cancellationReason?: string | null;
//     createdAt: string;
//     updatedAt: string;
//     userId: string;
// }

// export interface OrderPayment {
//     id: string;
//     orderId: string;
//     order?: Order;
//     amount: number;
//     method: "CASH" | "CARD" | "UPI" | "NET_BANKING" | "WALLET";
//     transactionId?: string | null;
//     status: "PENDING" | "SUCCESS" | "FAILED";
//     gatewayResponse?: Record<string, any>;
//     paidAt?: string | null;
//     createdAt: string;
//     userId: string;
// }

// // ============================================
// // WISHLIST & CART TYPES (E-COMMERCE)
// // ============================================

// export interface WishlistItem {
//     id: string;
//     ecommerceUserId: string;
//     inventoryItemId: string;
//     inventoryItem?: InventoryItem;
//     addedAt: string;
// }

// export interface CartItem {
//     id: string;
//     ecommerceUserId: string;
//     inventoryItemId: string;
//     inventoryItem?: InventoryItem;
//     quantity: number;
//     unitPrice: number;
//     totalPrice: number;
//     addedAt: string;
//     updatedAt: string;
// }

// // ============================================
// // SYSTEM TYPES
// // ============================================

// export interface AuditLog {
//     id: string;
//     userId: string;
//     action: string;
//     entityType: string;
//     entityId: string;
//     oldValues?: Record<string, any>;
//     newValues?: Record<string, any>;
//     ipAddress?: string | null;
//     userAgent?: string | null;
//     createdAt: string;
// }

// export interface SystemConfig {
//     id: string;
//     key: string;
//     value: string;
//     description?: string | null;
//     isPublic: boolean;
//     updatedAt: string;
// }

// export interface Backup {
//     id: string;
//     filename: string;
//     filePath: string;
//     fileSize: number;
//     type: "MANUAL" | "SCHEDULED";
//     status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
//     errorMessage?: string | null;
//     createdAt: string;
//     completedAt?: string | null;
//     userId: string;
// }

// export interface BackupSchedule {
//     id: string;
//     name: string;
//     frequency: "DAILY" | "WEEKLY" | "MONTHLY";
//     time: string;
//     isActive: boolean;
//     lastRunAt?: string | null;
//     nextRunAt?: string | null;
//     retentionDays: number;
//     createdAt: string;
//     updatedAt: string;
//     userId: string;
// }

// // ============================================
// // FILTER & SEARCH TYPES
// // ============================================

// export interface CustomerFilters extends PaginationParams {
//     search?: string;
//     city?: string;
//     state?: string;
//     isActive?: boolean;
//     hasGST?: boolean;
//     tags?: string[];
// }

// export interface PartyFilters extends PaginationParams {
//     search?: string;
//     city?: string;
//     state?: string;
//     isActive?: boolean;
//     hasGST?: boolean;
//     tags?: string[];
// }

// export interface SaleFilters extends PaginationParams {
//     search?: string;
//     customerId?: string;
//     status?: "DRAFT" | "CONFIRMED" | "CANCELLED";
//     paymentStatus?: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
//     startDate?: string;
//     endDate?: string;
//     minAmount?: number;
//     maxAmount?: number;
//     tags?: string[];
// }

// export interface InvoiceFilters extends PaginationParams {
//     search?: string;
//     partyId?: string;
//     status?: "DRAFT" | "CONFIRMED" | "CANCELLED";
//     paymentStatus?: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
//     startDate?: string;
//     endDate?: string;
//     minAmount?: number;
//     maxAmount?: number;
//     tags?: string[];
// }

// export interface InventoryFilters extends PaginationParams {
//     search?: string;
//     fabricType?: string;
//     color?: string;
//     weaveType?: string;
//     isActive?: boolean;
//     lowStock?: boolean;
//     tags?: string[];
// }

// export interface NotificationFilters extends PaginationParams {
//     channel?: NotificationChannel;
//     status?: NotificationStatus;
//     priority?: NotificationPriority;
//     recipientId?: string;
//     startDate?: string;
//     endDate?: string;
// }

// export interface OCRFilters extends PaginationParams {
//     status?: OCRStatus;
//     documentType?: "invoice" | "invoice_payment" | "sale_receipt";
//     startDate?: string;
//     endDate?: string;
// }

// ============================================
// GT-APP ACCOUNTING SERVICE API RESPONSES
// Complete TypeScript Interfaces for Frontend
// ============================================

// ============================================
// COMMON TYPES & UTILITIES
// ============================================

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: any;
    statusCode: number;
}

export interface ApiErrorResponse {
    statusCode: number;
    message: string;
    success: false;
    errors?: Array<{
        field: string;
        message: string;
    }>;
}

export interface PaginationParams {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface DateRange {
    startDate: string;
    endDate: string;
}

// ============================================
// ENUM TYPES FROM PRISMA
// ============================================

export type UserRole = "OWNER" | "MANAGER" | "STAFF" | "VIEWER" | "ACCOUNTANT";

export type InvoiceStatus =
    | "PENDING"
    | "PARTIALLY_PAID"
    | "PAID"
    | "OVERDUE"
    | "CANCELLED";

export type SaleStatus =
    | "PENDING"
    | "PARTIALLY_PAID"
    | "PAID"
    | "OVERDUE"
    | "CANCELLED"
    | "RETURNED";

export type PaymentMethod =
    | "CASH"
    | "BANK_TRANSFER"
    | "CHEQUE"
    | "UPI"
    | "CARD"
    | "ONLINE"
    | "OTHER";

export type PaymentStatus =
    | "PENDING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | "REFUNDED";

export type OrderStatus =
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "RETURNED";

export type StockMovementEnumType = "IN" | "OUT" | "ADJUSTMENT";

export type ReferenceType =
    | "SALE"
    | "INVOICE"
    | "ADJUSTMENT"
    | "RETURN"
    | "PURCHASE";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type NotificationChannel =
    | "WHATSAPP"
    | "SMS"
    | "EMAIL"
    | "PUSH"
    | "IN_APP";

export type NotificationStatus =
    | "PENDING"
    | "SENT"
    | "DELIVERED"
    | "READ"
    | "FAILED"
    | "CANCELLED";

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type OCRStatus =
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "MANUAL_REVIEW"
    | "CANCELLED";

// ============================================
// AUTH SERVICE TYPES
// ============================================

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserSession {
    id: string;
    userId: string;
    token: string;
    refreshToken?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    expiresAt: string;
    createdAt: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    session: UserSession;
    token: string;
    refreshToken?: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
}

export interface RegisterResponse {
    user: User;
    session: UserSession;
    token: string;
}

export interface UpdateProfileRequest {
    name?: string;
    phone?: string;
    email?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface EcommerceUser {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// ACCOUNTS SERVICE - CUSTOMER TYPES
// ============================================

export interface Customer {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    gstNumber?: string | null;
    creditLimit: number;

    // Additional fields
    dateOfBirth?: string | null;
    anniversary?: string | null;
    preferredContact?: string | null;
    tags: string[];
    notes?: string | null;
    isActive: boolean;

    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCustomerRequest {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstNumber?: string;
    creditLimit?: number;
    dateOfBirth?: string;
    anniversary?: string;
    preferredContact?: string;
    tags?: string[];
    notes?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

export interface CustomerLedgerEntry {
    id: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    type: string;
    reference?: string | null;
}

export interface CustomerLedgerResponse {
    customer: Customer;
    ledgerEntries: CustomerLedgerEntry[];
    summary: {
        openingBalance: number;
        totalDebits: number;
        totalCredits: number;
        closingBalance: number;
    };
}

export interface CustomerStatement {
    customer: Customer;
    period: DateRange;
    openingBalance: number;
    closingBalance: number;
    totalSales: number;
    totalReceipts: number;
    entries: CustomerLedgerEntry[];
}

export interface CustomerAnalytics {
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
    totalCreditLimit: number;
    averageCreditLimit: number;
    customersWithGST: number;
    customersWithoutGST: number;
    topCustomersByRevenue: Array<{
        customer: Customer;
        totalRevenue: number;
        totalSales: number;
    }>;
}

export interface CustomerLifetimeValue {
    customer: Customer;
    lifetimeValue: {
        totalSales: number;
        totalPayments: number;
        totalOutstanding: number;
        averageOrderValue: number;
        orderCount: number;
        firstPurchaseDate: string;
        lastPurchaseDate: string;
        customerAge: number;
    };
}

// ============================================
// ACCOUNTS SERVICE - PARTY (SUPPLIER) TYPES
// ============================================

export interface Party {
    id: string;
    name: string;
    gstNo?: string | null;
    panNo?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    contactPerson?: string | null;
    bankDetails?: {
        bankName?: string;
        accountNo?: string;
        ifsc?: string;
        branch?: string;
    } | null;

    // Additional fields
    category?: string | null;
    paymentTerms?: number | null;
    creditLimit: number;
    taxId?: string | null;
    website?: string | null;
    notes?: string | null;
    isActive: boolean;

    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePartyRequest {
    name: string;
    gstNo?: string;
    panNo?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    contactPerson?: string;
    bankDetails?: {
        bankName?: string;
        accountNo?: string;
        ifsc?: string;
        branch?: string;
    };
    category?: string;
    paymentTerms?: number;
    creditLimit?: number;
    taxId?: string;
    website?: string;
    notes?: string;
}

export interface UpdatePartyRequest extends Partial<CreatePartyRequest> {}

export interface PartyLedgerEntry {
    id: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    type: string;
    reference?: string | null;
}

export interface PartyLedgerResponse {
    party: Party;
    ledgerEntries: PartyLedgerEntry[];
    summary: {
        openingBalance: number;
        totalDebits: number;
        totalCredits: number;
        closingBalance: number;
    };
}

export interface PartyStatement {
    party: Party;
    period: DateRange;
    openingBalance: number;
    closingBalance: number;
    totalInvoices: number;
    totalPayments: number;
    entries: PartyLedgerEntry[];
}

export interface PartyAnalytics {
    period: DateRange;
    overview: {
        totalInvoiced: number;
        totalPaid: number;
        totalOutstanding: number;
        invoiceCount: number;
        paymentCount: number;
        averageInvoiceValue: number;
        paymentRate: number;
    };
    topPartiesByVolume: Array<{
        party: Party;
        totalInvoiced: number;
        invoiceCount: number;
        paymentAmount: number;
        outstandingAmount: number;
        paymentRate: number;
    }>;
    paymentMethodBreakdown: Array<{
        method: string;
        count: number;
        totalAmount: number;
    }>;
    categoryBreakdown: Record<string, number>;
}

export interface PartyPerformance {
    party: {
        id: string;
        name: string;
        paymentTerms: number | null;
    };
    period: DateRange;
    performance: {
        totalInvoices: number;
        totalPayments: number;
        onTimePaymentRate: number;
        averagePaymentDelay: number;
        totalInvoiced: number;
        totalPaid: number;
        outstanding: number;
    };
    monthlyTrends: Array<{
        month: string;
        invoiceCount: number;
        paymentCount: number;
        invoiceAmount: number;
        paymentAmount: number;
    }>;
}

export interface PartyComparison {
    partyId: string;
    partyName: string;
    invoiceCount: number;
    invoiceAmount: number;
    paymentAmount: number;
    outstandingAmount: number;
    paymentRate: number;
}

export interface PartyComparisonAnalytics {
    period: DateRange;
    metric: "amount" | "count" | "payments" | "outstanding";
    comparison: PartyComparison[];
    summary: {
        totalInvoiceAmount: number;
        totalPaymentAmount: number;
        totalOutstanding: number;
        averagePaymentRate: number;
    };
}

// ============================================
// ACCOUNTS SERVICE - INVOICE TYPES
// ============================================

export interface InvoiceItem {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    hsnCode?: string;
    taxRate?: number;
}

export interface Invoice {
    id: string;
    voucherId: string;
    invoiceNo: string;
    date: string;
    dueDate?: string | null;
    amount: number;
    paidAmount: number;
    remainingAmount: number;
    status: InvoiceStatus;

    items?: InvoiceItem[] | null;

    description?: string | null;
    taxAmount?: number | null;
    discountAmount?: number | null;
    roundOffAmount?: number | null;
    notes?: string | null;

    // Additional invoice fields
    poNumber?: string | null;
    transportMode?: string | null;
    vehicleNo?: string | null;
    deliveryNote?: string | null;
    supplierRef?: string | null;
    otherRef?: string | null;
    buyersOrderNo?: string | null;
    dispatchedThrough?: string | null;
    destination?: string | null;

    partyId: string;
    party?: Party;

    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateInvoiceRequest {
    invoiceNo: string;
    date: string;
    dueDate?: string;
    amount: number;
    items?: InvoiceItem[];
    description?: string;
    taxAmount?: number;
    discountAmount?: number;
    roundOffAmount?: number;
    notes?: string;
    poNumber?: string;
    transportMode?: string;
    vehicleNo?: string;
    deliveryNote?: string;
    supplierRef?: string;
    otherRef?: string;
    buyersOrderNo?: string;
    dispatchedThrough?: string;
    destination?: string;
    partyId: string;
}

export interface UpdateInvoiceRequest extends Partial<CreateInvoiceRequest> {}

export interface MarkInvoiceAsPaidRequest {
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    reference?: string;
    notes?: string;
}

export interface InvoiceAnalytics {
    period: DateRange;
    summary: {
        totalInvoices: number;
        totalAmount: number;
        paidAmount: number;
        pendingAmount: number;
        overdueAmount: number;
        averageInvoiceValue: number;
    };
    statusBreakdown: Array<{
        status: string;
        count: number;
        amount: number;
    }>;
    monthlyTrend: Array<{
        month: string;
        invoiceCount: number;
        totalAmount: number;
        paidAmount: number;
    }>;
    topParties: Array<{
        party: Party;
        invoiceCount: number;
        totalAmount: number;
    }>;
}

export interface PaymentTimingAnalysis {
    period: DateRange;
    timingAnalysis: {
        totalInvoices: number;
        paidInvoices: number;
        onTimePayments: number;
        latePayments: number;
        onTimePaymentRate: number;
        averageDelay: number;
    };
    paymentStatusBreakdown: Record<string, number>;
    partyReliabilityRanking: Array<{
        partyName: string;
        category: string;
        onTimePayments: number;
        latePayments: number;
        totalPayments: number;
        onTimeRate: number;
        averageDelay: number;
        totalAmount: number;
    }>;
    insights: {
        mostReliableParty: any;
        leastReliableParty: any;
        categoriesWithBestPayment: Array<{
            category: string;
            averageOnTimeRate: number;
        }>;
    };
}

// ============================================
// ACCOUNTS SERVICE - INVOICE PAYMENT TYPES
// ============================================

export interface InvoicePayment {
    id: string;
    voucherId: string;
    sequenceNo: string;
    amount: number;
    date: string;
    method: PaymentMethod;
    reference?: string | null;
    description?: string | null;
    status: PaymentStatus;

    // Gateway fields
    gatewayOrderId?: string | null;
    gatewayPaymentId?: string | null;
    transactionId?: string | null;
    failureReason?: string | null;

    // Banking details
    bankName?: string | null;
    chequeNo?: string | null;
    chequeDate?: string | null;
    clearanceDate?: string | null;
    charges?: number | null;

    partyId: string;
    party?: Party;

    invoiceId?: string | null;
    invoice?: Invoice | null;

    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateInvoicePaymentRequest {
    amount: number;
    date: string;
    method: PaymentMethod;
    reference?: string;
    description?: string;
    bankName?: string;
    chequeNo?: string;
    chequeDate?: string;
    clearanceDate?: string;
    charges?: number;
    partyId: string;
    invoiceId?: string;
}

export interface UpdateInvoicePaymentRequest
    extends Partial<CreateInvoicePaymentRequest> {}

export interface InvoicePaymentSummary {
    today: {
        count: number;
        totalAmount: number;
    };
    thisWeek: {
        count: number;
        totalAmount: number;
    };
    thisMonth: {
        count: number;
        totalAmount: number;
    };
    byMethod: Array<{
        method: string;
        count: number;
        amount: number;
    }>;
}

export interface InvoicePaymentAnalytics {
    period: DateRange;
    summary: {
        totalPayments: number;
        totalAmount: number;
        averagePayment: number;
        completedPayments: number;
        failedPayments: number;
    };
    methodBreakdown: Array<{
        method: string;
        count: number;
        amount: number;
        percentage: number;
    }>;
    monthlyTrend: Array<{
        month: string;
        paymentCount: number;
        totalAmount: number;
    }>;
    topParties: Array<{
        party: Party;
        paymentCount: number;
        totalAmount: number;
    }>;
}

export interface CashFlowAnalysis {
    period: DateRange;
    cashFlow: {
        totalInflow: number;
        totalOutflow: number;
        netCashFlow: number;
    };
    dailyCashFlow: Array<{
        date: string;
        inflow: number;
        outflow: number;
        net: number;
    }>;
    projections: {
        nextMonth: {
            expectedInflow: number;
            expectedOutflow: number;
            projectedBalance: number;
        };
    };
}

// ============================================
// ACCOUNTS SERVICE - SALE TYPES
// ============================================

export interface SaleItem {
    inventoryItemId?: string;
    itemName: string;
    itemType?: string;
    design?: string;
    color?: string;
    price: number;
    quantity: number;
    total: number;
    hsnCode?: string;
    unit: string;
}

export interface Sale {
    id: string;
    voucherId: string;
    saleNo: string;
    date: string;
    amount: number;
    paidAmount: number;
    remainingAmount: number;
    status: SaleStatus;

    items: SaleItem[];

    // Financial details
    taxAmount?: number | null;
    discountAmount?: number | null;
    roundOffAmount?: number | null;

    // Additional sale details
    salesPerson?: string | null;
    deliveryDate?: string | null;
    deliveryAddress?: string | null;
    transportation?: string | null;
    vehicleNo?: string | null;
    reference?: string | null;
    terms?: string | null;
    notes?: string | null;

    customerId: string;
    customer?: Customer;

    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSaleRequest {
    saleNo: string;
    date: string;
    amount: number;
    items: SaleItem[];
    taxAmount?: number;
    discountAmount?: number;
    roundOffAmount?: number;
    salesPerson?: string;
    deliveryDate?: string;
    deliveryAddress?: string;
    transportation?: string;
    vehicleNo?: string;
    reference?: string;
    terms?: string;
    notes?: string;
    customerId: string;
}

export interface UpdateSaleRequest extends Partial<CreateSaleRequest> {}

export interface MarkSaleAsPaidRequest {
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    reference?: string;
    notes?: string;
}

export interface SalesSummary {
    today: {
        count: number;
        totalAmount: number;
        paidAmount: number;
    };
    thisWeek: {
        count: number;
        totalAmount: number;
        paidAmount: number;
    };
    thisMonth: {
        count: number;
        totalAmount: number;
        paidAmount: number;
    };
}

export interface SalesAnalytics {
    period: DateRange;
    summary: {
        totalSales: number;
        totalAmount: number;
        paidAmount: number;
        pendingAmount: number;
        averageSaleValue: number;
    };
    statusBreakdown: Array<{
        status: string;
        count: number;
        amount: number;
    }>;
    monthlyTrend: Array<{
        month: string;
        saleCount: number;
        totalAmount: number;
    }>;
    topCustomers: Array<{
        customer: Customer;
        saleCount: number;
        totalAmount: number;
    }>;
    topProducts: Array<{
        itemName: string;
        quantity: number;
        revenue: number;
    }>;
}

export interface SalesPerformance {
    period: DateRange;
    performance: Array<{
        period: string;
        saleCount: number;
        totalAmount: number;
        paidAmount: number;
        collectionRate: number;
    }>;
    insights: {
        bestPerformingPeriod: any;
        averageDaily: number;
        growthRate: number;
    };
}

// ============================================
// ACCOUNTS SERVICE - SALE RECEIPT TYPES
// ============================================

export interface SaleReceipt {
    id: string;
    voucherId: string;
    receiptNo: string;
    date: string;
    amount: number;
    method: PaymentMethod;
    description?: string | null;
    reference?: string | null;
    imageUrl?: string | null;

    // Banking details
    bankName?: string | null;
    chequeNo?: string | null;
    chequeDate?: string | null;
    clearanceDate?: string | null;
    charges?: number | null;

    customerId: string;
    customer?: Customer;

    saleId?: string | null;
    sale?: Sale | null;

    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSaleReceiptRequest {
    receiptNo: string;
    date: string;
    amount: number;
    method: PaymentMethod;
    description?: string;
    reference?: string;
    imageUrl?: string;
    bankName?: string;
    chequeNo?: string;
    chequeDate?: string;
    clearanceDate?: string;
    charges?: number;
    customerId: string;
    saleId?: string;
}

export interface UpdateSaleReceiptRequest
    extends Partial<CreateSaleReceiptRequest> {}

export interface SaleReceiptSummary {
    today: {
        count: number;
        totalAmount: number;
    };
    thisWeek: {
        count: number;
        totalAmount: number;
    };
    thisMonth: {
        count: number;
        totalAmount: number;
    };
    byMethod: Array<{
        method: string;
        count: number;
        amount: number;
    }>;
}

// ============================================
// ACCOUNTS SERVICE - INVENTORY TYPES
// ============================================

export interface InventoryItem {
    id: string;
    name: string;
    description?: string | null;
    sku?: string | null;
    barcode?: string | null;
    category?: string | null;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    currentStock: number;
    minStockLevel: number;
    maxStockLevel: number;
    reorderQuantity: number;

    // Textile-specific fields
    fabricType?: string | null;
    gsm?: number | null;
    width?: number | null;
    color?: string | null;
    design?: string | null;
    weaveType?: string | null;

    location?: string | null;
    supplier?: string | null;
    hsnCode?: string | null;
    taxRate?: number | null;
    lastPurchaseDate?: string | null;
    lastPurchasePrice?: number | null;
    lastSaleDate?: string | null;
    imageUrl?: string | null;
    tags: string[];
    isActive: boolean;

    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateInventoryItemRequest {
    name: string;
    description?: string;
    sku?: string;
    barcode?: string;
    category?: string;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    currentStock?: number;
    minStockLevel?: number;
    maxStockLevel?: number;
    reorderQuantity?: number;
    fabricType?: string;
    gsm?: number;
    width?: number;
    color?: string;
    design?: string;
    weaveType?: string;
    location?: string;
    supplier?: string;
    hsnCode?: string;
    taxRate?: number;
    imageUrl?: string;
    tags?: string[];
}

export interface UpdateInventoryItemRequest
    extends Partial<CreateInventoryItemRequest> {}

export interface StockMovement {
    id: string;
    inventoryItemId: string;
    inventoryItem?: InventoryItem;
    type: StockMovementEnumType;
    quantity: number;
    previousQuantity: number;
    newQuantity: number;
    reference?: string | null;
    referenceType?: ReferenceType | null;
    notes?: string | null;
    date: string;
    unitPrice?: number | null;
    totalValue?: number | null;
    userId: string;
    createdAt: string;
}

export interface StockOperationRequest {
    quantity: number;
    notes?: string;
    reference?: string;
    referenceType?: ReferenceType;
    unitPrice?: number;
    totalValue?: number;
}

export interface StockOperationResponse {
    item: InventoryItem;
    movement: StockMovement;
    previousQuantity: number;
    newQuantity: number;
}

export interface LowStockItem {
    item: InventoryItem;
    currentStock: number;
    minStockLevel: number;
    reorderQuantity: number;
    stockDeficit: number;
    daysUntilStockout?: number;
}

export interface InventoryAnalytics {
    totalItems: number;
    activeItems: number;
    inactiveItems: number;
    lowStockItems: number;
    totalStockValue: number;
    averageStockValue: number;
    itemsByCategory: Array<{
        fabricType: string;
        count: number;
        totalValue: number;
    }>;
    recentActivity?: {
        stockAddedLast7Days: number;
        stockReducedLast7Days: number;
        newItemsLast7Days: number;
    };
}

// ============================================
// ACCOUNTS SERVICE - FINANCIAL REPORT TYPES
// ============================================

export interface LedgerEntry {
    id: string;
    accountType:
        | "CUSTOMER"
        | "PARTY"
        | "CASH"
        | "BANK"
        | "SALES"
        | "PURCHASES"
        | "EXPENSES";
    accountId?: string | null;
    accountName: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    reference?: string | null;
    referenceType?: string | null;
}

export interface TrialBalance {
    reportDate: string;
    period: DateRange;
    accounts: Array<{
        accountName: string;
        accountType: string;
        debit: number;
        credit: number;
    }>;
    totals: {
        totalDebit: number;
        totalCredit: number;
        difference: number;
    };
}

export interface BalanceSheet {
    reportDate: string;
    asOfDate: string;
    assets: {
        currentAssets: {
            cash: number;
            bankBalance: number;
            accountsReceivable: number;
            inventory: number;
            total: number;
        };
        fixedAssets: {
            equipment: number;
            property: number;
            total: number;
        };
        totalAssets: number;
    };
    liabilities: {
        currentLiabilities: {
            accountsPayable: number;
            shortTermLoans: number;
            total: number;
        };
        longTermLiabilities: {
            longTermLoans: number;
            total: number;
        };
        totalLiabilities: number;
    };
    equity: {
        capital: number;
        retainedEarnings: number;
        profitLoss: number;
        totalEquity: number;
    };
    balanceCheck: {
        assetsTotal: number;
        liabilitiesAndEquity: number;
        difference: number;
    };
}

export interface ProfitAndLoss {
    reportDate: string;
    period: DateRange;
    revenue: {
        sales: number;
        otherIncome: number;
        totalRevenue: number;
    };
    costOfGoodsSold: {
        purchases: number;
        directCosts: number;
        totalCOGS: number;
    };
    grossProfit: number;
    grossProfitMargin: number;
    operatingExpenses: {
        salaries: number;
        rent: number;
        utilities: number;
        marketing: number;
        other: number;
        totalExpenses: number;
    };
    operatingProfit: number;
    otherIncome: number;
    otherExpenses: number;
    profitBeforeTax: number;
    taxes: number;
    netProfit: number;
    netProfitMargin: number;
}

export interface GSTReport {
    reportDate: string;
    period: DateRange;
    gstinNumber: string;
    gstr1: {
        outwardSupplies: {
            b2b: {
                invoiceCount: number;
                taxableValue: number;
                cgst: number;
                sgst: number;
                igst: number;
                total: number;
            };
            b2c: {
                invoiceCount: number;
                taxableValue: number;
                cgst: number;
                sgst: number;
                igst: number;
                total: number;
            };
        };
        totalTaxLiability: number;
    };
    gstr2: {
        inwardSupplies: {
            invoiceCount: number;
            taxableValue: number;
            itcAvailable: number;
        };
    };
    gstr3b: {
        taxPayable: {
            cgst: number;
            sgst: number;
            igst: number;
            cess: number;
            total: number;
        };
        itcAvailed: {
            cgst: number;
            sgst: number;
            igst: number;
            total: number;
        };
        netTaxPayable: number;
    };
    monthlyBreakdown: Array<{
        month: string;
        outwardTaxable: number;
        inwardTaxable: number;
        taxPayable: number;
        itcAvailed: number;
        netTax: number;
    }>;
}

export interface TDSReport {
    reportDate: string;
    period: DateRange;
    quarter: string;
    financialYear: string;
    summary: {
        totalDeductions: number;
        totalPayments: number;
        deductionCount: number;
    };
    deductions: Array<{
        partyName: string;
        panNumber: string;
        paymentAmount: number;
        tdsRate: number;
        tdsAmount: number;
        tdsSection: string;
        paymentDate: string;
        challanNumber?: string | null;
        depositeDate?: string | null;
    }>;
    sectionWiseSummary: Array<{
        section: string;
        deductionCount: number;
        totalAmount: number;
        totalTDS: number;
    }>;
}

export interface BankReconciliation {
    reportDate: string;
    period: DateRange;
    bookBalance: {
        opening: number;
        closing: number;
    };
    bankBalance: {
        opening: number;
        closing: number;
    };
    matchedTransactions: Array<{
        date: string;
        description: string;
        amount: number;
        type: "debit" | "credit";
        matched: boolean;
    }>;
    unmatchedBookEntries: Array<{
        date: string;
        description: string;
        amount: number;
        reference: string;
    }>;
    unmatchedBankEntries: Array<{
        date: string;
        description: string;
        amount: number;
    }>;
    reconciliation: {
        bookBalance: number;
        addUnpresentedCheques: number;
        lessUncreditedDeposits: number;
        reconciledBankBalance: number;
        actualBankBalance: number;
        difference: number;
    };
    status: "RECONCILED" | "UNRECONCILED";
}

export interface FinancialYear {
    id: string;
    startDate: string;
    endDate: string;
    isClosed: boolean;
    closedAt?: string | null;
    closedBy?: string | null;
    notes?: string | null;
    createdAt: string;
}

export interface PeriodClosingPreview {
    financialYear: {
        id: string;
        startDate: string;
        endDate: string;
    };
    checks: {
        allInvoicesSettled: boolean;
        allPaymentsReconciled: boolean;
        stockValuationComplete: boolean;
        ledgerBalanced: boolean;
        bankReconciliationDone: boolean;
    };
    warnings: string[];
    errors: string[];
    summary: {
        totalSales: number;
        totalPurchases: number;
        totalExpenses: number;
        profitLoss: number;
        outstandingReceivables: number;
        outstandingPayables: number;
    };
    canClose: boolean;
    recommendedActions: string[];
}

export interface FinancialYearClosing {
    financialYear: FinancialYear;
    closingReport: {
        finalBalances: any;
        profitLoss: number;
        assets: number;
        liabilities: number;
        equity: number;
    };
}

// ============================================
// NOTIFICATION SERVICE TYPES
// ============================================

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    channel: NotificationChannel;
    status: NotificationStatus;
    priority?: NotificationPriority;
    recipientType: string;
    recipientId: string;
    recipientName: string;
    recipientContact?: string | null;
    templateName?: string | null;
    templateData?: Record<string, any>;
    sentAt?: string | null;
    deliveredAt?: string | null;
    readAt?: string | null;
    failureReason?: string | null;
    retryCount: number;
    maxRetries: number;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationStats {
    totalNotifications: number;
    sentNotifications: number;
    deliveredNotifications: number;
    failedNotifications: number;
    pendingNotifications: number;
    deliveryRate: number;
    channelBreakdown: Array<{
        channel: NotificationChannel;
        count: number;
    }>;
    statusBreakdown: Array<{
        status: NotificationStatus;
        count: number;
    }>;
}

export interface NotificationTemplate {
    id: string;
    userId: string;
    name: string;
    description?: string | null;
    channel: NotificationChannel;
    subject?: string | null;
    bodyTemplate: string;
    variables: string[];
    isActive: boolean;
    usageCount: number;
    lastUsedAt?: string | null;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// FILTER & SEARCH TYPES
// ============================================

export interface CustomerFilters extends PaginationParams {
    search?: string;
    city?: string;
    state?: string;
    isActive?: boolean;
    hasGST?: boolean;
    tags?: string[];
}

export interface PartyFilters extends PaginationParams {
    search?: string;
    city?: string;
    state?: string;
    isActive?: boolean;
    hasGST?: boolean;
    category?: string;
}

export interface SaleFilters extends PaginationParams {
    search?: string;
    customerId?: string;
    status?: SaleStatus;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
}

export interface InvoiceFilters extends PaginationParams {
    search?: string;
    partyId?: string;
    status?: InvoiceStatus;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
}

export interface InvoicePaymentFilters extends PaginationParams {
    partyId?: string;
    invoiceId?: string;
    method?: PaymentMethod;
    status?: PaymentStatus;
    startDate?: string;
    endDate?: string;
}

export interface SaleReceiptFilters extends PaginationParams {
    customerId?: string;
    saleId?: string;
    method?: PaymentMethod;
    startDate?: string;
    endDate?: string;
}

export interface InventoryFilters extends PaginationParams {
    search?: string;
    fabricType?: string;
    color?: string;
    weaveType?: string;
    isActive?: boolean;
    lowStock?: boolean;
    tags?: string[];
}

export interface StockMovementFilters extends PaginationParams {
    inventoryItemId?: string;
    type?: StockMovementEnumType;
    startDate?: string;
    endDate?: string;
}

export interface NotificationFilters extends PaginationParams {
    channel?: NotificationChannel;
    status?: NotificationStatus;
    priority?: NotificationPriority;
    recipientId?: string;
    startDate?: string;
    endDate?: string;
}

// ============================================
// EXPORT TYPES
// ============================================

export interface ExportRequest {
    startDate?: string;
    endDate?: string;
    format: "pdf" | "excel" | "csv";
    filters?: Record<string, any>;
}

// ============================================
// BULK OPERATION TYPES
// ============================================

export interface BulkOperationResult<T = any> {
    success: boolean;
    message: string;
    successCount: number;
    failureCount: number;
    results: Array<{
        success: boolean;
        data?: T;
        error?: string;
    }>;
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: string;
}
