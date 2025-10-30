# Complete OCR Document Flow - From Upload to Approval

## 🔄 The Complete Journey

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: USER UPLOADS DOCUMENT                                   │
│ POST /api/ocr/upload                                             │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: OCR SERVICE PROCESSES (Background - 5-10 seconds)       │
│ • Checks image quality                                           │
│ • Extracts text (Tesseract/Google Vision)                       │
│ • Parses fields with confidence scores                           │
│ • Fuzzy matches party/customer names                            │
│ • Validates data                                                 │
│ • Checks for duplicates                                          │
│ • Moves file to organized folder                                 │
│ • Calculates overall confidence                                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: OCR SERVICE PUBLISHES COMPLETION EVENT                  │
│ OCRJobCompletedPublisher.publish({                              │
│   confidence: 0.92,                                              │
│   requiresReview: false  // or true if confidence < 85%         │
│ })                                                               │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: NOTIFICATION SERVICE SENDS ALERT                        │
│ OCRProcessingCompletedConsumer receives event                   │
│    ↓                                                             │
│ Creates in-app notification:                                    │
│ • High confidence: "✅ Document Processed"                       │
│ • Low confidence: "⚠️ Review Required"                          │
└─────────────────────────────────────────────────────────────────┘
                          ↓
         ┌────────────────┴────────────────┐
         │                                  │
    High Confidence                    Low Confidence
    (>85% confident)                   (<85% confident)
         │                                  │
         ↓                                  ↓
┌──────────────────────┐         ┌──────────────────────┐
│ STEP 5A: USER CHECKS │         │ STEP 5B: USER REVIEWS│
│ Document is ready    │         │ Must check data      │
│                      │         │                      │
│ GET /api/ocr/:id     │         │ GET /api/ocr/:id     │
│ Shows:               │         │ Shows:               │
│ • Extracted data ✅  │         │ • Extracted data ⚠️  │
│ • High confidence    │         │ • Low confidence     │
│ • All fields OK      │         │ • Some fields flagged│
│                      │         │                      │
│ User sees:           │         │ User sees:           │
│ [Approve] button     │         │ Fields highlighted:  │
│                      │         │ • Party name: 88%    │
│                      │         │ • Amount: 65%        │
│                      │         │                      │
│                      │         │ User can:            │
│                      │         │ • Correct errors     │
│                      │         │ • Confirm values     │
│                      │         │                      │
│                      │         │ PUT /api/ocr/:id/review│
│                      │         │ {                    │
│                      │         │   correctedData: {   │
│                      │         │     amount: 15500    │
│                      │         │   }                  │
│                      │         │ }                    │
└──────────┬───────────┘         └──────────┬───────────┘
           │                                 │
           └─────────────┬───────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: USER APPROVES DOCUMENT                                  │
│ POST /api/ocr/:id/approve                                       │
│ {                                                                │
│   createRecord: true,                                            │
│   documentType: "invoice"                                        │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: OCR SERVICE CREATES INVOICE                             │
│ • Creates Invoice record in database                            │
│ • Links OCR data to Invoice                                     │
│ • Publishes OCRDataApprovedEvent                                │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: NOTIFICATION SERVICE SENDS CONFIRMATION                 │
│ • In-app: "✅ Invoice Created"                                   │
│ • WhatsApp: "Invoice #123 created successfully"                 │
└─────────────────────────────────────────────────────────────────┘
                          ↓
                    ✅ DONE!
```

---

## 📱 User Experience Timeline

### Timeline for HIGH CONFIDENCE Document:

```
10:00:00 AM - User uploads invoice.jpg
10:00:01 AM - OCR starts processing
10:00:05 AM - OCR completes (confidence: 92%)
10:00:06 AM - 🔔 Notification: "Document Processed"
10:00:10 AM - User opens app, clicks notification
10:00:12 AM - User reviews data (all looks good)
10:00:15 AM - User clicks [Approve & Create Invoice]
10:00:16 AM - ✅ Invoice created
10:00:17 AM - 🔔 Notification: "Invoice Created"
              💬 WhatsApp: "Invoice #123 created"
```

### Timeline for LOW CONFIDENCE Document:

```
10:00:00 AM - User uploads blurry invoice
10:00:01 AM - OCR starts processing
10:00:08 AM - OCR completes (confidence: 68%)
10:00:09 AM - ⚠️ Notification: "Review Required"
10:00:15 AM - User opens app, clicks notification
10:00:20 AM - User sees:
              • Invoice No: "INV-123" (95% ✅)
              • Party Name: "Rajlax Textiles" (88% ⚠️)
              • Amount: "15,00" (65% ❌)
10:00:30 AM - User corrects amount to "15000"
10:00:35 AM - User clicks [Save Review]
10:00:36 AM - Data saved, ready to approve
10:00:40 AM - User clicks [Approve & Create Invoice]
10:00:41 AM - ✅ Invoice created with corrected data
10:00:42 AM - 🔔 Notification: "Invoice Created"
```

---

## 🎯 What Triggers Each Step?

### 1. Document Upload (User Action)
```bash
POST /api/ocr/upload
```
**User does:** Clicks "Upload" button in app

### 2. OCR Processing (Automatic)
**Trigger:** File saved to disk
**Duration:** 5-10 seconds
**What happens:** 
- Quality check
- Text extraction
- Field parsing
- Validation

### 3. Completion Event (Automatic)
**Trigger:** Processing finishes
**What happens:** Publishes `OCRJobCompleted` event

### 4. Notification (Automatic)
**Trigger:** Completion event received
**What happens:** User gets push notification

### 5A. View Document - High Confidence (User Action)
```bash
GET /api/ocr/:id
```
**User does:** Clicks notification or views document list
**User sees:** 
```json
{
  "title": "Document Processed",
  "confidence": 0.92,
  "extractedData": {
    "invoiceNo": "INV-123",
    "amount": 15000,
    "partyName": "Rajlax Textiles"
  },
  "status": "COMPLETED",
  "canApprove": true
}
```

### 5B. Review Document - Low Confidence (User Action)
```bash
GET /api/ocr/:id
```
**User sees:**
```json
{
  "title": "Review Required",
  "confidence": 0.68,
  "extractedData": {
    "fields": [
      {
        "field": "invoiceNo",
        "value": "INV-123",
        "confidence": 0.95,
        "needsReview": false
      },
      {
        "field": "amount",
        "value": "15,00",
        "confidence": 0.65,
        "needsReview": true  ← FLAG!
      }
    ]
  },
  "lowConfidenceFields": ["amount"],
  "status": "MANUAL_REVIEW"
}
```

**User can correct:**
```bash
PUT /api/ocr/:id/review
{
  "correctedData": {
    "amount": 15000
  },
  "notes": "Corrected OCR misread comma"
}
```

### 6. Approve Document (User Action)
```bash
POST /api/ocr/:id/approve
{
  "createRecord": true,
  "documentType": "invoice"
}
```
**User does:** Clicks "Approve & Create Invoice" button

### 7. Create Invoice (Automatic)
**Trigger:** Approve request
**What happens:** 
- Creates Invoice in database
- Links to OCR data
- Publishes approval event

### 8. Confirmation (Automatic)
**Trigger:** Invoice created
**What happens:** User gets success notifications

---

## 🖥️ UI Flow (What User Sees)

### Screen 1: Upload
```
┌─────────────────────────────┐
│ Upload Invoice              │
├─────────────────────────────┤
│                             │
│    [📁 Select File]         │
│                             │
│    [📷 Take Photo]          │
│                             │
└─────────────────────────────┘
```

### Screen 2: Processing (5-10 seconds)
```
┌─────────────────────────────┐
│ Processing...               │
├─────────────────────────────┤
│                             │
│     ⏳ Extracting data      │
│                             │
│     Please wait...          │
│                             │
└─────────────────────────────┘
```

### Screen 3A: High Confidence Result
```
┌─────────────────────────────┐
│ ✅ Document Processed       │
├─────────────────────────────┤
│ Invoice No: INV-123         │
│ Party: Rajlax Textiles      │
│ Amount: ₹15,000             │
│ Date: 07-10-2025            │
│                             │
│ Confidence: 92% ✅          │
│                             │
│ [Approve & Create Invoice]  │
└─────────────────────────────┘
```

### Screen 3B: Low Confidence Result
```
┌─────────────────────────────┐
│ ⚠️ Review Required          │
├─────────────────────────────┤
│ Invoice No: INV-123 ✅      │
│ Party: Rajlax Textiles ⚠️   │
│ Amount: 15,00 ❌            │
│         └─ 65% confidence   │
│         [Edit: 15000]       │
│ Date: 07-10-2025 ✅         │
│                             │
│ [Save Corrections]          │
│ [Approve & Create Invoice]  │
└─────────────────────────────┘
```

### Screen 4: Success
```
┌─────────────────────────────┐
│ ✅ Invoice Created          │
├─────────────────────────────┤
│ Invoice #INV-123            │
│ Successfully created        │
│                             │
│ [View Invoice]              │
│ [Upload Another]            │
└─────────────────────────────┘
```

---

## 🔍 When Does Review Happen?

### Answer: **After OCR completion notification**

**Review happens when:**
1. ✅ User receives "Review Required" notification (low confidence)
2. ✅ User clicks notification or views document
3. ✅ User sees highlighted fields that need checking
4. ✅ User corrects any errors
5. ✅ User saves corrections
6. ✅ User approves document

**Review does NOT happen when:**
- ❌ High confidence (>85%) - user can approve directly
- ❌ User trusts the data - can approve without reviewing

---

## ⚡ Quick Answer to Your Question

> "When does the review of document happen, OCRJobCompleted alert happens after that what?"

**Answer:**

1. **OCRJobCompleted event** happens immediately after processing (5-10 seconds after upload)

2. **User gets notification:**
   - High confidence → "Document Processed" → User can approve directly
   - Low confidence → "Review Required" → User MUST review first

3. **Review happens:**
   - User opens the document
   - User checks extracted data
   - User corrects any errors
   - User clicks "Save Review"

4. **After review:**
   - User clicks "Approve & Create Invoice"
   - Invoice created
   - User gets "Invoice Created" notification

**Flow:** Upload → Process (auto) → Notify (auto) → **Review (user)** → Approve (user) → Create Invoice (auto) → Notify Success (auto)

---

## 📊 Confidence Thresholds

| Confidence | Status | User Action Required |
|------------|--------|---------------------|
| > 90% | COMPLETED | Optional review |
| 85-90% | COMPLETED | Recommended review |
| 70-85% | MANUAL_REVIEW | Required review |
| < 70% | MANUAL_REVIEW | Detailed review required |

---

Hope this makes it crystal clear! Any other questions about the flow? 🚀