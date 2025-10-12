# 📁 Complete OCR Service File Structure

## Directory Structure

```
apps/ocr/
├── src/
│   ├── controllers/
│   │   └── ocrController.ts          ← Enhanced controller (artifact: enhanced_ocr_controller)
│   ├── services/
│   │   ├── ocrService.ts             ← UPDATED with file reorganization (artifact: enhanced_ocr_service)
│   │   └── fileUploadService.ts      ← Updated with organized structure (artifact: file_upload_service)
│   ├── events/
│   │   └── publishers/
│   │       └── ocrPublishers.ts      ← Kafka publishers (artifact: ocr_publishers)
│   ├── routes/
│   │   └── ocrRoutes.ts              ← API routes (artifact: ocr_routes)
│   └── index.ts                      ← Main entry point (artifact: ocr_app_entry)
├── uploads/                          ← Local file storage
│   ├── Invoices/
│   │   ├── RAJLAX-TEXTILES/
│   │   │   └── 2025/
│   │   │       └── 10/
│   │   │           └── INV-RAJLAX-07-10-25.jpeg
│   │   └── ABC-TEXTILES-PVT-LTD/
│   │       └── 2025/
│   │           └── 10/
│   │               └── INV-ABC-10-10-25.jpeg
│   ├── Payments/
│   │   └── RAJLAX-TEXTILES/
│   │       └── 2025/
│   │           └── 10/
│   │               └── PAY-RAJLAX-15-10-25.jpeg
│   └── Receipts/
│       └── RAMESH-KUMAR/
│           └── 2025/
│               └── 10/
│                   └── REC-RAMESH-07-10-25.jpeg
├── package.json                      ← Updated with dependencies (artifact: ocr_package_json)
├── .env
└── tsconfig.json

apps/notification/
└── src/
    └── events/
        └── consumers/
            └── ocrConsumers.ts       ← OCR event consumers (artifact: ocr_consumer_example)
```

---

## 🎯 Key Changes Made

### 1. **ocrService.ts** - Lines 80-120 Added

```typescript
// ========================================
// FILE REORGANIZATION AFTER SUCCESSFUL PARSING
// ========================================
let finalImageUrl = imageUrl;
const fields = validatedData.fields.reduce((acc, field) => {
    acc[field.field] = field.value;
    return acc;
}, {} as Record<string, any>);

// Move file to organized structure if we have entity name
if (fields.partyName || fields.customerName) {
    try {
        finalImageUrl = await FileUploadService.moveToOrganizedStructure(
            imageUrl,
            documentType,
            {
                partyName: fields.partyName,
                customerName: fields.customerName,
                invoiceNo: fields.invoiceNo,
                receiptNo: fields.receiptNo,
                date: fields.date ? new Date(fields.date) : new Date(),
            }
        );

        logger.info("File moved to organized structure", LogCategory.OCR, {
            ocrId,
            oldPath: imageUrl,
            newPath: finalImageUrl,
            partyName: fields.partyName,
            customerName: fields.customerName,
        });
    } catch (moveError: any) {
        logger.warn("Failed to move file, keeping original path", LogCategory.OCR, {
            ocrId,
            error: moveError.message,
        });
    }
}
```

### 2. **fileUploadService.ts** - New Method Added

```typescript
/**
 * Upload file to local storage with organized structure
 * Structure:
 * - Invoices/{party-name}/{year}/{month}/{filename}
 * - Payments/{party-name}/{year}/{month}/{filename}
 * - Receipts/{customer-name}/{year}/{month}/{filename}
 */
static async uploadToLocalWithStructure(
    file: Express.Multer.File,
    userId: string,
    documentType: string,
    metadata?: {
        partyName?: string;
        customerName?: string;
        invoiceNo?: string;
        receiptNo?: string;
        date?: Date;
    }
): Promise<string>

/**
 * Move file to organized structure after OCR extraction
 */
static async moveToOrganizedStructure(
    currentPath: string,
    documentType: string,
    metadata: {
        partyName?: string;
        customerName?: string;
        invoiceNo?: string;
        receiptNo?: string;
        date?: Date;
    }
): Promise<string>
```

---

## 📋 Installation Steps

### Step 1: Install Dependencies
```bash
cd apps/ocr
npm install sharp fuse.js tesseract.js @google-cloud/vision @aws-sdk/client-s3
```

### Step 2: Setup Environment
```bash
# apps/ocr/.env
PORT=3005
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/textile_business
KAFKA_BROKERS=localhost:9092

# File Storage
UPLOAD_DIR=./uploads

# OCR Engine
USE_GOOGLE_VISION=false
USE_TESSERACT=true

# Google Cloud (optional)
GOOGLE_CLOUD_KEY_PATH=/path/to/key.json
```

### Step 3: Create Required Folders
```bash
mkdir -p apps/ocr/uploads/Invoices
mkdir -p apps/ocr/uploads/Payments
mkdir -p apps/ocr/uploads/Receipts
```

### Step 4: Update Shared Packages

**packages/common/src/subjects.ts** - Add these subjects:
```typescript
export enum Subjects {
    // ... existing subjects
    
    // OCR Events
    OCRProcessingStarted = "ocr:processing:started",
    OCRProcessingCompleted = "ocr:processing:completed",
    OCRProcessingFailed = "ocr:processing:failed",
    OCRDataReviewed = "ocr:data:reviewed",
    OCRDataApproved = "ocr:data:approved",
    OCRDataRejected = "ocr:data:rejected",
}
```

**packages/common/src/topics.ts** - Add topic:
```typescript
export enum TopicNames {
    // ... existing topics
    OCR_EVENTS = "ocr-events",
}
```

**packages/common-backend/src/logger/logCategories.ts** - Add category:
```typescript
export enum LogCategory {
    // ... existing categories
    OCR = "OCR",
}
```

---

## 🔄 Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER UPLOADS DOCUMENT                                    │
└─────────────────────────────────────────────────────────────┘
POST /api/ocr/upload
  - File: invoice.jpg
  - documentType: "invoice"
        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CONTROLLER (ocrController.ts)                            │
└─────────────────────────────────────────────────────────────┘
  ✓ Validates file
  ✓ Saves to: uploads/Invoices/UNKNOWN-PARTY/2025/10/temp.jpeg
  ✓ Creates OCRData record (status: PROCESSING)
  ✓ Publishes: OCRProcessingStartedEvent
  ✓ Starts async processing
  ✓ Responds immediately: { ocrId, status: "PROCESSING" }
        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. BACKGROUND PROCESSING (ocrService.ts)                    │
└─────────────────────────────────────────────────────────────┘
  ✓ Image quality check (Feature 4)
  ✓ Extract text (Tesseract/Google Vision)
  ✓ Parse with field confidence (Feature 2)
  ✓ Fuzzy match party/customer (Feature 3)
  ✓ Validate data (Feature 5)
  ✓ Check duplicates (Feature 1)
  ✓ Move file to organized folder:
      FROM: uploads/Invoices/UNKNOWN-PARTY/2025/10/temp.jpeg
      TO:   uploads/Invoices/RAJLAX-TEXTILES/2025/10/INV-RAJLAX-07-10-25.jpeg
  ✓ Updates OCRData with new path
  ✓ Publishes: OCRProcessingCompletedEvent
        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. NOTIFICATION SERVICE CONSUMES EVENT                      │
└─────────────────────────────────────────────────────────────┘
  ✓ OCRProcessingCompletedConsumer listens
  ✓ Sends notification to user:
      - In-app: "Document processed"
      - WhatsApp: "Invoice ready for review"
        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. USER REVIEWS & APPROVES                                  │
└─────────────────────────────────────────────────────────────┘
GET /api/ocr/:id
  → Shows extracted data with confidence scores
  
PUT /api/ocr/:id/review
  → User corrects any errors
  
POST /api/ocr/:id/approve
  → Creates Invoice record
  → Publishes: InvoiceCreatedEvent, OCRDataApprovedEvent
        ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. DOWNSTREAM SERVICES REACT                                │
└─────────────────────────────────────────────────────────────┘
  ✓ Accounts Service: Creates ledger entries
  ✓ Notification Service: Sends WhatsApp to party
  ✓ Reminder Service: Schedules payment reminder
```

---

## 🎯 Event Flow

### Published by OCR Service:
1. **OCRProcessingStartedEvent** - When upload begins
2. **OCRProcessingCompletedEvent** - When extraction succeeds
3. **OCRProcessingFailedEvent** - When extraction fails
4. **OCRDataReviewedEvent** - When user reviews data
5. **OCRDataApprovedEvent** - When user approves
6. **OCRDataRejectedEvent** - When user rejects

### Consumed by Notification Service:
```typescript
// apps/notification/src/index.ts

import { 
    OCRProcessingCompletedConsumer, 
    OCRProcessingFailedConsumer, 
    OCRDataApprovedConsumer 
} from "./events/consumers/ocrConsumers";

const startConsumers = async () => {
    // OCR consumers
    const ocrCompletedConsumer = new OCRProcessingCompletedConsumer(
        kafkaWrapper.consumer
    );
    const ocrFailedConsumer = new OCRProcessingFailedConsumer(
        kafkaWrapper.consumer
    );
    const ocrApprovedConsumer = new OCRDataApprovedConsumer(
        kafkaWrapper.consumer
    );
    
    await ocrCompletedConsumer.listen();
    await ocrFailedConsumer.listen();
    await ocrApprovedConsumer.listen();
    
    logger.info("OCR consumers started", LogCategory.NOTIFICATION);
};

startConsumers();
```

---

## 🧪 Testing

### Test 1: Upload & Process
```bash
curl -X POST http://localhost:3005/api/ocr/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@invoice.jpg" \
  -F "documentType=invoice"

# Response:
{
  "statusCode": 202,
  "message": "Document uploaded successfully. Processing started.",
  "data": {
    "ocrId": "clx123abc",
    "imageUrl": "uploads/Invoices/UNKNOWN-PARTY/2025/10/temp_123456.jpeg",
    "status": "PROCESSING"
  }
}
```

### Test 2: Check Status
```bash
curl http://localhost:3005/api/ocr/clx123abc \
  -H "Authorization: Bearer YOUR_TOKEN"

# After processing completes:
{
  "statusCode": 200,
  "data": {
    "ocrData": {
      "id": "clx123abc",
      "imageUrl": "uploads/Invoices/RAJLAX-TEXTILES/2025/10/INV-RAJLAX-07-10-25.jpeg",
      "status": "COMPLETED",
      "confidence": 0.92,
      "extractedData": {
        "fields": [
          { "field": "invoiceNo", "value": "INV-RAJLAX-001", "confidence": 0.95 },
          { "field": "amount", "value": 15000, "confidence": 0.92 },
          { "field": "partyName", "value": "Rajlax Textiles", "confidence": 0.88 }
        ]
      }
    }
  }
}
```

### Test 3: Verify File Structure
```bash
# Check organized folder
ls -la uploads/Invoices/RAJLAX-TEXTILES/2025/10/

# Output:
-rw-r--r-- 1 user user 245678 Oct  7 10:30 INV-RAJLAX-07-10-25.jpeg
```

### Test 4: Check Database
```sql
SELECT id, imageUrl, status, confidence 
FROM ocr_data 
WHERE id = 'clx123abc';

-- Should show:
-- imageUrl: uploads/Invoices/RAJLAX-TEXTILES/2025/10/INV-RAJLAX-07-10-25.jpeg
-- status: COMPLETED
-- confidence: 0.92
```

---

## 📊 File Organization Examples

### Example 1: Multiple Invoices Same Party
```
uploads/Invoices/RAJLAX-TEXTILES/2025/10/
├── INV-RAJLAX-001-07-10-25.jpeg
├── INV-RAJLAX-002-08-10-25.jpeg
├── INV-RAJLAX-003-09-10-25.jpeg
└── INV-RAJLAX-004-15-10-25.jpeg
```

### Example 2: Different Parties
```
uploads/Invoices/
├── RAJLAX-TEXTILES/
│   └── 2025/10/
│       └── INV-RAJLAX-001-07-10-25.jpeg
├── ABC-TEXTILES-PVT-LTD/
│   └── 2025/10/
│       └── INV-ABC-001-10-10-25.jpeg
└── XYZ-SUPPLIERS/
    └── 2025/10/
        └── INV-XYZ-123-15-10-25.jpeg
```

### Example 3: All Document Types
```
uploads/
├── Invoices/RAJLAX-TEXTILES/2025/10/INV-RAJLAX-001-07-10-25.jpeg
├── Payments/RAJLAX-TEXTILES/2025/10/PAY-RAJLAX-001-15-10-25.jpeg
└── Receipts/RAMESH-KUMAR/2025/10/REC-RAMESH-001-07-10-25.jpeg
```

---

## ✅ Summary

**All 5 Must-Have Features Implemented:**
1. ✅ Duplicate Detection
2. ✅ Per-Field Confidence Scores
3. ✅ Fuzzy Matching
4. ✅ Image Quality Pre-Check
5. ✅ Validation Rules

**Additional Features:**
- ✅ Organized file storage (Party/Year/Month/Filename)
- ✅ Automatic file reorganization after OCR
- ✅ Event-driven architecture with Kafka
- ✅ Notification service integration
- ✅ Complete workflow from upload to approval

**Files Updated:**
1. `apps/ocr/src/services/ocrService.ts` - Added file reorganization
2. `apps/ocr/src/services/fileUploadService.ts` - Added organized storage
3. `apps/ocr/src/controllers/ocrController.ts` - Enhanced controller
4. `apps/ocr/src/events/publishers/ocrPublishers.ts` - Event publishers
5. `apps/notification/src/events/consumers/ocrConsumers.ts` - Event consumers

Everything is ready to use! 🚀