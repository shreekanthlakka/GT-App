```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}


// ========================================
// USER MANAGEMENT
// ========================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  phone     String?
  password  String
  role      UserRole @default(OWNER)
  isActive  Boolean  @default(true)

  // Security fields
  twoFactorSecret     String?
  twoFactorEnabled    Boolean   @default(false)
  ipWhitelist         Json?     // Array of allowed IP addresses
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  lastLoginAt         DateTime?
  lastLoginIP         String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  parties          Party[]
  customers        Customer[]
  invoices         Invoice[]
  invoicePayments  InvoicePayment[]
  saleReceipts     SaleReceipt[]
  sales            Sale[]
  ledgerEntries    LedgerEntry[]
  ocrData          OCRData[]
  reminders        Reminder[]
  notifications    Notification[]
  inventoryItems   InventoryItem[]
  orders           Order[]
  userSessions     UserSession[]
  backups          Backup[]
  restores         Restore[]
  backupSchedule   BackupSchedule?
  auditLogs        AuditLog[]
  stockMovements   StockMovement[]

  @@map("users")
}

model UserSession {
  id           String   @id @default(cuid())
  userId       String
  sessionToken String   @unique
  refreshToken String   @unique
  expiresAt    DateTime
  deviceInfo   Json?    // Device information
  ipAddress    String?
  userAgent    String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_sessions")
}

// ========================================
// ECOMMERCE USERS (Public App Users)
// ========================================

model EcommerceUser {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  phone     String?
  password  String?  // Nullable for social login users

  // Profile information
  dateOfBirth DateTime?
  gender      String?  // MALE, FEMALE, OTHER
  avatar      String?  // Profile picture URL

  // Address information
  addresses   Json     @default("[]") // [{type: 'home|office', name, phone, address, city, state, pincode, isDefault}]

  // Authentication & Security
  emailVerified     Boolean   @default(false)
  phoneVerified     Boolean   @default(false)
  emailVerificationToken String?
  phoneVerificationToken String?
  passwordResetToken     String?
  passwordResetExpiry    DateTime?

  // Social login
  googleId          String?
  facebookId        String?

  // Account status
  isActive          Boolean   @default(true)
  isBlocked         Boolean   @default(false)
  blockedReason     String?
  blockedAt         DateTime?

  // Preferences
  preferences       Json      @default("{}") // {newsletter: true, sms: true, whatsapp: true, language: 'en'}

  // Marketing
  referralCode      String?   @unique
  referredBy        String?

  // Metadata
  lastLoginAt       DateTime?
  lastLoginIP       String?
  signupSource      String?   // WEBSITE, MOBILE_APP, SOCIAL, REFERRAL

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  orders            Order[]
  ecommerceUserSessions EcommerceUserSession[]
  reviews           Review[]
  wishlistItems     WishlistItem[]
  cartItems         CartItem[]

  @@index([email])
  @@index([phone])
  @@index([referralCode])
  @@index([isActive])
  @@map("ecommerce_users")
}

model EcommerceUserSession {
  id           String   @id @default(cuid())
  userId       String
  sessionToken String   @unique
  refreshToken String   @unique
  expiresAt    DateTime
  deviceInfo   Json?    // {type: 'mobile|desktop', os, browser, version}
  ipAddress    String?
  userAgent    String?
  isActive     Boolean  @default(true)

  ecommerceUser EcommerceUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
  @@index([sessionToken])
  @@map("ecommerce_user_sessions")
}

// ========================================
// BUSINESS ENTITIES
// ========================================

model Customer {
  id          String  @id @default(cuid())
  name        String
  phone       String?
  email       String?
  address     String?
  city        String?
  state       String?
  pincode     String?
  gstNumber   String?
  creditLimit Decimal @default(0) @db.Decimal(12, 2)

  // Additional fields
  dateOfBirth      DateTime?
  anniversary      DateTime?
  preferredContact String?    // email, phone, whatsapp
  tags             String[]   // VIP, Regular, New, etc.
  notes            String?
  isActive         Boolean    @default(true)

  userId      String
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  sales         Sale[]
  saleReceipts  SaleReceipt[]
  ledger        LedgerEntry[]
  reminders     Reminder[]
  notifications Notification[]
  orders        Order[]

  @@index([userId])
  @@index([name])
  @@index([phone])
  @@index([email])
  @@map("customers")
}

model Party {
  id            String  @id @default(cuid())
  name          String
  gstNo         String?
  panNo         String?
  phone         String?
  email         String?
  address       String?
  city          String?
  state         String?
  pincode       String?
  contactPerson String?
  bankDetails   Json?   // {bankName, accountNo, ifsc, branch}

  // Additional fields
  category      String?  // Manufacturer, Distributor, Wholesaler
  paymentTerms  Int?     // Payment terms in days
  creditLimit   Decimal  @default(0) @db.Decimal(12, 2)
  taxId         String?
  website       String?
  notes         String?
  isActive      Boolean  @default(true)

  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  invoices         Invoice[]
  invoicePayments  InvoicePayment[]
  ledger           LedgerEntry[]
  notifications    Notification[]

  @@unique([gstNo, userId], name: "unique_gst_per_user")
  @@index([userId])
  @@index([name])
  @@index([gstNo])
  @@map("parties")
}

// ========================================
// INVENTORY MANAGEMENT
// ========================================

model InventoryItem {
  id          String   @id @default(cuid())
  name        String
  description String?
  sku         String?  @unique
  barcode     String?  @unique
  category    String
  subCategory String?
  brand       String?

  // Pricing
  sellingPrice Decimal  @db.Decimal(10, 2)
  costPrice    Decimal? @db.Decimal(10, 2)
  mrp          Decimal? @db.Decimal(10, 2)

  // Stock management
  currentStock    Int      @default(0)
  minimumStock    Int      @default(0)
  maximumStock    Int?
  reorderLevel    Int?
  unit            String   @default("PCS") // PCS, MTR, KG, etc.

  // Textile specific fields
  fabric          String?  // Cotton, Silk, Polyester, etc.
  gsm             Int?     // Grams per square meter
  width           Decimal? @db.Decimal(8, 2) // Width in inches/cm
  color           String?
  design          String?
  pattern         String?
  weaveType       String?  // Plain, Twill, Satin, etc.

  // Product details
  images          Json     @default("[]")
  attributes      Json     @default("{}")

  // Tax and compliance
  hsnCode         String?
  taxRate         Decimal? @db.Decimal(5, 2)

  // Storage and supplier info
  location        String?  // Storage location in shop
  supplier        String?
  leadTime        Int?     // Days
  lastPurchaseDate DateTime?
  lastPurchasePrice Decimal? @db.Decimal(10, 2)

  isActive        Boolean  @default(true)

  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  orderItems      OrderItem[]
  stockMovements  StockMovement[]
  reviews         Review[]
  wishlistItems   WishlistItem[]
  cartItems       CartItem[]

  @@index([userId])
  @@index([category])
  @@index([isActive])
  @@index([sku])
  @@index([barcode])
  @@index([currentStock])
  @@map("inventory_items")
}

model StockMovement {
  id            String       @id @default(cuid())
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)

  type          MovementType // IN, OUT, ADJUSTMENT, TRANSFER
  quantity      Int
  previousStock Int
  newStock      Int
  reason        String?
  reference     String?      // Sale ID, Purchase ID, etc.
  batchNumber   String?      // For textile rolls/batches

  // Additional details
  unitPrice     Decimal?     @db.Decimal(10, 2)
  totalValue    Decimal?     @db.Decimal(12, 2)
  notes         String?

  userId        String
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt     DateTime     @default(now())

  @@index([inventoryItemId])
  @@index([userId])
  @@index([type])
  @@index([createdAt])
  @@map("stock_movements")
}

// ========================================
// SALES TRANSACTIONS
// ========================================

model Sale {
  id              String     @id @default(cuid())
  voucherId       String     @unique
  saleNo          String
  date            DateTime
  amount          Decimal    @db.Decimal(12, 2)
  paidAmount      Decimal    @default(0) @db.Decimal(12, 2)
  remainingAmount Decimal    @db.Decimal(12, 2)
  status          SaleStatus @default(PENDING)

  // Sale items - storing as JSON for flexibility in textile business
  items           Json       // [{itemName, itemType, design, color, price, quantity, total, hsnCode, unit}]

  // Financial details
  taxAmount       Decimal?   @db.Decimal(12, 2)
  discountAmount  Decimal?   @default(0) @db.Decimal(12, 2)
  roundOffAmount  Decimal?   @default(0) @db.Decimal(12, 2)

  // Additional sale details
  salesPerson     String?
  deliveryDate    DateTime?
  deliveryAddress String?
  transportation  String?
  vehicleNo       String?
  reference       String?    // Customer's reference
  terms           String?    // Payment terms
  notes           String?

  customerId      String
  customer        Customer   @relation(fields: [customerId], references: [id], onDelete: Cascade)

  userId          String
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  // Relations
  saleReceipts    SaleReceipt[]
  ledger          LedgerEntry[]
  notifications   Notification[]

  @@unique([saleNo, customerId, userId], name: "unique_sale_per_customer")
  @@index([userId])
  @@index([customerId])
  @@index([status])
  @@index([date])
  @@map("sales")
}

// ========================================
// PURCHASE TRANSACTIONS
// ========================================

model Invoice {
  id              String        @id @default(cuid())
  voucherId       String        @unique
  invoiceNo       String
  date            DateTime
  dueDate         DateTime?
  amount          Decimal       @db.Decimal(12, 2)
  paidAmount      Decimal       @default(0) @db.Decimal(12, 2)
  remainingAmount Decimal       @db.Decimal(12, 2)
  status          InvoiceStatus @default(PENDING)

  // Invoice line items - flexible JSON structure for textile purchases
  items           Json?         // [{description, quantity, rate, amount, hsnCode, taxRate}]

  description     String?
  taxAmount       Decimal?      @db.Decimal(12, 2)
  discountAmount  Decimal?      @default(0) @db.Decimal(12, 2)
  roundOffAmount  Decimal?      @default(0) @db.Decimal(12, 2)
  notes           String?

  // Additional invoice fields
  poNumber        String?       // Purchase Order Number
  transportMode   String?
  vehicleNo       String?
  deliveryNote    String?
  supplierRef     String?
  otherRef        String?
  buyersOrderNo   String?
  dispatchedThrough String?
  destination     String?

  partyId         String
  party           Party         @relation(fields: [partyId], references: [id], onDelete: Cascade)

  userId          String
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relations
  invoicePayments InvoicePayment[]
  ledger          LedgerEntry[]
  ocrData         OCRData?
  notifications   Notification[]

  @@unique([invoiceNo, partyId, userId], name: "unique_invoice_per_party")
  @@index([userId])
  @@index([partyId])
  @@index([status])
  @@index([date])
  @@index([dueDate])
  @@map("invoices")
}

// ========================================
// PAYMENT TRANSACTIONS
// ========================================

model InvoicePayment {
  id          String        @id @default(cuid())
  voucherId   String        @unique
  amount      Decimal       @db.Decimal(12, 2)
  date        DateTime
  method      PaymentMethod
  reference   String?       // Bank ref, cheque no, UPI transaction ID
  description String?
  status      PaymentStatus @default(COMPLETED)

  // Gateway fields for online payments
  gatewayOrderId   String?
  gatewayPaymentId String?
  transactionId    String?
  failureReason    String?

  // Banking details
  bankName        String?
  chequeNo        String?
  chequeDate      DateTime?
  clearanceDate   DateTime?
  charges         Decimal? @db.Decimal(8, 2)

  // Relations
  partyId     String
  party       Party        @relation(fields: [partyId], references: [id], onDelete: Cascade)

  invoiceId   String?
  invoice     Invoice?     @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // Relations
  ledger        LedgerEntry[]
  ocrData       OCRData?
  notifications Notification[]

  @@index([userId])
  @@index([method])
  @@index([date])
  @@index([partyId])
  @@index([invoiceId])
  @@map("invoice_payments")
}

model SaleReceipt {
  id          String   @id @default(cuid())
  voucherId   String   @unique
  receiptNo   String
  date        DateTime
  amount      Decimal  @db.Decimal(12, 2)
  method      PaymentMethod
  description String?
  reference   String?  // Transaction reference
  imageUrl    String?  // Photo of physical receipt

  // Banking details
  bankName        String?
  chequeNo        String?
  chequeDate      DateTime?
  clearanceDate   DateTime?
  charges         Decimal? @db.Decimal(8, 2)

  // Relations
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  saleId      String?
  sale        Sale?    @relation(fields: [saleId], references: [id], onDelete: Cascade)

  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  ledger        LedgerEntry[]
  ocrData       OCRData?
  notifications Notification[]

  @@unique([receiptNo, customerId, userId], name: "unique_receipt_per_customer")
  @@index([userId])
  @@index([customerId])
  @@index([date])
  @@index([method])
  @@map("sale_receipts")
}

// ========================================
// E-COMMERCE FEATURES
// ========================================

model Review {
  id        String   @id @default(cuid())
  rating    Int      // 1-5 stars
  title     String?
  comment   String?
  images    Json     @default("[]") // Array of image URLs

  // Status
  isVerified Boolean @default(false) // Verified purchase review
  isApproved Boolean @default(false) // Admin approved

  // Relations
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)

  ecommerceUserId String
  ecommerceUser   EcommerceUser @relation(fields: [ecommerceUserId], references: [id], onDelete: Cascade)

  orderId     String? // Link to purchase for verified reviews
  order       Order?  @relation(fields: [orderId], references: [id], onDelete: SetNull)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([inventoryItemId])
  @@index([ecommerceUserId])
  @@index([rating])
  @@index([isApproved])
  @@map("reviews")
}

model WishlistItem {
  id        String   @id @default(cuid())

  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)

  ecommerceUserId String
  ecommerceUser   EcommerceUser @relation(fields: [ecommerceUserId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())

  @@unique([inventoryItemId, ecommerceUserId])
  @@index([ecommerceUserId])
  @@map("wishlist_items")
}

model CartItem {
  id        String   @id @default(cuid())
  quantity  Int      @default(1)

  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)

  ecommerceUserId String
  ecommerceUser   EcommerceUser @relation(fields: [ecommerceUserId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([inventoryItemId, ecommerceUserId])
  @@index([ecommerceUserId])
  @@map("cart_items")
}

model Order {
  id             String      @id @default(cuid())
  orderNo        String      @unique
  date           DateTime    @default(now())
  status         OrderStatus @default(PENDING)
  totalAmount    Decimal     @db.Decimal(12, 2)
  paidAmount     Decimal     @default(0) @db.Decimal(12, 2)
  shippingAmount Decimal     @default(0) @db.Decimal(12, 2)
  taxAmount      Decimal     @default(0) @db.Decimal(12, 2)
  discountAmount Decimal     @default(0) @db.Decimal(12, 2)

  shippingAddress Json?      // {name, phone, address, city, state, pincode}
  billingAddress  Json?
  notes          String?

  // Additional fields
  source         String?     // ONLINE, PHONE, WALK_IN, ECOMMERCE
  priority       String?     // HIGH, NORMAL, LOW
  expectedDelivery DateTime?
  actualDelivery   DateTime?
  trackingNumber   String?

  // Relations - Can be either internal customer or ecommerce user
  customerId      String?
  customer        Customer?     @relation(fields: [customerId], references: [id], onDelete: Cascade)

  ecommerceUserId String?
  ecommerceUser   EcommerceUser? @relation(fields: [ecommerceUserId], references: [id], onDelete: Cascade)

  userId         String
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  // Relations
  items          OrderItem[]
  payments       OrderPayment[]
  notifications  Notification[]
  reviews        Review[]

  @@index([userId])
  @@index([customerId])
  @@index([ecommerceUserId])
  @@index([status])
  @@index([date])
  @@map("orders")
}

model OrderItem {
  id        String  @id @default(cuid())
  quantity  Int
  price     Decimal @db.Decimal(10, 2)
  total     Decimal @db.Decimal(12, 2)
  discount  Decimal @default(0) @db.Decimal(8, 2)

  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)

  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([orderId])
  @@index([inventoryItemId])
  @@map("order_items")
}

model OrderPayment {
  id               String        @id @default(cuid())
  amount           Decimal       @db.Decimal(12, 2)
  method           PaymentMethod
  status           String        // pending, completed, failed, refunded
  gatewayOrderId   String?       // Razorpay/Stripe order ID
  gatewayPaymentId String?       // Razorpay/Stripe payment ID
  transactionId    String?
  failureReason    String?

  orderId          String
  order            Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)

  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  @@index([orderId])
  @@index([status])
  @@map("order_payments")
}

// ========================================
// LEDGER & ACCOUNTING
// ========================================

model LedgerEntry {
  id          String     @id @default(cuid())
  date        DateTime
  description String
  debit       Decimal    @default(0) @db.Decimal(12, 2)
  credit      Decimal    @default(0) @db.Decimal(12, 2)
  balance     Decimal    @db.Decimal(12, 2)
  type        LedgerType
  reference   String?    // Reference to source document

  // Relations (nullable for flexibility)
  partyId     String?
  party       Party?     @relation(fields: [partyId], references: [id], onDelete: Cascade)

  customerId  String?
  customer    Customer?  @relation(fields: [customerId], references: [id], onDelete: Cascade)

  invoiceId   String?
  invoice     Invoice?   @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  saleId      String?
  sale        Sale?      @relation(fields: [saleId], references: [id], onDelete: Cascade)

  invoicePaymentId String?
  invoicePayment   InvoicePayment? @relation(fields: [invoicePaymentId], references: [id], onDelete: Cascade)

  saleReceiptId    String?
  saleReceipt      SaleReceipt?    @relation(fields: [saleReceiptId], references: [id], onDelete: Cascade)

  userId      String
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([userId])
  @@index([partyId])
  @@index([customerId])
  @@index([date])
  @@index([type])
  @@map("ledger_entries")
}

// ========================================
// COMMUNICATION & NOTIFICATIONS
// ========================================

model Notification {
  id        String             @id @default(cuid())
  title     String
  message   String
  type      NotificationType
  channel   NotificationChannel
  status    NotificationStatus @default(PENDING)

  // Recipient details
  recipientType String           // CUSTOMER, PARTY, USER
  recipientId   String
  recipientName String
  recipientContact String?

  // Message details
  templateName String?
  templateData Json?

  // Delivery details
  sentAt       DateTime?
  deliveredAt  DateTime?
  readAt       DateTime?
  failureReason String?
  retryCount   Int              @default(0)
  maxRetries   Int              @default(3)

  // External service details
  externalId   String?
  externalData Json?

  // Relations (nullable - notification can be related to any entity)
  partyId    String?
  party      Party?    @relation(fields: [partyId], references: [id], onDelete: Cascade)

  customerId String?
  customer   Customer? @relation(fields: [customerId], references: [id], onDelete: Cascade)

  invoiceId  String?
  invoice    Invoice?  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  saleId     String?
  sale       Sale?     @relation(fields: [saleId], references: [id], onDelete: Cascade)

  invoicePaymentId String?
  invoicePayment   InvoicePayment? @relation(fields: [invoicePaymentId], references: [id], onDelete: Cascade)

  saleReceiptId    String?
  saleReceipt      SaleReceipt?    @relation(fields: [saleReceiptId], references: [id], onDelete: Cascade)

  orderId    String?
  order      Order?    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([userId])
  @@index([status])
  @@index([type])
  @@index([channel])
  @@index([recipientType, recipientId])
  @@index([createdAt])
  @@index([sentAt])
  @@map("notifications")
}

model Reminder {
  id          String         @id @default(cuid())
  message     String
  type        ReminderType
  status      ReminderStatus @default(PENDING)
  scheduledAt DateTime
  sentAt      DateTime?
  channel     String         // whatsapp, sms, email
  metadata    Json?          // Additional data like template variables

  customerId  String
  customer    Customer       @relation(fields: [customerId], references: [id], onDelete: Cascade)

  userId      String
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@index([userId])
  @@index([customerId])
  @@index([status])
  @@index([scheduledAt])
  @@map("reminders")
}

// ========================================
// OCR & DOCUMENT PROCESSING
// ========================================

model OCRData {
  id            String    @id @default(cuid())
  imageUrl      String
  originalName  String?   // Original filename
  fileSize      Int?      // File size in bytes
  extractedData Json      @default("{}") // Raw extracted data from OCR
  processedData Json?     // Cleaned and structured data
  confidence    Float?
  status        OCRStatus @default(PROCESSING)
  errorMessage  String?   // Error details if failed

  // Relations (nullable - one OCR can be linked to any document)
  invoiceId     String?   @unique
  invoice       Invoice?  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  invoicePaymentId String? @unique
  invoicePayment   InvoicePayment? @relation(fields: [invoicePaymentId], references: [id], onDelete: Cascade)

  saleReceiptId    String? @unique
  saleReceipt      SaleReceipt? @relation(fields: [saleReceiptId], references: [id], onDelete: Cascade)

  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([userId])
  @@index([status])
  @@map("ocr_data")
}

// ========================================
// BACKUP & SYSTEM MANAGEMENT
// ========================================

model Backup {
  id          String    @id @default(cuid())
  type        String    // FULL, INCREMENTAL, SCHEMA
  description String?
  status      String    // IN_PROGRESS, COMPLETED, FAILED
  filePath    String?
  cloudPath   String?
  fileSize    BigInt?
  startedAt   DateTime
  completedAt DateTime?
  errorMessage String?

  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@index([status])
  @@map("backups")
}

model Restore {
  id          String    @id @default(cuid())
  backupId    String
  status      String    // IN_PROGRESS, COMPLETED, FAILED
  startedAt   DateTime
  completedAt DateTime?
  errorMessage String?

  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@index([status])
  @@map("restores")
}

model BackupSchedule {
  id        String   @id @default(cuid())
  frequency String   // DAILY, WEEKLY, MONTHLY
  time      String   // HH:MM format
  type      String   // FULL, INCREMENTAL
  enabled   Boolean  @default(true)

  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("backup_schedules")
}

// ========================================
// AUDIT & COMPLIANCE
// ========================================

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  action    String   // CREATE, UPDATE, DELETE, LOGIN, etc.
  entity    String   // Table name or resource
  entityId  String   // Record ID
  oldData   Json?    // Previous data
  newData   Json?    // New data
  metadata  Json?    // Additional context
  ipAddress String?
  userAgent String?

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([entity])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}

model SystemConfig {
  id    String @id @default(cuid())
  key   String @unique
  value Json

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("system_config")
}

// ========================================
// ENUMS
// ========================================

enum UserRole {
  OWNER
  MANAGER
  STAFF
  VIEWER
  ACCOUNTANT
}

enum InvoiceStatus {
  PENDING
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
}

enum SaleStatus {
  PENDING
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
  RETURNED
}

enum PaymentMethod {
  CASH
  BANK_TRANSFER
  CHEQUE
  UPI
  CARD
  ONLINE
  OTHER
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
  REFUNDED
}

enum LedgerType {
  // Document creation entries
  INVOICE_CREATED           // When invoice is received from supplier
  SALE_CREATED             // When sale is made to customer

  // Payment entries
  INVOICE_PAYMENT          // Payment made to supplier
  SALE_RECEIPT             // Receipt from customer
  EXPENSE_PAYMENT          // General business expenses
  ADVANCE_PAYMENT_MADE     // Advance paid to supplier
  ADVANCE_PAYMENT_RECEIVED // Advance received from customer

  // Adjustments
  ADJUSTMENT
  OPENING_BALANCE
  CLOSING_BALANCE

  // Additional specific types
  DISCOUNT_ALLOWED         // Discount given to customer
  DISCOUNT_RECEIVED        // Discount from supplier
  BAD_DEBT_WRITEOFF       // Uncollectable customer debt
  BANK_CHARGES            // Bank transaction charges
  INTEREST_EARNED         // Interest income
  INTEREST_PAID           // Interest expense
}

enum ReminderType {
  PAYMENT_DUE
  OVERDUE_PAYMENT
  FOLLOW_UP
  CUSTOM
  BIRTHDAY
  ANNIVERSARY
  STOCK_REORDER
  TAX_FILING
}

enum ReminderStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
  CANCELLED
}

enum OCRStatus {
  PROCESSING
  COMPLETED
  FAILED
  MANUAL_REVIEW
  CANCELLED
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  RETURNED
  REFUNDED
}

enum NotificationType {
  PAYMENT_REMINDER
  PAYMENT_CONFIRMATION
  INVOICE_CREATED
  INVOICE_OVERDUE
  SALE_CREATED
  ORDER_CONFIRMATION
  ORDER_STATUS_UPDATE
  STOCK_ALERT
  LOW_STOCK_ALERT
  REORDER_ALERT
  CUSTOM
  WELCOME
  BIRTHDAY
  ANNIVERSARY
  PROMOTIONAL
  SYSTEM_ALERT
  BACKUP_COMPLETED
  BACKUP_FAILED
}

enum NotificationChannel {
  WHATSAPP
  SMS
  EMAIL
  PUSH
  IN_APP
}

enum NotificationStatus {
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
  CANCELLED
}

enum MovementType {
  IN          // Stock received
  OUT         // Stock sold/dispatched
  ADJUSTMENT  // Manual stock correction
  TRANSFER    // Transfer between locations
  RETURN      // Customer/supplier returns
  DAMAGE      // Damaged goods writeoff
  SAMPLE      // Sample given to customer
  WASTAGE     // Production wastage
}

```

```typescript
// ========================================
// NOTIFICATION SCHEMAS
// ========================================

import { z } from "zod";

export const NotificationTypeSchema = z.enum([
    "PAYMENT_REMINDER",
    "PAYMENT_CONFIRMATION",
    "INVOICE_CREATED",
    "INVOICE_OVERDUE",
    "SALE_CREATED",
    "ORDER_CONFIRMATION",
    "ORDER_STATUS_UPDATE",
    "STOCK_ALERT",
    "LOW_STOCK_ALERT",
    "REORDER_ALERT",
    "CUSTOM",
    "WELCOME",
    "BIRTHDAY",
    "ANNIVERSARY",
    "PROMOTIONAL",
    "SYSTEM_ALERT",
    "BACKUP_COMPLETED",
    "BACKUP_FAILED",
]);

export const NotificationChannelSchema = z.enum([
    "WHATSAPP",
    "SMS",
    "EMAIL",
    "PUSH",
    "IN_APP",
]);

export const NotificationStatusSchema = z.enum([
    "PENDING",
    "SENT",
    "DELIVERED",
    "READ",
    "FAILED",
    "CANCELLED",
]);

export const ReminderTypeSchema = z.enum([
    "PAYMENT_DUE",
    "OVERDUE_PAYMENT",
    "FOLLOW_UP",
    "CUSTOM",
    "BIRTHDAY",
    "ANNIVERSARY",
    "STOCK_REORDER",
    "TAX_FILING",
]);

export const CreateNotificationSchema = z.object({
    title: z.string().min(1, "Title is required"),
    message: z.string().min(1, "Message is required"),
    type: NotificationTypeSchema,
    channel: NotificationChannelSchema,

    recipientType: z.enum(["CUSTOMER", "PARTY", "USER"]),
    recipientId: z.string().cuid("Invalid recipient ID"),
    recipientName: z.string().min(1, "Recipient name is required"),
    recipientContact: z.string().optional(),

    templateName: z.string().optional(),
    templateData: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),

    // Relations
    partyId: z.string().cuid().optional(),
    customerId: z.string().cuid().optional(),
    invoiceId: z.string().cuid().optional(),
    saleId: z.string().cuid().optional(),
    paymentId: z.string().cuid().optional(),
    receiptId: z.string().cuid().optional(),
    orderId: z.string().cuid().optional(),
});

export const SendWhatsAppSchema = z.object({
    phone: z.string().min(10, "Valid phone number required"),
    message: z.string().min(1, "Message is required"),
    templateName: z.string().optional(),
    templateData: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
});

export const SendEmailSchema = z.object({
    email: z.string().email("Valid email required"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Email body is required"),
    html: z.boolean().default(false),
    attachments: z
        .array(
            z.object({
                filename: z.string(),
                path: z.string(),
                contentType: z.string().optional(),
            })
        )
        .optional(),
});

export const SendSMSSchema = z.object({
    phone: z.string().min(10, "Valid phone number required"),
    message: z.string().min(1, "Message is required"),
});

export const CreateReminderSchema = z.object({
    message: z.string().min(1, "Message is required"),
    type: ReminderTypeSchema,
    scheduledAt: z.string().datetime("Invalid scheduled date"),
    channel: z.enum(["whatsapp", "sms", "email"]),
    metadata: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
    customerId: z.string().cuid("Invalid customer ID"),
});

export type CreateNotificationType = z.infer<typeof CreateNotificationSchema>;
export type SendWhatsAppType = z.infer<typeof SendWhatsAppSchema>;
export type SendEmailType = z.infer<typeof SendEmailSchema>;
export type SendSMSType = z.infer<typeof SendSMSSchema>;

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

// packages/common-backend/src/events/interfaces/base-interfaces.ts

import { Subjects } from "@repo/common/subjects";

// Base event interface
export interface BaseEvent {
    subject: Subjects;
    data: any;
}

// Kafka message wrapper
export interface KafkaMessage<T extends BaseEvent> {
    subject: T["subject"];
    data: T["data"];
    timestamp: string;
    eventId: string;
    version: string;
    userId?: string;
    correlationId?: string;
}

// packages/common-backend/src/events/interfaces/customerInterfaces.ts

import { BaseEvent } from "./base-interfaces";
import { Subjects } from "@repo/common/subjects";

// ========================================
// CUSTOMER LIFECYCLE EVENTS
// ========================================

export interface CustomerCreatedEvent extends BaseEvent {
    subject: Subjects.CustomerCreated;
    data: {
        id: string;
        name: string;
        phone?: string;
        email?: string;
        address?: string;
        city?: string;
        state?: string;
        pincode?: string;
        gstNumber?: string;
        creditLimit: number;
        dateOfBirth?: string;
        anniversary?: string;
        preferredContact?: string;
        tags: string[];
        notes?: string;
        createdBy: string;
        createdAt: string;
        userId: string;
    };
}

export interface CustomerUpdatedEvent extends BaseEvent {
    subject: Subjects.CustomerUpdated;
    data: {
        id: string;
        updatedAt: string;
        changes: Record<
            string,
            {
                oldValue: any;
                newValue: any;
            }
        >;
        updatedBy: string;
        nameChanged?: boolean;
        contactChanged?: boolean;
        creditLimitChanged?: boolean;
        addressChanged?: boolean;
    };
}

export interface CustomerDeletedEvent extends BaseEvent {
    subject: Subjects.CustomerDeleted;
    data: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
        deletedAt: string;
        deletedBy: string;
        hasOutstandingBalance?: boolean;
        finalBalance?: number;
        reason?: string;
    };
}

export interface CustomerActivatedEvent extends BaseEvent {
    subject: Subjects.CustomerActivated;
    data: {
        id: string;
        name: string;
        activatedBy: string;
        activatedAt: string;
        reason?: string;
        previousStatus?: string;
    };
}

export interface CustomerDeactivatedEvent extends BaseEvent {
    subject: Subjects.CustomerDeactivated;
    data: {
        id: string;
        name: string;
        deactivatedBy: string;
        deactivatedAt: string;
        reason?: string;
        hasOutstandingBalance?: boolean;
        outstandingAmount?: number;
    };
}

// ========================================
// CUSTOMER CONTACT EVENTS
// ========================================

export interface CustomerContactUpdatedEvent extends BaseEvent {
    subject: Subjects.CustomerContactUpdated;
    data: {
        id: string;
        name: string;
        contactChanges: {
            phone?: {
                oldValue?: string;
                newValue?: string;
            };
            email?: {
                oldValue?: string;
                newValue?: string;
            };
            address?: {
                oldValue?: string;
                newValue?: string;
            };
        };
        updatedBy: string;
        updatedAt: string;
        notificationsSent?: string[]; // channels where update notifications were sent
    };
}

// ========================================
// CUSTOMER CREDIT EVENTS
// ========================================

export interface CustomerCreditLimitUpdatedEvent extends BaseEvent {
    subject: Subjects.CustomerCreditLimitUpdated;
    data: {
        customerId: string;
        customerName: string;
        oldLimit: number;
        newLimit: number;
        changeAmount: number;
        changePercentage: number;
        reason: string;
        approvedBy?: string;
        updatedBy: string;
        updatedAt: string;
        currentBalance?: number;
        availableCredit?: number;
    };
}

export interface CustomerCreditLimitExceededEvent extends BaseEvent {
    subject: Subjects.CustomerCreditLimitExceeded;
    data: {
        customerId: string;
        customerName: string;
        creditLimit: number;
        currentBalance: number;
        excessAmount: number;
        transactionId?: string;
        transactionType?: "SALE" | "INVOICE" | "ADJUSTMENT";
        transactionAmount?: number;
        detectedAt: string;
        alertLevel: "WARNING" | "CRITICAL";
        actionTaken?: "BLOCKED" | "ALLOWED_WITH_APPROVAL" | "REQUIRES_REVIEW";
    };
}

export interface CustomerCreditLimitWarningEvent extends BaseEvent {
    subject: Subjects.CustomerCreditLimitWarning;
    data: {
        customerId: string;
        customerName: string;
        creditLimit: number;
        currentBalance: number;
        utilizationPercentage: number;
        warningThreshold: number;
        remainingCredit: number;
        warningLevel: "75%" | "90%" | "95%";
        detectedAt: string;
        recommendedAction?: string;
    };
}

// ========================================
// CUSTOMER LIFECYCLE MILESTONES
// ========================================

export interface CustomerFirstVisitEvent extends BaseEvent {
    subject: Subjects.CustomerFirstVisit;
    data: {
        customerId: string;
        customerName: string;
        visitDate: string;
        visitType: "PHYSICAL" | "ONLINE" | "PHONE";
        source?: string;
        referredBy?: string;
        initialInterest?: string[];
        staffAssigned?: string;
        welcomeMessageSent?: boolean;
    };
}

// export interface CustomerBecameVIPEvent extends BaseEvent {
//     subject: Subjects.CustomerBecameVIP;
//     data: {
//         customerId: string;
//         customerName: string;
//         totalPurchases: number;
//         totalAmount: number;
//         averageOrderValue: number;
//         memberSince: string;
//         promotedAt: string;
//         promotionCriteria: {
//             totalSpent?: number;
//             totalOrders?: number;
//             averageOrderValue?: number;
//             loyaltyPeriod?: number;
//         };
//         vipBenefits: string[];
//         notificationSent?: boolean;
//     };
// }

// export interface CustomerReturnVisitEvent extends BaseEvent {
//     subject: Subjects.CustomerReturnVisit;
//     data: {
//         customerId: string;
//         customerName: string;
//         visitDate: string;
//         visitNumber: number;
//         daysSinceLastVisit: number;
//         visitType: "PHYSICAL" | "ONLINE" | "PHONE";
//         purchaseMade?: boolean;
//         purchaseAmount?: number;
//         engagementLevel: "HIGH" | "MEDIUM" | "LOW";
//     };
// }

// export interface CustomerLongTimeNoVisitEvent extends BaseEvent {
//     subject: Subjects.CustomerLongTimeNoVisit;
//     data: {
//         customerId: string;
//         customerName: string;
//         lastVisitDate: string;
//         daysSinceLastVisit: number;
//         lastPurchaseDate?: string;
//         daysSinceLastPurchase?: number;
//         totalLifetimeValue: number;
//         riskLevel: "LOW" | "MEDIUM" | "HIGH";
//         recommendedAction:
//             | "REMINDER"
//             | "SPECIAL_OFFER"
//             | "PERSONAL_CALL"
//             | "WIN_BACK_CAMPAIGN";
//         detectedAt: string;
//     };
// }

// ========================================
// CUSTOMER LOYALTY EVENTS
// ========================================

export interface CustomerLoyaltyPointsEarnedEvent extends BaseEvent {
    subject: Subjects.CustomerLoyaltyPointsEarned;
    data: {
        customerId: string;
        customerName: string;
        pointsEarned: number;
        totalPoints: number;
        earnedFrom:
            | "PURCHASE"
            | "REFERRAL"
            | "BONUS"
            | "BIRTHDAY"
            | "ANNIVERSARY"
            | "REVIEW";
        referenceId?: string;
        referenceType?: "SALE" | "INVOICE" | "REFERRAL";
        multiplier?: number;
        campaignId?: string;
        earnedAt: string;
        expiryDate?: string;
    };
}

export interface CustomerLoyaltyPointsRedeemedEvent extends BaseEvent {
    subject: Subjects.CustomerLoyaltyPointsRedeemed;
    data: {
        customerId: string;
        customerName: string;
        pointsRedeemed: number;
        remainingPoints: number;
        redeemValue: number;
        redemptionType: "DISCOUNT" | "CASHBACK" | "GIFT" | "SERVICE";
        saleId?: string;
        discountAmount?: number;
        redeemedAt: string;
        staffProcessed?: string;
    };
}

// export interface CustomerReferralMadeEvent extends BaseEvent {
//     subject: Subjects.CustomerReferralMade;
//     data: {
//         referrerCustomerId: string;
//         referrerName: string;
//         referredCustomerId: string;
//         referredName: string;
//         referralCode?: string;
//         referralChannel:
//             | "WORD_OF_MOUTH"
//             | "SOCIAL_MEDIA"
//             | "EMAIL"
//             | "WHATSAPP"
//             | "OTHER";
//         referralDate: string;
//         referredCustomerFirstPurchase?: boolean;
//         referralRewardEarned?: number;
//         referralStatus: "PENDING" | "QUALIFIED" | "REWARDED";
//     };
// }

// // ========================================
// // CUSTOMER BEHAVIOR EVENTS
// // ========================================

// export interface CustomerPreferenceUpdatedEvent extends BaseEvent {
//     subject: Subjects.CustomerPreferenceUpdated;
//     data: {
//         customerId: string;
//         customerName: string;
//         preferenceType:
//             | "FABRIC"
//             | "COLOR"
//             | "STYLE"
//             | "PRICE_RANGE"
//             | "BRAND"
//             | "COMMUNICATION";
//         preferences: {
//             fabrics?: string[];
//             colors?: string[];
//             styles?: string[];
//             priceRange?: {
//                 min: number;
//                 max: number;
//             };
//             brands?: string[];
//             communicationChannel?: "EMAIL" | "WHATSAPP" | "SMS" | "PHONE";
//             frequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "SPECIAL_EVENTS";
//         };
//         updatedBy?: string;
//         updatedAt: string;
//         source:
//             | "CUSTOMER_REQUEST"
//             | "PURCHASE_BEHAVIOR"
//             | "SURVEY"
//             | "STAFF_OBSERVATION";
//     };
// }

// export interface CustomerComplaintReceivedEvent extends BaseEvent {
//     subject: Subjects.CustomerComplaintReceived;
//     data: {
//         customerId: string;
//         customerName: string;
//         complaintId: string;
//         complaintType:
//             | "PRODUCT_QUALITY"
//             | "SERVICE"
//             | "BILLING"
//             | "DELIVERY"
//             | "STAFF_BEHAVIOR"
//             | "OTHER";
//         severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
//         description: string;
//         relatedTransaction?: {
//             type: "SALE" | "INVOICE";
//             id: string;
//             number: string;
//             date: string;
//         };
//         channel: "PHONE" | "EMAIL" | "WHATSAPP" | "IN_PERSON" | "SOCIAL_MEDIA";
//         receivedBy: string;
//         receivedAt: string;
//         status:
//             | "NEW"
//             | "ACKNOWLEDGED"
//             | "INVESTIGATING"
//             | "RESOLVED"
//             | "CLOSED";
//         priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
//     };
// }

// export interface CustomerFeedbackReceivedEvent extends BaseEvent {
//     subject: Subjects.CustomerFeedbackReceived;
//     data: {
//         customerId: string;
//         customerName: string;
//         feedbackId: string;
//         feedbackType:
//             | "PRODUCT_REVIEW"
//             | "SERVICE_RATING"
//             | "SUGGESTION"
//             | "TESTIMONIAL"
//             | "GENERAL";
//         rating?: number; // 1-5 scale
//         feedback: string;
//         relatedTransaction?: {
//             type: "SALE" | "INVOICE";
//             id: string;
//             number: string;
//         };
//         channel: "EMAIL" | "WHATSAPP" | "PHONE" | "IN_PERSON" | "ONLINE_FORM";
//         isPositive: boolean;
//         tags?: string[];
//         receivedAt: string;
//         requiresResponse?: boolean;
//         publicReview?: boolean;
//     };
// }

// ========================================
// EXPORT ALL CUSTOMER EVENT TYPES
// ========================================

export type CustomerEventTypes =
    | CustomerCreatedEvent
    | CustomerUpdatedEvent
    | CustomerDeletedEvent
    | CustomerActivatedEvent
    | CustomerDeactivatedEvent
    | CustomerContactUpdatedEvent
    | CustomerCreditLimitUpdatedEvent
    | CustomerCreditLimitExceededEvent
    | CustomerCreditLimitWarningEvent
    | CustomerFirstVisitEvent
    // | CustomerBecameVIPEvent
    // | CustomerReturnVisitEvent
    // | CustomerLongTimeNoVisitEvent
    | CustomerLoyaltyPointsEarnedEvent
    | CustomerLoyaltyPointsRedeemedEvent;
// | CustomerReferralMadeEvent
// | CustomerPreferenceUpdatedEvent
// | CustomerComplaintReceivedEvent
// | CustomerFeedbackReceivedEvent;

import { prisma } from "@repo/db/prisma";
import {
    asyncHandler,
    comparePassword,
    CustomError,
    CustomResponse,
    hashPassword,
} from "@repo/common-backend/utils";
import jwt from "jsonwebtoken";
import {
    ChangePasswordSchema,
    ChangePasswordType,
    LoginSchema,
    LoginType,
    RegisterSchema,
    RegisterType,
    UpdateProfileSchema,
    UpdateProfileType,
} from "@repo/common/schemas";
import { logger, LogCategory } from "@repo/common-backend/logger";
import { generateTokens } from "../helpers/authHelpers";
import {
    UserCreatedPublisher,
    UserLoggedInPublisher,
} from "../events/publishers/authPublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";

export const register = asyncHandler(async (req, res) => {
    const validatedData: RegisterType = RegisterSchema.parse(req.body);

    logger.info("User registration attempt", LogCategory.AUTH, {
        email: validatedData.email,
        role: validatedData.role,
        ipAddress: req.ip,
    });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
    });

    if (existingUser) {
        logger.warn(
            "Registration failed - email already exists",
            LogCategory.AUTH,
            {
                email: validatedData.email,
                ipAddress: req.ip,
            }
        );
        throw new CustomError(409, "User with this email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
        data: {
            email: validatedData.email,
            name: validatedData.name,
            phone: validatedData.phone,
            password: hashedPassword,
            role: validatedData.role,
        },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
    });

    logger.logAuth("User Registered", user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
        ipAddress: req.ip,
    });

    // Audit log
    logger.audit(
        "CREATE",
        "User",
        user.id,
        user.id,
        null,
        {
            email: user.email,
            name: user.name,
            role: user.role,
        },
        {
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        }
    );

    // Publish user created event
    const userCreatedPublisher = new UserCreatedPublisher(
        kafkaWrapper.producer
    );
    await userCreatedPublisher.publish({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || undefined,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
    });

    logger.info("User registration successful", LogCategory.AUTH, {
        userId: user.id,
        email: user.email,
    });

    const response = new CustomResponse(
        201,
        "User registered successfully. Please login.",
        {
            user,
        }
    );

    res.status(response.statusCode).json(response);
});

export const login = asyncHandler(async (req, res) => {
    const validatedData: LoginType = LoginSchema.parse(req.body);

    logger.info("User login attempt", LogCategory.AUTH, {
        email: validatedData.email,
        ipAddress: req.ip,
    });

    // Find user
    const user = await prisma.user.findUnique({
        where: { email: validatedData.email },
    });

    if (!user) {
        logger.warn("Login failed - user not found", LogCategory.AUTH, {
            email: validatedData.email,
            ipAddress: req.ip,
        });
        throw new CustomError(401, "Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
        logger.warn("Login failed - user inactive", LogCategory.AUTH, {
            email: validatedData.email,
            userId: user.id,
            ipAddress: req.ip,
        });
        throw new CustomError(401, "Account is deactivated");
    }

    // Check password
    const isPasswordValid = await comparePassword(
        validatedData.password,
        user.password
    );

    if (!isPasswordValid) {
        // Increment failed login attempts
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: { increment: 1 },
                lastLoginIP: req.ip,
            },
        });

        logger.warn("Login failed - invalid password", LogCategory.AUTH, {
            email: validatedData.email,
            userId: user.id,
            ipAddress: req.ip,
        });
        throw new CustomError(401, "Invalid email or password");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);

    // Create session
    const session = await prisma.userSession.create({
        data: {
            userId: user.id,
            sessionToken: accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            deviceInfo: req.headers["user-agent"]
                ? { userAgent: req.headers["user-agent"] as string }
                : undefined,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        },
    });

    // Update user login info
    await prisma.user.update({
        where: { id: user.id },
        data: {
            lastLoginAt: new Date(),
            lastLoginIP: req.ip,
            failedLoginAttempts: 0, // Reset failed attempts
        },
    });

    logger.logAuth("User Logged In", user.id, {
        email: user.email,
        sessionId: session.id,
        ipAddress: req.ip,
    });

    // Publish user logged in event
    const userLoggedInPublisher = new UserLoggedInPublisher(
        kafkaWrapper.producer
    );
    await userLoggedInPublisher.publish({
        userId: user.id,
        email: user.email,
        sessionId: session.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        loginAt: new Date().toISOString(),
    });

    res.status(200)
        .cookie("accessToken", accessToken, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000,
            secure: true,
        })
        .json(
            new CustomResponse(200, "Login successful", {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    role: user.role,
                    isActive: user.isActive,
                },
                accessToken,
                refreshToken,
                expiresIn: process.env.JWT_EXPIRES_IN || "15m",
            })
        );
});

export const logout = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (userId && token) {
        // Deactivate session
        await prisma.userSession.updateMany({
            where: {
                userId,
                sessionToken: token,
                isActive: true,
            },
            data: {
                isActive: false,
            },
        });

        logger.logAuth("User Logged Out", userId, {
            ipAddress: req.ip,
        });
    }
    const options: {
        httpOnly: boolean;
        maxAge: number;
        secure: boolean;
    } = {
        httpOnly: true,
        maxAge: 0,
        secure: true,
    };
    res.status(200)
        .clearCookie("accessToken", options)
        .json(new CustomResponse(200, "Logout sucessfull"));
});

export const getProfile = asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new CustomError(404, "User not found");
    }

    const response = new CustomResponse(200, "Profile retrieved successfully", {
        user,
    });
    res.status(response.statusCode).json(response);
});

export const updateProfile = asyncHandler(async (req, res) => {
    const validatedData: UpdateProfileType = UpdateProfileSchema.parse(
        req.body
    );
    const userId = req.user!.userId;

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: validatedData,
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            updatedAt: true,
        },
    });

    logger.logAuth("Profile Updated", userId, {
        changes: validatedData,
        ipAddress: req.ip,
    });

    const response = new CustomResponse(200, "Profile updated successfully", {
        user: updatedUser,
    });
    res.status(response.statusCode).json(response);
});

export const changePassword = asyncHandler(async (req, res) => {
    const validatedData: ChangePasswordType = ChangePasswordSchema.parse(
        req.body
    );
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new CustomError(404, "User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
        validatedData.currentPassword,
        user.password
    );

    if (!isCurrentPasswordValid) {
        throw new CustomError(400, "Current password is incorrect");
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(validatedData.newPassword);

    // Update password
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
    });

    logger.logAuth("Password Changed", userId, {
        ipAddress: req.ip,
    });

    const response = new CustomResponse(200, "Password changed successfully");
    res.status(response.statusCode).json(response);
});

import { Subjects } from "@repo/common/subjects";
import {
    UserCreatedEvent,
    UserDeletedEvent,
    UserLoggedInEvent,
    UserUpdatedEvent,
} from "@repo/common-backend/interfaces";
import { KafkaPublisher } from "@repo/common-backend/kafka";

const Topic = "auth-event";

export class UserCreatedPublisher extends KafkaPublisher<UserCreatedEvent> {
    subject = Subjects.UserCreated as const;
    topic = Topic;
    protected generateMessageKey(data: UserCreatedEvent["data"]): string {
        return data.id;
    }
}

export class UserLoggedInPublisher extends KafkaPublisher<UserLoggedInEvent> {
    subject = Subjects.UserLoggedIn as const;
    topic = Topic;
    protected generateMessageKey(data: UserLoggedInEvent["data"]): string {
        return data.userId;
    }
}

export class UserUpdatedPublisher extends KafkaPublisher<UserUpdatedEvent> {
    subject = Subjects.UserUpdated as const;
    topic = Topic;

    protected generateMessageKey(data: UserUpdatedEvent["data"]): string {
        return data.updatedBy || data.id;
    }
}

export class UserDeletedPublisher extends KafkaPublisher<UserDeletedEvent> {
    subject = Subjects.UserDeleted as const;
    topic = "auth-event";
    protected generateMessageKey(data: UserDeletedEvent["data"]): string {
        return data.deletedBy || data.id;
    }
}

import express from "express";
import {
    changePassword,
    getProfile,
    login,
    logout,
    register,
    updateProfile,
} from "../controllers/authController";
import { authenticate } from "@repo/common-backend/middleware";
import {
    validateLogin,
    validateRegister,
    validateUpdateProfile,
} from "@repo/common-backend/validators";

const router = express.Router();

router.route("/login").post(validateLogin, login);
router.route("/register").post(validateRegister, register);
router.route("/logout").post(authenticate, logout);
router.route("/getProfile").get(authenticate, getProfile);
router
    .route("/updateProfile")
    .post(authenticate, validateUpdateProfile, updateProfile);
router.route("/changePassword").post(authenticate, changePassword);

export default router;

// apps/auth/src/app.ts
import express from "express";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
    res.status(200).send("Auth Server is alive").json({
        status: "healthy",
        service: "auth-service",
        timestamp: new Date().toISOString(),
    });
});

// ==============================================
//                   ROUTES
// ==============================================

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

app.use("/api/v1/ecommerce/auth");

// ==============================================
// ==============================================

app.use("*", (req, res) => {
    res.status(404).json({
        status: 404,
        message: "Route not found",
        success: false,
    });
});

export default app;
```
