// packages/common/events/subjects.ts

// Event subjects for Kafka messaging
export enum Subjects {
    // ========================================
    // 🔐 AUTHENTICATION & USER MANAGEMENT
    // ========================================

    // User Lifecycle
    UserCreated = "user:created",
    UserUpdated = "user:updated",
    UserDeleted = "user:deleted",
    UserActivated = "user:activated",
    UserDeactivated = "user:deactivated",
    UserRoleChanged = "user:role-changed",
    UserPasswordChanged = "user:password-changed",

    // Authentication Events
    UserLoggedIn = "user:logged-in",
    UserLoggedOut = "user:logged-out",
    UserLoginFailed = "user:login-failed",
    UserTokenRefreshed = "user:token-refreshed",
    UserPasswordResetRequested = "user:password-reset-requested",
    UserPasswordResetCompleted = "user:password-reset-completed",

    // Session Management
    SessionCreated = "session:created",
    SessionExpired = "session:expired",
    SessionTerminated = "session:terminated",

    // Security Events
    SuspiciousActivityDetected = "security:suspicious-activity",
    UserAccountLocked = "user:account-locked",
    AccessAttemptFailed = "security:access-failed",

    // ========================================
    // 💥 PARTY/SUPPLIER MANAGEMENT
    // ========================================

    PartyCreated = "party:created",
    PartyUpdated = "party:updated",
    PartyDeleted = "party:deleted",
    PartyActivated = "party:activated",
    PartyDeactivated = "party:deactivated",
    PartyContactUpdated = "party:contact-updated",
    PartyGSTUpdated = "party:gst-updated",
    PartyBankDetailsUpdated = "party:bank-details-updated",
    PartyPaymentTermsUpdated = "party:payment-terms-updated",
    PartyStatementSent = "party:statement-sent",

    // ========================================
    // 🛒 CUSTOMER MANAGEMENT
    // ========================================

    CustomerCreated = "customer:created",
    CustomerUpdated = "customer:updated",
    CustomerDeleted = "customer:deleted",
    CustomerActivated = "customer:activated",
    CustomerDeactivated = "customer:deactivated",
    CustomerContactUpdated = "customer:contact-updated",
    CustomerCreditLimitUpdated = "customer:credit-limit-updated",
    CustomerCreditLimitExceeded = "customer:credit-limit-exceeded",
    CustomerCreditLimitWarning = "customer:credit-limit-warning",
    CustomerFirstVisit = "customer:first-visit",

    // ========================================
    // 📄 INVOICE MANAGEMENT
    // ========================================

    // Invoice Lifecycle
    InvoiceCreated = "invoice:created",
    InvoiceUpdated = "invoice:updated",
    InvoiceDeleted = "invoice:deleted",
    InvoiceCancelled = "invoice:cancelled",
    InvoiceVoided = "invoice:voided",
    InvoiceDraftCreated = "invoice:draft-created",
    InvoiceSent = "invoice:sent",
    InvoiceViewed = "invoice:viewed",

    // Invoice Payment Status
    InvoicePaid = "invoice:paid",
    InvoicePartiallyPaid = "invoice:partially-paid",
    InvoiceOverdue = "invoice:overdue",
    InvoiceDueSoon = "invoice:due-soon",
    InvoiceDueToday = "invoice:due-today",
    InvoicePaymentReceived = "invoice:payment-received",

    // Invoice Actions
    InvoicePrinted = "invoice:printed",
    InvoiceEmailed = "invoice:emailed",
    InvoiceWhatsAppSent = "invoice:whatsapp-sent",
    InvoiceReminderSent = "invoice:reminder-sent",
    InvoiceFollowUpRequired = "invoice:follow-up-required",
    InvoiceGSTValidated = "invoice:gst-validated",
    InvoiceAnalyticsGenerated = "invoice:analytics-generated",

    // ========================================
    // 🛍 SALES MANAGEMENT
    // ========================================

    // Sale Lifecycle
    SaleCreated = "sale:created",
    SaleUpdated = "sale:updated",
    SaleDeleted = "sale:deleted",
    SaleCancelled = "sale:cancelled",
    SaleCompleted = "sale:completed",
    SaleReturned = "sale:returned",
    SalePartiallyReturned = "sale:partially-returned",
    SaleExchanged = "sale:exchanged",

    // Sale Payment Status
    SalePaid = "sale:paid",
    SalePartiallyPaid = "sale:partially-paid",
    SaleCreditSale = "sale:credit-sale",
    SaleCashSale = "sale:cash-sale",
    SaleOverdue = "sale:overdue",

    // Sale Operations
    SaleReceiptPrinted = "sale:receipt-printed",
    SaleReceiptEmailed = "sale:receipt-emailed",
    SaleReceiptWhatsAppSent = "sale:receipt-whatsapp-sent",
    SaleTrendAnalyzed = "sale:trend-analyzed",

    // ========================================
    // 💰 INVOICE PAYMENT MANAGEMENT
    // ========================================

    // Invoice Payment Lifecycle
    InvoicePaymentCreated = "invoice-payment:created",
    InvoicePaymentUpdated = "invoice-payment:updated",
    InvoicePaymentDeleted = "invoice-payment:deleted",
    InvoicePaymentVoided = "invoice-payment:voided",

    // Invoice Payment Processing
    InvoicePaymentProcessed = "invoice-payment:processed",
    InvoicePaymentFailed = "invoice-payment:failed",
    InvoicePaymentPending = "invoice-payment:pending",
    InvoicePaymentConfirmed = "invoice-payment:confirmed",
    InvoicePaymentReconciled = "invoice-payment:reconciled",
    InvoicePaymentRefunded = "invoice-payment:refunded",

    // Invoice Payment Methods
    CashInvoicePaymentMade = "invoice-payment:cash-made",
    UPIInvoicePaymentMade = "invoice-payment:upi-made",
    BankTransferInvoicePaymentMade = "invoice-payment:bank-transfer-made",
    ChequeInvoicePaymentMade = "invoice-payment:cheque-made",
    CardInvoicePaymentMade = "invoice-payment:card-made",
    InvoicePaymentTrendAnalyzed = "invoice-payment:trend-analysed",
    InvoicePaymentAllocated = "invoice-payment:allocated",
    BankTransferStatusUpdated = "invoice-payment:banktransfer-statusupdated",
    ChequeStatusUpdated = "invoice-payment:chequestatusupdated",

    // ========================================
    // 🧾 SALE RECEIPT MANAGEMENT
    // ========================================

    SaleReceiptCreated = "sale-receipt:created",
    SaleReceiptUpdated = "sale-receipt:updated",
    SaleReceiptDeleted = "sale-receipt:deleted",
    SaleReceiptVoided = "sale-receipt:voided",
    // SaleReceiptPrinted = "sale-receipt:printed",
    // SaleReceiptEmailed = "sale-receipt:emailed",
    // SaleReceiptWhatsAppSent = "sale-receipt:whatsapp-sent",

    // ========================================
    // 📊 LEDGER & ACCOUNTING
    // ========================================

    // Ledger Operations
    LedgerEntryCreated = "ledger:entry-created",
    LedgerEntryUpdated = "ledger:entry-updated",
    LedgerEntryDeleted = "ledger:entry-deleted",
    LedgerBalanceUpdated = "ledger:balance-updated",
    LedgerReconciled = "ledger:reconciled",
    LedgerAdjustmentMade = "ledger:adjustment-made",

    // Financial Periods
    DayBookClosed = "daybook:closed",
    MonthClosed = "month:closed",
    FinancialYearOpened = "financial-year:opened",
    FinancialYearClosed = "financial-year:closed",

    // Tax & GST
    GSTCalculated = "gst:calculated",
    GSTReturnGenerated = "gst:return-generated",
    GSTReturnFiled = "gst:return-filed",
    TaxCalculated = "tax:calculated",
    TDSCalculated = "tds:calculated",

    // ========================================
    // 📱 REMINDERS & NOTIFICATIONS
    // ========================================

    // Reminder Lifecycle
    ReminderCreated = "reminder:created",
    ReminderScheduled = "reminder:scheduled",
    ReminderSent = "reminder:sent",
    ReminderDelivered = "reminder:delivered",
    ReminderRead = "reminder:read",
    ReminderFailed = "reminder:failed",
    ReminderCancelled = "reminder:cancelled",
    ReminderSnoozed = "reminder:snoozed",
    ReminderCompleted = "reminder:completed",

    // Notification Types
    PaymentReminderSent = "notification:payment-reminder-sent",
    OverdueNotificationSent = "notification:overdue-sent",
    WelcomeNotificationSent = "notification:welcome-sent",
    BirthdayReminderSent = "notification:birthday-reminder-sent",
    FestivalGreetingSent = "notification:festival-greeting-sent",

    // REQUEST SUBJECTS (what other services publish)
    SendEmailRequested = "notification:send-email-requested",
    SendSMSRequested = "notification:send-sms-requested",
    SendWhatsAppRequested = "notification:send-whatsapp-requested",
    SendInAppNotificationRequested = "notification:inapp:send:requested",

    // Communication Channels
    WhatsAppMessageSent = "whatsapp:message-sent",
    WhatsAppMessageDelivered = "whatsapp:message-delivered",
    WhatsAppMessageRead = "whatsapp:message-read",
    WhatsAppMessageFailed = "whatsapp:message-failed",

    SMSMessageSent = "sms:message-sent",
    SMSMessageDelivered = "sms:message-delivered",
    SMSMessageFailed = "sms:message-failed",

    EmailSent = "email:sent",
    EmailDelivered = "email:delivered",
    EmailOpened = "email:opened",
    EmailClicked = "email:clicked",
    EmailBounced = "email:bounced",
    EmailFailed = "email:failed",

    InAppNotificationSent = "notification:inapp:sent",
    InAppNotificationFailed = "notification:inapp:failed",
    InAppNotificationRead = "notification:inapp:read",
    InAppNotificationClicked = "notification:inapp:clicked",

    // ========================================
    // 📄 OCR & DOCUMENT PROCESSING
    // ========================================

    // Document Upload & Processing
    DocumentUploaded = "document:uploaded",
    DocumentQueued = "document:queued",
    DocumentProcessingStarted = "document:processing-started",
    DocumentProcessed = "document:processed",
    DocumentProcessingFailed = "document:processing-failed",
    DocumentValidated = "document:validated",
    DocumentRejected = "document:rejected",
    DocumentArchived = "document:archived",
    DocumentDeleted = "document:deleted",

    // OCR Job Lifecycle
    OCRJobCreated = "ocr:job-created",
    OCRJobStarted = "ocr:job-started",
    OCRJobCompleted = "ocr:job-completed",
    OCRJobFailed = "ocr:job-failed",
    OCRJobCancelled = "ocr:job-cancelled",
    OCRJobRetried = "ocr:job-retried",

    // OCR Results
    OCRDataExtracted = "ocr:data-extracted",
    OCRDataValidated = "ocr:data-validated",
    OCRDataCorrected = "ocr:data-corrected",
    OCRHighConfidenceResult = "ocr:high-confidence",
    OCRLowConfidenceResult = "ocr:low-confidence",
    OCRManualReviewRequired = "ocr:manual-review-required",

    // Auto-Creation from OCR
    InvoiceAutoCreatedFromOCR = "invoice:auto-created-from-ocr",
    SaleReceiptAutoCreatedFromOCR = "sale-receipt:auto-created-from-ocr",
    InvoicePaymentAutoCreatedFromOCR = "invoice-payment:auto-created-from-ocr",
    ExpenseAutoCreatedFromOCR = "expense:auto-created-from-ocr",

    // ========================================
    // 📦 INVENTORY & ITEM MANAGEMENT
    // ========================================

    // Inventory Item Lifecycle
    InventoryItemCreated = "inventory-item:created",
    InventoryItemUpdated = "inventory-item:updated",
    InventoryItemDeleted = "inventory-item:deleted",
    InventoryItemActivated = "inventory-item:activated",
    InventoryItemDeactivated = "inventory-item:deactivated",
    InventoryItemPriceUpdated = "inventory-item:price-updated",
    InventoryItemCostUpdated = "inventory-item:cost-updated",
    InventoryItemCategoryChanged = "inventory-item:category-changed",
    InventoryItemImageUpdated = "inventory-item:image-updated",

    // Stock Management
    StockAdded = "stock:added",
    StockReduced = "stock:reduced",
    StockAdjusted = "stock:adjusted",
    StockTransferred = "stock:transferred",
    StockDamaged = "stock:damaged",
    StockExpired = "stock:expired",
    StockReturned = "stock:returned",

    // Stock Alerts
    StockLow = "stock:low",
    StockCritical = "stock:critical",
    StockOut = "stock:out",
    StockReorderRequired = "stock:reorder-required",
    StockReceived = "stock:received",
    StockOrdered = "stock:ordered",

    // Inventory Operations
    InventoryCountStarted = "inventory:count-started",
    InventoryCountCompleted = "inventory:count-completed",
    InventoryVarianceDetected = "inventory:variance-detected",
    InventoryAdjustmentMade = "inventory:adjustment-made",

    // ========================================
    // 👥 E-COMMERCE USER MANAGEMENT
    // ========================================

    // E-commerce User Lifecycle
    EcommerceUserCreated = "ecommerce-user:created",
    EcommerceUserUpdated = "ecommerce-user:updated",
    EcommerceUserDeleted = "ecommerce-user:deleted",
    EcommerceUserActivated = "ecommerce-user:activated",
    EcommerceUserDeactivated = "ecommerce-user:deactivated",
    EcommerceUserBlocked = "ecommerce-user:blocked",
    EcommerceUserUnblocked = "ecommerce-user:unblocked",

    // E-commerce Authentication
    EcommerceUserLoggedIn = "ecommerce-user:logged-in",
    EcommerceUserLoggedOut = "ecommerce-user:logged-out",
    EcommerceUserLoginFailed = "ecommerce-user:login-failed",
    EcommerceUserPasswordChanged = "ecommerce-user:password-changed",
    EcommerceUserPasswordResetRequested = "ecommerce-user:password-reset-requested",
    EcommerceUserPasswordResetCompleted = "ecommerce-user:password-reset-completed",

    // E-commerce User Verification
    EcommerceUserEmailVerified = "ecommerce-user:email-verified",
    EcommerceUserPhoneVerified = "ecommerce-user:phone-verified",
    EcommerceUserEmailVerificationSent = "ecommerce-user:email-verification-sent",
    EcommerceUserPhoneVerificationSent = "ecommerce-user:phone-verification-sent",

    // E-commerce User Profile
    EcommerceUserProfileUpdated = "ecommerce-user:profile-updated",
    EcommerceUserAddressAdded = "ecommerce-user:address-added",
    EcommerceUserAddressUpdated = "ecommerce-user:address-updated",
    EcommerceUserAddressDeleted = "ecommerce-user:address-deleted",
    EcommerceUserPreferencesUpdated = "ecommerce-user:preferences-updated",

    // Social Login
    EcommerceUserSocialLoginLinked = "ecommerce-user:social-login-linked",
    EcommerceUserSocialLoginUnlinked = "ecommerce-user:social-login-unlinked",

    // E-commerce User Session
    EcommerceUserSessionCreated = "ecommerce-user:session-created",
    EcommerceUserSessionExpired = "ecommerce-user:session-expired",
    EcommerceUserSessionTerminated = "ecommerce-user:session-terminated",

    // ========================================
    // 🛍 E-COMMERCE & ORDERS
    // ========================================

    // Order Management
    OrderCreated = "order:created",
    OrderUpdated = "order:updated",
    OrderConfirmed = "order:confirmed",
    OrderPacked = "order:packed",
    OrderShipped = "order:shipped",
    OrderDelivered = "order:delivered",
    OrderCancelled = "order:cancelled",
    OrderReturned = "order:returned",
    OrderRefunded = "order:refunded",
    OrderCompleted = "order:completed",

    // Shopping Cart
    CartCreated = "cart:created",
    CartUpdated = "cart:updated",
    CartItemAdded = "cart:item-added",
    CartItemRemoved = "cart:item-removed",
    CartAbandoned = "cart:abandoned",
    CartRecovered = "cart:recovered",
    CartConverted = "cart:converted",

    // Online Payments
    OnlinePaymentInitiated = "online-payment:initiated",
    OnlinePaymentSucceeded = "online-payment:succeeded",
    OnlinePaymentFailed = "online-payment:failed",
    OnlinePaymentRefunded = "online-payment:refunded",

    // ========================================
    // 📊 REPORTS & ANALYTICS
    // ========================================

    // Report Generation
    ReportGenerated = "report:generated",
    ReportScheduled = "report:scheduled",
    ReportEmailed = "report:emailed",
    ReportDownloaded = "report:downloaded",
    ReportFailed = "report:failed",

    // Daily Reports
    DailySalesReportGenerated = "report:daily-sales-generated",
    DailyCashReportGenerated = "report:daily-cash-generated",
    DailyInventoryReportGenerated = "report:daily-inventory-generated",
    DailyOutstandingReportGenerated = "report:daily-outstanding-generated",

    // Weekly/Monthly Reports
    WeeklySalesReportGenerated = "report:weekly-sales-generated",
    MonthlySalesReportGenerated = "report:monthly-sales-generated",
    MonthlyProfitLossGenerated = "report:monthly-pl-generated",
    MonthlyGSTReportGenerated = "report:monthly-gst-generated",

    // Analytics & KPIs
    KPICalculated = "analytics:kpi-calculated",
    SalesTrendAnalyzed = "analytics:sales-trend-analyzed",
    CustomerAnalyticsGenerated = "analytics:customer-analytics-generated",
    InventoryTurnoverCalculated = "analytics:inventory-turnover-calculated",
    ProfitMarginCalculated = "analytics:profit-margin-calculated",

    // Dashboard Updates
    DashboardDataUpdated = "dashboard:data-updated",
    DashboardViewed = "dashboard:viewed",
    DashboardExported = "dashboard:exported",

    // ========================================
    // ⚙️ SYSTEM & ADMINISTRATION
    // ========================================

    // System Events
    SystemStarted = "system:started",
    SystemShutdown = "system:shutdown",
    SystemHealthCheckPerformed = "system:health-check",
    SystemMaintenanceStarted = "system:maintenance-started",
    SystemMaintenanceCompleted = "system:maintenance-completed",
    SystemUpdated = "system:updated",
    SystemMetricsCollected = "system:metrics-collected",
    SystemAlertTriggered = "system:alert-triggered",
    APIEndpointAccessed = "system:api-endpoint-accessed",
    WebhookReceived = "system:webhook-received",
    SystemConfigUpdated = "system:config-updated",

    // Data Management
    DataBackupStarted = "data:backup-started",
    DataBackupCompleted = "data:backup-completed",
    DataBackupFailed = "data:backup-failed",
    DataRestoreStarted = "data:restore-started",
    DataRestoreCompleted = "data:restore-completed",
    DataExported = "data:exported",
    DataImported = "data:imported",

    // Configuration
    SettingsUpdated = "settings:updated",
    ConfigurationChanged = "config:changed",
    BusinessProfileUpdated = "business:profile-updated",
    TaxSettingsUpdated = "tax:settings-updated",
    NotificationPreferencesUpdated = "notification:preferences-updated",

    // Audit & Compliance
    AuditLogCreated = "audit:log-created",
    ComplianceCheckPerformed = "compliance:check-performed",
    DataIntegrityCheckPerformed = "data:integrity-check",
    SecurityScanPerformed = "security:scan-performed",

    // ========================================
    // 🏪 TEXTILE SHOP SPECIFIC EVENTS
    // ========================================

    // Customer Events
    CustomerVisitLogged = "customer:visit-logged",
    CustomerPreferenceUpdated = "customer:preference-updated",
    CustomerLoyaltyPointsEarned = "customer:loyalty-points-earned",
    CustomerLoyaltyPointsRedeemed = "customer:loyalty-points-redeemed",

    // Textile/Inventory Specific
    TextileDisplayed = "textile:displayed",
    TextileDemonstrated = "textile:demonstrated",
    TextileReserved = "textile:reserved",
    TextileCustomized = "textile:customized",

    // Seasonal Events
    FestivalDiscountApplied = "festival:discount-applied",
    SeasonalInventoryUpdated = "seasonal:inventory-updated",
    WeddingSeasonAlertSent = "wedding-season:alert-sent",

    // Business Operations
    ShopOpeningLogged = "shop:opening-logged",
    ShopClosingLogged = "shop:closing-logged",
    CashCountPerformed = "cash:count-performed",
    CashShortageDetected = "cash:shortage-detected",
    CashExcessDetected = "cash:excess-detected",
}

// Export type for better TypeScript support
export type SubjectType = keyof typeof Subjects;

// Helper to get all subjects as array
export const getAllSubjects = (): string[] => {
    return Object.values(Subjects);
};

// Group subjects by category for better organization
export const SubjectCategories = {
    AUTHENTICATION: [
        Subjects.UserCreated,
        Subjects.UserLoggedIn,
        Subjects.UserLoggedOut,
        Subjects.SessionCreated,
    ],

    CORE_BUSINESS: [
        Subjects.InvoiceCreated,
        Subjects.SaleCreated,
        Subjects.InvoicePaymentCreated,
        Subjects.SaleReceiptCreated,
        Subjects.CustomerCreated,
        Subjects.PartyCreated,
    ],

    NOTIFICATIONS: [
        Subjects.InvoiceOverdue,
        Subjects.PaymentReminderSent,
        Subjects.WhatsAppMessageSent,
        Subjects.EmailSent,
    ],

    DOCUMENT_PROCESSING: [
        Subjects.DocumentUploaded,
        Subjects.OCRJobCompleted,
        Subjects.InvoiceAutoCreatedFromOCR,
        Subjects.SaleReceiptAutoCreatedFromOCR,
    ],

    INVENTORY: [
        Subjects.InventoryItemCreated,
        Subjects.StockLow,
        Subjects.StockOut,
        Subjects.InventoryCountCompleted,
    ],

    REPORTS: [
        Subjects.DailySalesReportGenerated,
        Subjects.MonthlySalesReportGenerated,
        Subjects.KPICalculated,
    ],

    SYSTEM: [
        Subjects.SystemStarted,
        Subjects.DataBackupCompleted,
        Subjects.AuditLogCreated,
    ],
} as const;

// Priority mapping for event processing
export const EventPriorities = {
    CRITICAL: [
        Subjects.SystemShutdown,
        Subjects.DataBackupFailed,
        Subjects.SuspiciousActivityDetected,
        Subjects.CashShortageDetected,
        Subjects.InvoicePaymentFailed,
    ],

    HIGH: [
        Subjects.InvoiceOverdue,
        Subjects.CustomerCreditLimitExceeded,
        Subjects.StockOut,
        Subjects.WhatsAppMessageFailed,
    ],

    MEDIUM: [
        Subjects.InvoiceCreated,
        Subjects.SaleCreated,
        Subjects.InvoicePaymentCreated,
        Subjects.CustomerCreated,
    ],

    LOW: [
        Subjects.DashboardViewed,
        Subjects.ReportGenerated,
        Subjects.EmailOpened,
        Subjects.UserLoggedIn,
    ],
} as const;
