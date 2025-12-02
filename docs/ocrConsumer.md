```typescript
// apps/accounts/src/events/consumers/ocrConsumers.ts
// ENHANCED VERSION WITH INVENTORY MANAGEMENT

import { KafkaConsumer } from "@repo/common-backend/kafka";
import {
    OCRJobCompletedEvent,
    OCRManualReviewRequiredEvent,
} from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { TopicNames } from "@repo/common/topics";
import { prisma } from "@repo/db/prisma";
import { logger, LogCategory } from "@repo/common-backend/logger";
import { InvoiceCreatedPublisher } from "../publishers/invoicePublishers";
import {
    InventoryItemCreatedPublisher,
    StockAddedPublisher,
} from "../publishers/inventoryPublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import { generateInvoiceVoucherId } from "@repo/common-backend/utils";

// ========================================
// 1. AUTO-CREATE INVOICE WITH INVENTORY (Confidence ≥ 90%)
// ========================================
export class OCRJobCompletedConsumer extends KafkaConsumer<OCRJobCompletedEvent> {
    topic = TopicNames.OCR_PROCESSING_EVENTS;
    subject = Subjects.OCRJobCompleted as const;
    queueGroupName = "accounts-ocr-auto-create-group";

    async onMessage(data: OCRJobCompletedEvent["data"]): Promise<void> {
        logger.info(
            "OCR job completed - checking for auto-creation",
            LogCategory.OCR,
            {
                jobId: data.jobId,
                confidence: data.confidence,
                status: data.status,
            }
        );

        // ========================================
        // RULE: Only auto-create if confidence ≥ 90%
        // ========================================
        if (data.confidence < 0.9) {
            logger.info(
                "Confidence below 90% - skipping auto-creation",
                LogCategory.OCR,
                {
                    jobId: data.jobId,
                    confidence: data.confidence,
                }
            );
            return;
        }

        try {
            // Fetch OCR data from database
            const ocrData = await prisma.oCRData.findUnique({
                where: { id: data.jobId },
            });

            if (!ocrData) {
                logger.error("OCR data not found", undefined, LogCategory.OCR, {
                    jobId: data.jobId,
                });
                return;
            }

            // Check if already linked to an invoice
            if (ocrData.invoiceId) {
                logger.info(
                    "OCR already linked to invoice - skipping",
                    LogCategory.OCR,
                    {
                        jobId: data.jobId,
                        invoiceId: ocrData.invoiceId,
                    }
                );
                return;
            }

            // Extract processed data
            const processedData = ocrData.processedData as any;
            if (!processedData) {
                logger.warn("No processed data available", LogCategory.OCR, {
                    jobId: data.jobId,
                });
                return;
            }

            // ========================================
            // AUTO-CREATE INVOICE WITH INVENTORY
            // ========================================
            const invoice = await this.createInvoiceWithInventoryFromOCR(
                processedData,
                ocrData.userId,
                ocrData.id
            );

            logger.info(
                "Invoice auto-created from OCR with inventory",
                LogCategory.INVOICE,
                {
                    ocrId: ocrData.id,
                    invoiceId: invoice.id,
                    invoiceNo: invoice.invoiceNo,
                    amount: invoice.amount,
                    confidence: data.confidence,
                    itemsProcessed: invoice.items?.length || 0,
                }
            );

            // ========================================
            // PUBLISH INVOICE CREATED EVENT
            // ========================================
            const invoiceCreatedPublisher = new InvoiceCreatedPublisher(
                kafkaWrapper.producer
            );
            await invoiceCreatedPublisher.publish({
                id: invoice.id,
                voucherId: invoice.voucherId,
                invoiceNo: invoice.invoiceNo,
                date: invoice.date.toISOString(),
                dueDate: invoice.dueDate?.toISOString(),
                amount: Number(invoice.amount),
                remainingAmount: Number(invoice.remainingAmount),
                partyId: invoice.partyId,
                partyName: invoice.party?.name || "Unknown",
                items: invoice.items as any,
                status: invoice.status,
                createdBy: invoice.userId,
                createdAt: invoice.createdAt.toISOString(),
                autoCreatedFromOCR: true,
                ocrJobId: ocrData.id,
                ocrConfidence: data.confidence,
                userId: ocrData.userId,
            });

            logger.info(
                "Invoice creation event published",
                LogCategory.INVOICE,
                {
                    invoiceId: invoice.id,
                    ocrId: ocrData.id,
                }
            );
        } catch (error: any) {
            logger.error(
                "Failed to auto-create invoice from OCR",
                undefined,
                LogCategory.OCR,
                {
                    jobId: data.jobId,
                    error: error.message,
                    stack: error.stack,
                }
            );

            // Update OCR status to MANUAL_REVIEW on failure
            await prisma.oCRData.update({
                where: { id: data.jobId },
                data: {
                    status: "MANUAL_REVIEW",
                    errorMessage: `Auto-creation failed: ${error.message}`,
                },
            });
        }
    }

    // ========================================
    // CREATE INVOICE WITH INVENTORY FROM OCR DATA
    // ========================================
    private async createInvoiceWithInventoryFromOCR(
        processedData: any,
        userId: string,
        ocrId: string
    ): Promise<any> {
        // 1. Find or create party
        let party = await prisma.party.findFirst({
            where: {
                userId,
                OR: [
                    { gstNo: processedData.partyGST },
                    {
                        name: {
                            contains: processedData.partyName,
                            mode: "insensitive",
                        },
                    },
                ],
            },
        });

        // If party not found, create new one
        if (!party && processedData.partyName) {
            party = await prisma.party.create({
                data: {
                    name: processedData.partyName,
                    gstNo: processedData.partyGST,
                    userId,
                    category: "SUPPLIER",
                    isActive: true,
                },
            });

            logger.info("Auto-created new party from OCR", LogCategory.PARTY, {
                partyId: party.id,
                partyName: party.name,
                ocrId,
            });
        }

        if (!party) {
            throw new Error("Could not find or create party");
        }

        // 2. Process items and handle inventory
        const processedItems = await this.processInvoiceItems(
            processedData.items || [],
            userId,
            ocrId
        );

        // 3. Generate voucher ID

        // 4. Calculate due date (30 days default)
        const invoiceDate = processedData.date
            ? new Date(processedData.date)
            : new Date();
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);

        const voucherId = generateInvoiceVoucherId(party.name, invoiceDate);

        // 5. Create invoice with processed items
        const invoice = await prisma.invoice.create({
            data: {
                voucherId,
                invoiceNo: processedData.invoiceNo,
                date: invoiceDate,
                dueDate,
                amount: processedData.amount,
                remainingAmount: processedData.amount,
                partyId: party.id,
                userId,
                items: processedItems,
                status: "PENDING",
            },
            include: {
                party: {
                    select: {
                        id: true,
                        name: true,
                        gstNo: true,
                    },
                },
            },
        });

        // 6. Add stock for each item
        await this.addStockForInvoiceItems(processedItems, invoice.id, userId);

        // 7. Link OCR to invoice
        await prisma.oCRData.update({
            where: { id: ocrId },
            data: {
                invoiceId: invoice.id,
                status: "COMPLETED",
            },
        });

        return invoice;
    }

    // ========================================
    // PROCESS INVOICE ITEMS AND HANDLE INVENTORY
    // ========================================
    private async processInvoiceItems(
        items: any[],
        userId: string,
        ocrId: string
    ): Promise<any[]> {
        const processedItems: any[] = [];

        for (const item of items) {
            try {
                // Try to find existing inventory item by name, SKU, or barcode
                let inventoryItem = await this.findInventoryItem(
                    item.name || item.description,
                    item.sku,
                    userId
                );

                // If not found, create new inventory item
                if (!inventoryItem) {
                    inventoryItem = await this.createInventoryItem(
                        item,
                        userId,
                        ocrId
                    );
                }

                // Add to processed items with inventory reference
                processedItems.push({
                    name: item.name || item.description,
                    description: item.description,
                    quantity: item.quantity || 1,
                    unit: item.unit || "PCS",
                    unitPrice: item.unitPrice || item.rate || 0,
                    totalPrice: item.totalPrice || item.amount || 0,
                    hsnCode: item.hsnCode,
                    taxRate: item.taxRate || 0,
                    inventoryItemId: inventoryItem.id,
                    sku: inventoryItem.sku,
                });

                logger.info(
                    "Processed invoice item with inventory",
                    LogCategory.INVENTORY,
                    {
                        itemName: item.name,
                        inventoryItemId: inventoryItem.id,
                        existed: !!inventoryItem.id,
                        ocrId,
                    }
                );
            } catch (error: any) {
                logger.error(
                    "Failed to process invoice item",
                    undefined,
                    LogCategory.INVENTORY,
                    {
                        item,
                        error: error.message,
                        ocrId,
                    }
                );

                // Add item without inventory reference
                processedItems.push({
                    name: item.name || item.description || "Unknown Item",
                    description: item.description,
                    quantity: item.quantity || 1,
                    unit: item.unit || "PCS",
                    unitPrice: item.unitPrice || item.rate || 0,
                    totalPrice: item.totalPrice || item.amount || 0,
                    hsnCode: item.hsnCode,
                    taxRate: item.taxRate || 0,
                });
            }
        }

        return processedItems;
    }

    // ========================================
    // FIND EXISTING INVENTORY ITEM
    // ========================================
    private async findInventoryItem(
        name: string,
        sku: string | undefined,
        userId: string
    ): Promise<any | null> {
        if (!name && !sku) return null;

        // Try exact match first
        if (sku) {
            const item = await prisma.inventoryItem.findFirst({
                where: {
                    userId,
                    isActive: true,
                    OR: [{ sku }, { barcode: sku }],
                },
            });
            if (item) return item;
        }

        // Try name match
        if (name) {
            const item = await prisma.inventoryItem.findFirst({
                where: {
                    userId,
                    isActive: true,
                    name: {
                        contains: name,
                        mode: "insensitive",
                    },
                },
            });
            if (item) return item;
        }

        return null;
    }

    // ========================================
    // CREATE NEW INVENTORY ITEM
    // ========================================
    private async createInventoryItem(
        itemData: any,
        userId: string,
        ocrId: string
    ): Promise<any> {
        const itemName =
            itemData.name || itemData.description || "Unknown Item";

        // Generate SKU if not provided
        const sku = itemData.sku || this.generateSKU(itemName);

        const inventoryItem = await prisma.inventoryItem.create({
            data: {
                name: itemName,
                description: itemData.description,
                sku,
                barcode: itemData.barcode,
                category: itemData.category || "OTHER",
                unit: itemData.unit || "PCS",
                currentStock: 0, // Will be updated when stock is added
                minimumStock: 10, // Default minimum
                purchasePrice: itemData.unitPrice || itemData.rate || 0,
                sellingPrice:
                    itemData.sellingPrice || (itemData.unitPrice || 0) * 1.2, // 20% markup
                hsnCode: itemData.hsnCode,
                taxRate: itemData.taxRate || 0,
                userId,
                isActive: true,
            },
        });

        // Publish inventory item created event
        const inventoryCreatedPublisher = new InventoryItemCreatedPublisher(
            kafkaWrapper.producer
        );
        await inventoryCreatedPublisher.publish({
            id: inventoryItem.id,
            name: inventoryItem.name,
            sku: inventoryItem.sku,
            category: inventoryItem.category,
            unit: inventoryItem.unit,
            purchasePrice: Number(inventoryItem.purchasePrice),
            sellingPrice: Number(inventoryItem.sellingPrice),
            currentStock: Number(inventoryItem.currentStock),
            minimumStock: Number(inventoryItem.minimumStock),
            createdBy: userId,
            createdAt: inventoryItem.createdAt.toISOString(),
            userId,
            autoCreatedFromOCR: true,
            ocrJobId: ocrId,
        });

        logger.info(
            "Auto-created new inventory item from OCR",
            LogCategory.INVENTORY,
            {
                inventoryItemId: inventoryItem.id,
                itemName: inventoryItem.name,
                sku: inventoryItem.sku,
                ocrId,
            }
        );

        return inventoryItem;
    }

    // ========================================
    // ADD STOCK FOR INVOICE ITEMS
    // ========================================
    private async addStockForInvoiceItems(
        items: any[],
        invoiceId: string,
        userId: string
    ): Promise<void> {
        for (const item of items) {
            if (!item.inventoryItemId) continue;

            try {
                const inventoryItem = await prisma.inventoryItem.findUnique({
                    where: { id: item.inventoryItemId },
                });

                if (!inventoryItem) continue;

                const previousStock = Number(inventoryItem.currentStock);
                const newStock = previousStock + item.quantity;

                // Update inventory stock
                await prisma.$transaction(async (tx) => {
                    // Update stock
                    await tx.inventoryItem.update({
                        where: { id: item.inventoryItemId },
                        data: {
                            currentStock: { increment: item.quantity },
                            lastPurchaseDate: new Date(),
                            lastPurchasePrice: item.unitPrice,
                            updatedAt: new Date(),
                        },
                    });

                    // Create stock movement
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

                // Publish stock added event
                const stockAddedPublisher = new StockAddedPublisher(
                    kafkaWrapper.producer
                );
                await stockAddedPublisher.publish({
                    id: `stock-${Date.now()}`, // Stock movement ID
                    inventoryItemId: item.inventoryItemId,
                    inventoryItemName: item.name,
                    sku: item.sku,
                    quantity: item.quantity,
                    previousStock,
                    newStock,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    totalValue: item.unitPrice * item.quantity,
                    reason: "Purchase from supplier via OCR",
                    reference: invoiceId,
                    receivedDate: new Date().toISOString(),
                    condition: "NEW",
                    createdBy: userId,
                    createdAt: new Date().toISOString(),
                    userId,
                    stockStatus:
                        newStock > Number(inventoryItem.minimumStock)
                            ? "IN_STOCK"
                            : "LOW_STOCK",
                });

                logger.info(
                    "Stock added from OCR invoice",
                    LogCategory.INVENTORY,
                    {
                        inventoryItemId: item.inventoryItemId,
                        itemName: item.name,
                        quantity: item.quantity,
                        previousStock,
                        newStock,
                        invoiceId,
                    }
                );
            } catch (error: any) {
                logger.error(
                    "Failed to add stock for item",
                    undefined,
                    LogCategory.INVENTORY,
                    {
                        item,
                        error: error.message,
                        invoiceId,
                    }
                );
            }
        }
    }

    // ========================================
    // GENERATE SKU
    // ========================================
    private generateSKU(itemName: string): string {
        const prefix = itemName
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .substring(0, 3);
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}-${timestamp}`;
    }
}

// ========================================
// 2. MANUAL REVIEW REQUIRED (Confidence < 90%)
// ========================================
export class OCRManualReviewConsumer extends KafkaConsumer<OCRManualReviewRequiredEvent> {
    topic = TopicNames.OCR_PROCESSING_EVENTS;
    subject = Subjects.OCRManualReviewRequired as const;
    queueGroupName = "accounts-ocr-manual-review-group";

    async onMessage(data: OCRManualReviewRequiredEvent["data"]): Promise<void> {
        logger.info("OCR manual review required", LogCategory.OCR, {
            jobId: data.jobId,
            reason: data.reason,
            priority: data.reviewPriority,
        });

        try {
            // Fetch OCR data
            const ocrData = await prisma.oCRData.findUnique({
                where: { id: data.jobId },
            });

            if (!ocrData) {
                logger.error("OCR data not found", undefined, LogCategory.OCR, {
                    jobId: data.jobId,
                });
                return;
            }

            // ========================================
            // GENERATE REVIEW LINK
            // ========================================
            const reviewLink = `${process.env.FRONTEND_URL}/ocr/review/${data.jobId}`;

            // Update OCR with review link
            await prisma.oCRData.update({
                where: { id: data.jobId },
                data: {
                    status: "MANUAL_REVIEW",
                    extractedData: {
                        ...(ocrData.extractedData as any),
                        reviewLink,
                        reviewReason: data.reason,
                        reviewPriority: data.reviewPriority,
                        lowConfidenceFields: data.lowConfidenceFields,
                        invalidFields: data.invalidFields,
                    },
                },
            });

            // ========================================
            // SEND NOTIFICATION TO USER
            // ========================================
            await prisma.notification.create({
                data: {
                    title: "⚠️ Document Review Required",
                    message: `Your document needs manual review due to: ${data.reason}`,
                    type: "CUSTOM",
                    channel: "IN_APP",
                    recipientType: "USER",
                    recipientId: ocrData.userId,
                    recipientName: "User",
                    userId: ocrData.userId,
                    status: "SENT",
                    sentAt: new Date(),
                    templateData: {
                        reviewLink,
                        priority: data.reviewPriority,
                        reason: data.reason,
                        lowConfidenceFields: data.lowConfidenceFields,
                        invalidFields: data.invalidFields,
                        ocrId: data.jobId,
                    },
                },
            });

            logger.info("Manual review notification created", LogCategory.OCR, {
                jobId: data.jobId,
                userId: ocrData.userId,
                reviewLink,
            });
        } catch (error: any) {
            logger.error(
                "Failed to handle manual review",
                undefined,
                LogCategory.OCR,
                {
                    jobId: data.jobId,
                    error: error.message,
                }
            );
        }
    }
}

// ========================================
// EXPORT FOR USE IN ACCOUNTS SERVICE
// ========================================
export const ocrConsumers = {
    OCRJobCompletedConsumer,
    OCRManualReviewConsumer,
};
```
