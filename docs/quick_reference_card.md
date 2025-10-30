# 📇 Quick Reference Card: OCR Auto-Creation with Inventory

## 🎯 What Happens When You Upload an Invoice

```
┌──────────────────────────────────────────────────────┐
│ 1. Upload Invoice Photo                             │
│    POST /api/ocr/upload                              │
│    Response: { ocrId, status: "PROCESSING" }        │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│ 2. OCR Processes (5-10 seconds)                      │
│    • Extracts text                                   │
│    • Parses invoice fields                           │
│    • Parses item details                             │
│    • Calculates confidence                           │
└──────────────────────────────────────────────────────┘
                      ↓
        ┌─────────────┴─────────────┐
        │ Confidence ≥ 90%?          │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴─────────────┐
       YES                          NO
        │                            │
        ↓                            ↓
┌────────────────────┐    ┌────────────────────┐
│ 3A. AUTO-CREATE    │    │ 3B. MANUAL REVIEW  │
│ ✅ Create Invoice   │    │ ⚠️ Send Notification│
│ ✅ Find/Create Items│    │ "Review Required"  │
│ ✅ Add Stock        │    │ with review link   │
│ ✅ Send Success     │    │                    │
│    Notification     │    │ User reviews →     │
│                    │    │ User approves →    │
│ ⏱️ ~10 seconds      │    │ Then creates       │
└────────────────────┘    └────────────────────┘
```

---

## 🔑 Key Files

| File | Location | Purpose |
|------|----------|---------|
| **OCR Controller** | `apps/ocr/src/controllers/ocrController.ts` | Upload endpoint |
| **OCR Service** | `apps/ocr/src/services/ocrService.ts` | Processing logic |
| **OCR Publishers** | `apps/ocr/src/events/publishers/ocrPublishers.ts` | Publish events |
| **🆕 OCR Consumers** | `apps/accounts/src/events/consumers/ocrConsumers.ts` | **Auto-create invoices + inventory** |
| **Inventory Publishers** | `apps/accounts/src/events/publishers/inventoryPublishers.ts` | Publish inventory events |

---

## 📢 Events Flow

### **Published by OCR Service:**
- `OCRJobStarted` → When upload begins
- `OCRJobCompleted` → When confidence ≥ 85%
- `OCRManualReviewRequired` → When confidence < 85%
- `OCRJobFailed` → When processing fails

### **Consumed by Accounts Service:**
- `OCRJobCompleted` → **Auto-creates invoice + inventory**
- `OCRManualReviewRequired` → Generates review link

### **Published by Accounts Service:**
- `InvoiceCreated` → When invoice auto-created
- `InventoryItemCreated` → When new item auto-created
- `StockAdded` → When stock added to item

---

## 🏗️ Inventory Logic

### **For Each Item in Invoice:**

```
1. SEARCH for existing item:
   ├─ By SKU (exact match)
   ├─ By barcode (exact match)
   └─ By name (fuzzy match)
   
2. IF FOUND:
   ├─ Use existing item
   └─ Add stock to it
   
3. IF NOT FOUND:
   ├─ Create new inventory item
   │  ├─ Auto-generate SKU
   │  ├─ Set purchase price
   │  ├─ Set selling price (cost + 20%)
   │  └─ Publish: InventoryItemCreated
   └─ Add stock to new item
   
4. ADD STOCK:
   ├─ Update inventory.currentStock
   ├─ Create stock_movement record
   └─ Publish: StockAdded
```

---

## 🎮 Quick Commands

### **Start Services**
```bash
# OCR Service
cd apps/ocr && npm run dev

# Accounts Service (with consumers)
cd apps/accounts && npm run dev

# Kafka
docker-compose up -d kafka zookeeper
```

### **Test Upload**
```bash
curl -X POST http://localhost:3005/api/ocr/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "document=@invoice.jpg" \
  -F "documentType=invoice"
```

### **Check Status**
```bash
# Get OCR status
curl http://localhost:3005/api/ocr/{ocrId} \
  -H "Authorization: Bearer TOKEN"

# List invoices
curl http://localhost:3001/api/invoices \
  -H "Authorization: Bearer TOKEN"

# List inventory
curl http://localhost:3001/api/inventory/items \
  -H "Authorization: Bearer TOKEN"
```

### **Monitor Kafka**
```bash
# Watch OCR events
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic ocr-processing-events

# Watch inventory events
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic inventory-events
```

---

## 🔍 Quick Debugging

### **Invoice not created?**
```sql
-- Check OCR status
SELECT id, status, confidence, errorMessage 
FROM ocr_data 
WHERE id = 'YOUR_OCR_ID';

-- Check if low confidence
SELECT confidence, status 
FROM ocr_data 
WHERE confidence < 0.9;
```

### **Inventory item not created?**
```sql
-- Check invoice items
SELECT 
    i.invoiceNo,
    jsonb_array_elements(i.items::jsonb) ->> 'name' as item_name,
    jsonb_array_elements(i.items::jsonb) ->> 'inventoryItemId' as inv_id
FROM invoices i
WHERE i.createdAt > NOW() - INTERVAL '1 hour';

-- If inv_id is NULL, item creation failed
```

### **Stock not added?**
```sql
-- Check stock movements
SELECT 
    sm.inventoryItemId,
    i.name,
    sm.quantity,
    sm.previousStock,
    sm.newStock,
    sm.reference
FROM stock_movements sm
JOIN inventory_items i ON i.id = sm.inventoryItemId
WHERE sm.createdAt > NOW() - INTERVAL '1 hour';
```

### **Check logs**
```bash
# Accounts service logs
tail -f apps/accounts/logs/app.log | grep OCR

# Look for:
# - "OCR job completed - checking for auto-creation"
# - "Invoice auto-created from OCR"
# - "Auto-created new inventory item"
# - "Stock added from OCR invoice"
```

---

## ⚡ Performance Tips

### **For Faster Processing:**
1. Good quality photos (well-lit, clear)
2. Standard invoice format
3. Printed (not handwritten)
4. Proper document type selection

### **For Better Matching:**
1. Consistent item names
2. Use SKUs when possible
3. Keep inventory clean (no duplicates)
4. Regular data cleanup

### **For Scalability:**
1. Monitor consumer lag
2. Add more consumers if needed
3. Optimize database indexes
4. Archive old OCR data

---

## 📊 Quick Metrics

```sql
-- Auto-creation rate (last 7 days)
SELECT 
    ROUND(
        COUNT(CASE WHEN confidence >= 0.9 THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as auto_creation_percentage
FROM ocr_data 
WHERE createdAt > NOW() - INTERVAL '7 days';

-- Items auto-created today
SELECT COUNT(*) as items_created_today
FROM inventory_items
WHERE DATE(createdAt) = CURRENT_DATE;

-- Stock movements today
SELECT COUNT(*) as movements_today
FROM stock_movements
WHERE DATE(createdAt) = CURRENT_DATE;
```

---

## 🚨 Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Consumer not starting | Missing imports | Check publisher imports |
| Item not created | Validation failed | Check logs for error |
| Stock not added | Transaction failed | Check database constraints |
| Duplicate items | Poor matching | Improve matching logic |
| Low auto-rate | Poor image quality | Train users on photo quality |

---

## 🎯 Configuration

### **Environment Variables**
```bash
# apps/accounts/.env
FRONTEND_URL=http://localhost:3000
KAFKA_BROKERS=localhost:9092
DATABASE_URL=postgresql://...
```

### **Tunable Parameters**

```typescript
// In ocrConsumers.ts

// Auto-creation threshold
if (data.confidence < 0.9)  // Change to 0.85 or 0.95

// Markup percentage
sellingPrice: unitPrice * 1.2  // Change to 1.3 for 30%

// Default minimum stock
minimumStock: 10  // Change to 20 or 50

// SKU prefix length
.substring(0, 3)  // Change to 4 for longer prefix
```

---

## 📞 Quick Support

**Check First:**
1. Service logs
2. Database records
3. Kafka messages
4. This reference card

**Still Stuck?**
1. Check full documentation
2. Review implementation checklist
3. Verify all prerequisites
4. Test with sample data

---

## ✅ Success Checklist

- [ ] Services running
- [ ] Consumers started
- [ ] Test invoice uploaded
- [ ] Invoice auto-created
- [ ] Items in inventory
- [ ] Stock updated
- [ ] Events published
- [ ] Notifications sent

---

**Print this card and keep it handy!** 📌