# 📦 Inventory Handling in OCR Auto-Creation

## 🎯 What We've Added

Your enhanced consumer now **automatically handles inventory** when creating invoices from OCR. Here's exactly what happens:

---

## 🔄 Complete Flow with Inventory

```
User uploads invoice with items
    ↓
OCR extracts: Invoice + Items
    ↓
OCRJobCompletedConsumer receives event (confidence ≥ 90%)
    ↓
    ┌─────────────────────────────────────┐
    │ FOR EACH ITEM IN INVOICE:          │
    │                                     │
    │ 1. Search for existing inventory   │
    │    - By SKU/barcode (exact match)  │
    │    - By name (fuzzy match)         │
    │         ↓                          │
    │    ┌────┴────┐                    │
    │    │ FOUND?  │                    │
    │    └────┬────┘                    │
    │         │                          │
    │    ┌────┴──────┐                  │
    │  YES          NO                   │
    │    │            │                  │
    │    │            ↓                  │
    │    │    2. CREATE NEW ITEM        │
    │    │       - Auto-generate SKU    │
    │    │       - Set defaults         │
    │    │       - Publish:             │
    │    │         InventoryItemCreated │
    │    │            │                  │
    │    └────────────┘                  │
    │         │                          │
    │         ↓                          │
    │ 3. ADD STOCK                       │
    │    - Increment currentStock        │
    │    - Create StockMovement          │
    │    - Publish: StockAdded           │
    │         │                          │
    │         ↓                          │
    │ 4. Link to Invoice                 │
    │    - Save inventoryItemId          │
    └─────────────────────────────────────┘
    ↓
Invoice created with all items linked to inventory
    ↓
✅ DONE!
```

---

## 🧩 Key Features

### **1. Intelligent Item Matching**

```typescript
// Tries to find existing inventory item
private async findInventoryItem(name, sku, userId) {
    // Priority 1: Exact SKU/barcode match
    if (sku) {
        const item = await prisma.inventoryItem.findFirst({
            where: { sku } OR { barcode: sku }
        });
        if (item) return item; // ✅ Found by SKU
    }
    
    // Priority 2: Name match (case-insensitive)
    if (name) {
        const item = await prisma.inventoryItem.findFirst({
            where: {
                name: { contains: name, mode: "insensitive" }
            }
        });
        if (item) return item; // ✅ Found by name
    }
    
    return null; // ❌ Not found - will create new
}
```

**Examples:**
- Invoice has "Cotton Fabric" → Finds existing "COTTON FABRIC" (case-insensitive)
- Invoice has SKU "FAB-001" → Finds item with sku="FAB-001"
- Invoice has "New Product XYZ" → Not found → Creates new item

---

### **2. Auto-Creation of New Items**

When an item is **not found**, it's automatically created:

```typescript
private async createInventoryItem(itemData, userId, ocrId) {
    const itemName = itemData.name || "Unknown Item";
    const sku = itemData.sku || generateSKU(itemName); // Auto-generate
    
    const inventoryItem = await prisma.inventoryItem.create({
        data: {
            name: itemName,
            sku, // e.g., "COT-123456"
            category: itemData.category || "OTHER",
            unit: itemData.unit || "PCS",
            currentStock: 0,
            minimumStock: 10,
            purchasePrice: itemData.unitPrice || 0,
            sellingPrice: itemData.unitPrice * 1.2, // 20% markup
            hsnCode: itemData.hsnCode,
            taxRate: itemData.taxRate || 0,
            userId,
            isActive: true,
        },
    });
    
    // 📢 Publish event
    await inventoryCreatedPublisher.publish({
        id: inventoryItem.id,
        name: itemName,
        sku,
        autoCreatedFromOCR: true,
        ocrJobId: ocrId,
    });
    
    return inventoryItem;
}
```

**Default Values:**
- `currentStock`: 0 (updated when stock added)
- `minimumStock`: 10
- `sellingPrice`: Purchase price + 20% markup
- `category`: "OTHER" (if not specified)
- `unit`: "PCS" (if not specified)

**SKU Generation:**
```typescript
private generateSKU(itemName: string): string {
    // "Cotton Fabric" → "COF-123456"
    const prefix = itemName
        .split(" ")
        .map(word => word.charAt(0))
        .join("")
        .toUpperCase()
        .substring(0, 3);
    
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
}
```

---

### **3. Stock Addition**

After creating/finding the item, stock is added:

```typescript
private async addStockForInvoiceItems(items, invoiceId, userId) {
    for (const item of items) {
        if (!item.inventoryItemId) continue;
        
        const previousStock = item.currentStock;
        const newStock = previousStock + item.quantity;
        
        await prisma.$transaction(async (tx) => {
            // 1. Update inventory stock
            await tx.inventoryItem.update({
                where: { id: item.inventoryItemId },
                data: {
                    currentStock: { increment: item.quantity },
                    lastPurchaseDate: new Date(),
                    lastPurchasePrice: item.unitPrice,
                },
            });
            
            // 2. Create stock movement record
            await tx.stockMovement.create({
                data: {
                    inventoryItemId: item.inventoryItemId,
                    type: "IN",
                    quantity: item.quantity,
                    previousStock,
                    newStock,
                    reason: "Purchase from supplier",
                    reference: invoiceId,
                    unitPrice: item.unitPrice,
                    totalValue: item.unitPrice * item.quantity,
                    userId,
                },
            });
        });
        
        // 3. 📢 Publish stock added event
        await stockAddedPublisher.publish({
            inventoryItemId: item.inventoryItemId,
            inventoryItemName: item.name,
            quantity: item.quantity,
            previousStock,
            newStock,
            unitPrice: item.unitPrice,
            reason: "Purchase from supplier via OCR",
            reference: invoiceId,
        });
    }
}
```

---

## 📊 Events Published

### **1. InventoryItemCreatedPublisher**
**When:** New item is created (not found in existing inventory)

```typescript
{
    id: "inv_123",
    name: "Cotton Fabric",
    sku: "COT-123456",
    category: "FABRIC",
    unit: "METER",
    purchasePrice: 150,
    sellingPrice: 180,
    currentStock: 0,
    minimumStock: 10,
    autoCreatedFromOCR: true,
    ocrJobId: "ocr_789",
    userI