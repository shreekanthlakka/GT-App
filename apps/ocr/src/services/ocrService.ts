// apps/ocr/src/services/ocrService.ts
// COMPLETE VERSION with Inventory Item Extraction for Invoices

import { prisma } from "@repo/db/prisma";
import { logger, LogCategory } from "@repo/common-backend/logger";
import { OCRStatus, Prisma } from "@prisma/client";
import {
    OCRJobCompletedPublisher,
    OCRJobFailedPublisher,
    OCRDataExtractedPublisher,
    OCRManualReviewRequiredPublisher,
} from "../events/publishers/ocrPublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import Tesseract from "tesseract.js";
import vision from "@google-cloud/vision";
import {
    CustomError,
    generateInvoiceVoucherId,
    generateInvoicePaymentVoucherId,
    generateSaleReceiptVoucherId,
} from "@repo/common-backend/utils";
import Fuse from "fuse.js";
import { FileUploadService } from "./fileUploadService";
import sharp from "sharp";

// Initialize Google Cloud Vision client
const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_CLOUD_KEY_PATH,
});

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * Represents a single inventory item extracted from the invoice
 */
interface ExtractedInvoiceItem {
    itemName: string; // Name of the item
    description?: string; // Optional description
    quantity: number; // Quantity purchased
    price: number; // Unit price
    totalAmount: number; // Total for this line item
    confidence: number; // Confidence score for this item (0-1)
    matchedInventoryId?: string; // ID of matched inventory item
    needsReview: boolean; // Whether this item needs manual review
    validationErrors: string[]; // Any validation errors
}

/**
 * Result of fuzzy matching an item against inventory
 */
interface ItemFuzzyMatchResult {
    matched: boolean;
    matchedItem: any; // Matched inventory item from DB
    confidence: number; // Match confidence (0-1)
    matchType: "exact" | "fuzzy" | "none";
    suggestions: Array<{
        // Alternative suggestions
        item: any;
        score: number;
    }>;
}

/**
 * Represents parsed invoice data with items
 */
interface ProcessedInvoiceData {
    invoiceNo: string;
    partyName: string;
    partyGST?: string;
    date: string;
    amount: number;
    items: ExtractedInvoiceItem[]; // Array of line items
    subtotal?: number; // Subtotal before tax
    taxAmount?: number; // Total tax amount
    discount?: number; // Total discount
}

interface DuplicateCheckResult {
    isDuplicate: boolean;
    duplicateOCRId?: string;
    duplicateDate?: Date;
    similarity?: number;
}

interface FieldConfidence {
    field: string;
    value: any;
    confidence: number;
    needsReview: boolean;
    validationPassed: boolean;
    validationErrors?: string[];
}

interface ParsedDataWithConfidence {
    fields: FieldConfidence[];
    overallConfidence: number;
    highConfidenceFields: string[];
    lowConfidenceFields: string[];
    invalidFields: string[];
}

interface FuzzyMatchResult {
    matched: boolean;
    matchedEntity: any;
    confidence: number;
    matchType: "exact" | "fuzzy" | "none";
    suggestions: Array<{ entity: any; score: number }>;
}

interface ImageQualityResult {
    isGoodQuality: boolean;
    score: number;
    issues: string[];
    warnings: string[];
    recommendations: string[];
}

interface ProcessedPaymentData {
    partyName: string;
    amount: number;
    date: string;
    method?: string;
    reference?: string;
}

interface ProcessedReceiptData {
    customerName: string;
    receiptNo?: string;
    amount: number;
    date: string;
    method?: string;
}

type OCRDataResult = Prisma.OCRDataGetPayload<{
    select: {
        id: true;
        imageUrl: true;
        originalName: true;
        fileSize: true;
        extractedData: true;
        processedData: true;
        confidence: true;
        status: true;
        errorMessage: true;
        invoiceId: true;
        invoicePaymentId: true;
        saleReceiptId: true;
        userId: true;
        createdAt: true;
        updatedAt: true;
    };
}>;

export class OCRService {
    // ========================================
    // MAIN PROCESSING WITH INVENTORY ITEMS
    // ========================================
    /**
     * Main method to process OCR document
     * Steps:
     * 1. Check image quality
     * 2. Extract text using OCR engine
     * 3. Parse text with confidence scores
     * 4. For invoices: Extract line items with details
     * 5. Fuzzy match entities (parties, customers, inventory items)
     * 6. Validate all extracted data
     * 7. Check for duplicates
     * 8. Reorganize file structure
     * 9. Publish appropriate events
     */
    static async processDocument(
        ocrId: string,
        imageUrl: string,
        documentType: string,
        userId: string
    ): Promise<OCRDataResult | void> {
        try {
            logger.info("Starting OCR processing", LogCategory.OCR, {
                ocrId,
                imageUrl,
                documentType,
            });

            // STEP 1: Image Quality Pre-check (Feature 4)
            const qualityCheck = await this.checkImageQuality(imageUrl);
            if (!qualityCheck.isGoodQuality) {
                await prisma.oCRData.update({
                    where: { id: ocrId },
                    data: {
                        status: OCRStatus.MANUAL_REVIEW,
                        extractedData: {
                            qualityCheck,
                            message:
                                "Low image quality detected. Manual review required.",
                        },
                    },
                });

                const manualReviewPublisher =
                    new OCRManualReviewRequiredPublisher(kafkaWrapper.producer);
                await manualReviewPublisher.publish({
                    jobId: ocrId,
                    reason: "Low image quality",
                    reviewPriority: "HIGH",
                    lowConfidenceFields: [],
                    invalidFields: [],
                    qualityIssues: qualityCheck.issues,
                    requiresReview: true,
                    userId,
                });

                return;
            }

            // STEP 2: Extract text using OCR engine (Tesseract or Google Vision)
            const extractedText = await this.extractTextFromImage(imageUrl);

            // STEP 3: Parse text with field-level confidence (Feature 2)
            const parsedData = await this.parseTextWithConfidence(
                extractedText,
                documentType
            );

            // STEP 4: For invoices, extract inventory line items
            let extractedItems: ExtractedInvoiceItem[] = [];
            if (documentType === "invoice") {
                logger.info(
                    "Extracting inventory items from invoice",
                    LogCategory.OCR,
                    {
                        ocrId,
                    }
                );
                extractedItems = await this.extractInvoiceItems(
                    extractedText,
                    parsedData,
                    userId
                );

                // Add items to parsed data
                parsedData.fields.push({
                    field: "items",
                    value: extractedItems,
                    confidence: this.calculateItemsConfidence(extractedItems),
                    needsReview: extractedItems.some(
                        (item) => item.needsReview
                    ),
                    validationPassed: extractedItems.every(
                        (item) => item.validationErrors.length === 0
                    ),
                    validationErrors: extractedItems.flatMap(
                        (item) => item.validationErrors
                    ),
                });
            }

            // STEP 5: Fuzzy matching for entities (Feature 3)
            const enhancedData = await this.enhanceWithFuzzyMatching(
                parsedData,
                documentType,
                userId
            );

            // STEP 6: Validate extracted data (Feature 5)
            const validatedData = await this.validateExtractedData(
                enhancedData,
                documentType
            );

            // STEP 7: Check for duplicates (Feature 1)
            const duplicateCheck = await this.checkForDuplicates(
                validatedData,
                documentType,
                userId,
                ocrId
            );

            // STEP 8: File reorganization after successful parsing
            let finalImageUrl = imageUrl;
            const fields = validatedData.fields.reduce(
                (acc, field) => {
                    acc[field.field] = field.value;
                    return acc;
                },
                {} as Record<string, any>
            );

            if (fields.partyName || fields.customerName) {
                try {
                    finalImageUrl =
                        await FileUploadService.moveToOrganizedStructure(
                            imageUrl,
                            documentType,
                            {
                                partyName: fields.partyName,
                                customerName: fields.customerName,
                                invoiceNo: fields.invoiceNo,
                                receiptNo: fields.receiptNo,
                                date: fields.date
                                    ? new Date(fields.date)
                                    : new Date(),
                            }
                        );
                } catch (error: any) {
                    logger.warn("File reorganization failed", LogCategory.OCR, {
                        ocrId,
                        error: error.message,
                    });
                }
            }

            // STEP 9: Update OCR record with all results
            const updatedOCR = await prisma.oCRData.update({
                where: { id: ocrId },
                data: {
                    imageUrl: finalImageUrl,
                    extractedData: {
                        rawText: extractedText,
                        fields: validatedData.fields,
                        qualityCheck,
                        items: extractedItems, // Store extracted items
                    },
                    processedData: fields,
                    confidence: validatedData.overallConfidence,
                    status:
                        validatedData.overallConfidence < 0.7 ||
                        validatedData.invalidFields.length > 0 ||
                        duplicateCheck.isDuplicate
                            ? OCRStatus.MANUAL_REVIEW
                            : OCRStatus.COMPLETED,
                    updatedAt: new Date(),
                },
                select: {
                    id: true,
                    imageUrl: true,
                    originalName: true,
                    fileSize: true,
                    extractedData: true,
                    processedData: true,
                    confidence: true,
                    status: true,
                    errorMessage: true,
                    invoiceId: true,
                    invoicePaymentId: true,
                    saleReceiptId: true,
                    userId: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            // STEP 10: Publish events based on status
            const needsReview =
                validatedData.overallConfidence < 0.7 ||
                validatedData.invalidFields.length > 0 ||
                duplicateCheck.isDuplicate ||
                (extractedItems.length > 0 &&
                    extractedItems.some((item) => item.needsReview));

            if (needsReview) {
                const manualReviewPublisher =
                    new OCRManualReviewRequiredPublisher(kafkaWrapper.producer);
                await manualReviewPublisher.publish({
                    jobId: ocrId,
                    reason: duplicateCheck.isDuplicate
                        ? "Duplicate detected"
                        : validatedData.overallConfidence < 0.7
                          ? "Low confidence"
                          : "Validation errors",
                    reviewPriority:
                        validatedData.invalidFields.length > 2
                            ? "HIGH"
                            : "MEDIUM",
                    lowConfidenceFields: validatedData.lowConfidenceFields,
                    invalidFields: validatedData.invalidFields,
                    requiresReview: true,
                    userId,
                });
            } else {
                const jobCompletedPublisher = new OCRJobCompletedPublisher(
                    kafkaWrapper.producer
                );
                await jobCompletedPublisher.publish({
                    jobId: ocrId,
                    completedAt: new Date().toISOString(),
                    confidence: validatedData.overallConfidence,
                    status: "COMPLETED",
                    extractedText: extractedText,
                    processingTime: 0,
                    userId,
                });
            }

            logger.info("OCR processing completed", LogCategory.OCR, {
                ocrId,
                overallConfidence: validatedData.overallConfidence,
                needsReview,
                itemsExtracted: extractedItems.length,
                lowConfidenceFields: validatedData.lowConfidenceFields,
                invalidFields: validatedData.invalidFields,
                finalImageUrl,
            });

            return updatedOCR;
        } catch (error: any) {
            logger.error("OCR processing failed", undefined, LogCategory.OCR, {
                ocrId,
                error: error.message,
            });

            await prisma.oCRData.update({
                where: { id: ocrId },
                data: {
                    status: OCRStatus.FAILED,
                    errorMessage: error.message,
                    updatedAt: new Date(),
                },
            });

            const jobFailedPublisher = new OCRJobFailedPublisher(
                kafkaWrapper.producer
            );
            await jobFailedPublisher.publish({
                jobId: ocrId,
                failedAt: new Date().toISOString(),
                error: error.message,
                retryable: true,
                userId,
            });

            throw error;
        }
    }

    // ========================================
    // INVOICE ITEM EXTRACTION (NEW)
    // ========================================
    /**
     * Extract line items from invoice text
     * This method identifies and parses individual items with their details
     *
     * Typical invoice format:
     * Item Name          Qty    Price    Total
     * Cotton Saree       5      1500     7500
     * Silk Fabric        10     2000     20000
     *
     * Steps:
     * 1. Identify the items section (after headers, before totals)
     * 2. Parse each line to extract item details
     * 3. Validate quantities and prices
     * 4. Fuzzy match items with existing inventory
     * 5. Calculate confidence scores
     */
    private static async extractInvoiceItems(
        extractedText: string,
        parsedData: ParsedDataWithConfidence,
        userId: string
    ): Promise<ExtractedInvoiceItem[]> {
        try {
            const items: ExtractedInvoiceItem[] = [];
            const lines = extractedText.split("\n").map((line) => line.trim());

            // STEP 1: Find the items section
            // Look for common table headers like "Item", "Qty", "Price", "Amount"
            let itemsSectionStart = -1;
            let itemsSectionEnd = lines.length;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].toLowerCase();
                // Detect header row
                if (
                    (line.includes("item") || line.includes("description")) &&
                    (line.includes("qty") || line.includes("quantity")) &&
                    (line.includes("price") ||
                        line.includes("rate") ||
                        line.includes("amount"))
                ) {
                    itemsSectionStart = i + 1; // Items start after header
                }

                // Detect end of items (usually where totals start)
                if (
                    line.includes("subtotal") ||
                    line.includes("total") ||
                    line.includes("grand total") ||
                    line.includes("tax") ||
                    line.includes("discount")
                ) {
                    itemsSectionEnd = i;
                    break;
                }
            }

            if (itemsSectionStart === -1) {
                logger.warn("No items section header found", LogCategory.OCR);
                // Try to extract items without header detection
                itemsSectionStart = 0;
            }

            logger.info("Items section identified", LogCategory.OCR, {
                startLine: itemsSectionStart,
                endLine: itemsSectionEnd,
            });

            // STEP 2: Parse each line in the items section
            for (let i = itemsSectionStart; i < itemsSectionEnd; i++) {
                const line = lines[i];

                // Skip empty lines or very short lines
                if (!line || line.length < 5) continue;

                // Skip lines that look like headers or footers
                if (
                    line.toLowerCase().includes("item") ||
                    line.toLowerCase().includes("description") ||
                    line.toLowerCase().includes("continued")
                ) {
                    continue;
                }

                // STEP 3: Extract item details from the line
                const item = await this.parseItemLine(line, userId);

                if (item) {
                    items.push(item);
                }
            }

            // STEP 4: Validate total items against invoice total
            const totalFromItems = items.reduce(
                (sum, item) => sum + item.totalAmount,
                0
            );
            const invoiceTotalField = parsedData.fields.find(
                (f) => f.field === "amount"
            );
            const invoiceTotal = invoiceTotalField?.value || 0;

            // Check if totals match (within 5% tolerance for rounding/tax)
            const tolerance = invoiceTotal * 0.05;
            const totalsMatch =
                Math.abs(totalFromItems - invoiceTotal) <= tolerance;

            if (!totalsMatch && items.length > 0) {
                logger.warn(
                    "Item totals don't match invoice total",
                    LogCategory.OCR,
                    {
                        totalFromItems,
                        invoiceTotal,
                        difference: Math.abs(totalFromItems - invoiceTotal),
                    }
                );

                // Mark all items as needing review
                items.forEach((item) => {
                    item.needsReview = true;
                    item.validationErrors.push(
                        "Item totals don't match invoice total"
                    );
                });
            }

            logger.info("Items extraction completed", LogCategory.OCR, {
                itemsFound: items.length,
                totalFromItems,
                invoiceTotal,
                totalsMatch,
            });

            return items;
        } catch (error: any) {
            logger.error("Item extraction failed", undefined, LogCategory.OCR, {
                error: error.message,
            });
            return [];
        }
    }

    /**
     * Parse a single line to extract item details
     *
     * Common patterns:
     * - "Cotton Saree 5 1500 7500"
     * - "Silk Fabric | 10 | 2000 | 20000"
     * - "Item: Cotton, Qty: 5, Price: 1500, Total: 7500"
     *
     * Steps:
     * 1. Try to identify numbers (qty, price, total)
     * 2. Extract item name (text before numbers)
     * 3. Validate: total = qty * price
     * 4. Fuzzy match item name with inventory
     * 5. Calculate confidence score
     */
    private static async parseItemLine(
        line: string,
        userId: string
    ): Promise<ExtractedInvoiceItem | null> {
        try {
            // STEP 1: Extract all numbers from the line
            const numberPattern = /\d+\.?\d*/g;
            const numbers =
                line.match(numberPattern)?.map((n) => parseFloat(n)) || [];

            // We need at least 2 numbers (qty and price) or 3 (qty, price, total)
            if (numbers.length < 2) {
                return null;
            }

            // STEP 2: Determine which numbers are qty, price, and total
            let quantity: number;
            let price: number;
            let totalAmount: number;

            if (numbers.length === 2) {
                // Only qty and price, calculate total
                [quantity, price] = numbers;
                totalAmount = quantity * price;
            } else if (numbers.length >= 3) {
                // Most common: qty, price, total
                // Take last 3 numbers
                const relevantNumbers = numbers.slice(-3);
                [quantity, price, totalAmount] = relevantNumbers;

                // Validate: total should equal qty * price (with small tolerance)
                const calculatedTotal = quantity * price;
                const tolerance = calculatedTotal * 0.01; // 1% tolerance

                if (Math.abs(calculatedTotal - totalAmount) > tolerance) {
                    // Try different interpretation: maybe first is item code, then qty, price, total
                    if (numbers.length >= 4) {
                        [, quantity, price, totalAmount] = numbers.slice(-4);
                    }
                }
            } else {
                return null;
            }

            // STEP 3: Extract item name (text before the numbers)
            // Remove all numbers and special characters to get item name
            let itemName = line
                .replace(numberPattern, "")
                .replace(/[|,\t]/g, " ")
                .trim();

            // Clean up item name
            itemName = itemName
                .replace(/\s+/g, " ")
                .replace(/^[-•*]\s*/, "") // Remove bullet points
                .trim();

            if (!itemName || itemName.length < 2) {
                return null;
            }

            // STEP 4: Basic validation
            const validationErrors: string[] = [];

            if (quantity <= 0) {
                validationErrors.push("Invalid quantity");
            }
            if (price <= 0) {
                validationErrors.push("Invalid price");
            }
            if (totalAmount <= 0) {
                validationErrors.push("Invalid total amount");
            }

            // Verify calculation
            const calculatedTotal = quantity * price;
            const tolerance = Math.max(calculatedTotal * 0.02, 1); // 2% or minimum 1
            if (Math.abs(calculatedTotal - totalAmount) > tolerance) {
                validationErrors.push(
                    `Total mismatch: ${quantity} × ${price} = ${calculatedTotal}, but found ${totalAmount}`
                );
            }

            // STEP 5: Fuzzy match with existing inventory
            const matchResult = await this.fuzzyMatchInventoryItem(
                itemName,
                userId
            );

            // STEP 6: Calculate confidence score
            let confidence = 0.5; // Base confidence

            // Increase confidence based on factors
            if (matchResult.matched && matchResult.matchType === "exact") {
                confidence += 0.3;
            } else if (
                matchResult.matched &&
                matchResult.matchType === "fuzzy"
            ) {
                confidence += matchResult.confidence * 0.3;
            }

            if (validationErrors.length === 0) {
                confidence += 0.2;
            }

            // Check if numbers make sense (not too large or small)
            if (
                quantity > 0 &&
                quantity < 10000 &&
                price > 0 &&
                price < 1000000
            ) {
                confidence += 0.1;
            }

            const needsReview =
                confidence < 0.7 ||
                validationErrors.length > 0 ||
                !matchResult.matched;

            const item: ExtractedInvoiceItem = {
                itemName: matchResult.matched
                    ? matchResult.matchedItem.name
                    : itemName,
                description: matchResult.matched
                    ? matchResult.matchedItem.description
                    : undefined,
                quantity,
                price,
                totalAmount,
                confidence: Math.min(confidence, 1),
                matchedInventoryId: matchResult.matched
                    ? matchResult.matchedItem.id
                    : undefined,
                needsReview,
                validationErrors,
            };

            logger.info("Item parsed successfully", LogCategory.OCR, {
                itemName: item.itemName,
                quantity,
                price,
                totalAmount,
                matched: matchResult.matched,
                confidence: item.confidence,
            });

            return item;
        } catch (error: any) {
            logger.error(
                "Failed to parse item line",
                undefined,
                LogCategory.OCR,
                {
                    line,
                    error: error.message,
                }
            );
            return null;
        }
    }

    /**
     * Fuzzy match an item name against inventory database
     * Uses Fuse.js for fuzzy string matching
     *
     * Returns:
     * - matched: true if a good match was found
     * - matchedItem: The inventory item from database
     * - confidence: How confident the match is (0-1)
     * - suggestions: Alternative matches if no exact match
     */
    private static async fuzzyMatchInventoryItem(
        itemName: string,
        userId: string
    ): Promise<ItemFuzzyMatchResult> {
        try {
            // Fetch all inventory items for this user
            const inventoryItems = await prisma.inventoryItem.findMany({
                where: { userId },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    category: true,
                    sku: true,
                },
            });

            if (inventoryItems.length === 0) {
                return {
                    matched: false,
                    matchedItem: null,
                    confidence: 0,
                    matchType: "none",
                    suggestions: [],
                };
            }

            // Configure Fuse.js for fuzzy matching
            const fuse = new Fuse(inventoryItems, {
                keys: ["name", "description", "sku"],
                threshold: 0.4, // 0 = exact match, 1 = match anything
                includeScore: true,
                minMatchCharLength: 3,
            });

            const results = fuse.search(itemName);

            if (results.length === 0) {
                return {
                    matched: false,
                    matchedItem: null,
                    confidence: 0,
                    matchType: "none",
                    suggestions: [],
                };
            }

            const bestMatch = results[0];
            const confidence = 1 - (bestMatch.score || 0); // Convert score to confidence

            // Determine match type
            let matchType: "exact" | "fuzzy" | "none" = "none";
            if (confidence >= 0.9) {
                matchType = "exact";
            } else if (confidence >= 0.6) {
                matchType = "fuzzy";
            }

            const matched = confidence >= 0.6; // Consider it a match if confidence >= 60%

            return {
                matched,
                matchedItem: bestMatch.item,
                confidence,
                matchType,
                suggestions: results.slice(1, 4).map((r) => ({
                    item: r.item,
                    score: 1 - (r.score || 0),
                })),
            };
        } catch (error: any) {
            logger.error(
                "Inventory fuzzy matching failed",
                undefined,
                LogCategory.OCR,
                {
                    itemName,
                    error: error.message,
                }
            );
            return {
                matched: false,
                matchedItem: null,
                confidence: 0,
                matchType: "none",
                suggestions: [],
            };
        }
    }

    /**
     * Calculate overall confidence score for all items
     */
    private static calculateItemsConfidence(
        items: ExtractedInvoiceItem[]
    ): number {
        if (items.length === 0) return 1; // No items means no issues

        const totalConfidence = items.reduce(
            (sum, item) => sum + item.confidence,
            0
        );
        return totalConfidence / items.length;
    }

    // ========================================
    // CREATE INVOICE WITH ITEMS
    // ========================================
    /**
     * Create invoice from OCR data with inventory items
     *
     * Steps:
     * 1. Find the party (supplier)
     * 2. Generate proper voucher ID
     * 3. Prepare items data for database
     * 4. Create invoice with items in a transaction
     * 5. Update inventory stock levels
     * 6. Link OCR data to invoice
     */
    static async createInvoiceFromOCR(
        processedData: ProcessedInvoiceData,
        userId: string,
        ocrId: string
    ): Promise<any> {
        try {
            // STEP 1: Find party
            const party = await prisma.party.findFirst({
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

            if (!party) {
                throw new CustomError(
                    400,
                    "Party not found. Please create party first."
                );
            }

            // STEP 2: Generate proper voucher ID
            const voucherId = generateInvoiceVoucherId(
                party.name,
                new Date(processedData.date)
            );

            // STEP 3: Prepare items data
            // Convert ExtractedInvoiceItem to invoice item format
            const invoiceItems = processedData.items.map((item) => ({
                itemName: item.itemName,
                description: item.description || "",
                quantity: item.quantity,
                price: item.price,
                totalAmount: item.totalAmount,
                inventoryId: item.matchedInventoryId, // Link to inventory if matched
            }));

            logger.info("Creating invoice with items", LogCategory.OCR, {
                ocrId,
                partyName: party.name,
                voucherId,
                itemCount: invoiceItems.length,
                totalAmount: processedData.amount,
            });

            // STEP 4: Create invoice with items in a transaction
            const invoice = await prisma.$transaction(async (tx) => {
                // Create the invoice
                const newInvoice = await tx.invoice.create({
                    data: {
                        voucherId,
                        invoiceNo: processedData.invoiceNo,
                        date: new Date(processedData.date),
                        amount: processedData.amount,
                        remainingAmount: processedData.amount,
                        partyId: party.id,
                        userId,
                        items: invoiceItems, // Store as JSON
                        status: "PENDING",
                    },
                });

                // STEP 5: Update inventory stock levels for matched items
                for (const item of processedData.items) {
                    if (item.matchedInventoryId) {
                        // Increase stock (purchase increases inventory)
                        await tx.inventoryItem.update({
                            where: { id: item.matchedInventoryId },
                            data: {
                                currentStock: {
                                    increment: item.quantity,
                                },
                                lastPurchaseDate: new Date(),
                                lastPurchasePrice: item.price,
                                updatedAt: new Date(),
                            },
                        });

                        // Create stock movement record
                        const previousStock = await tx.inventoryItem.findUnique(
                            {
                                where: { id: item.matchedInventoryId },
                                select: { currentStock: true },
                            }
                        );

                        await tx.stockMovement.create({
                            data: {
                                inventoryItemId: item.matchedInventoryId,
                                type: "IN",
                                quantity: item.quantity,
                                previousStock: previousStock?.currentStock || 0,
                                newStock:
                                    (previousStock?.currentStock || 0) +
                                    item.quantity,
                                reason: "Purchase Invoice",
                                reference: newInvoice.invoiceNo,
                                unitPrice: item.price,
                                totalValue: item.totalAmount,
                                userId,
                            },
                        });

                        logger.info(
                            "Inventory updated",
                            LogCategory.INVENTORY,
                            {
                                inventoryId: item.matchedInventoryId,
                                quantityAdded: item.quantity,
                                itemName: item.itemName,
                            }
                        );
                    }
                }

                // STEP 6: Link OCR data to invoice
                await tx.oCRData.update({
                    where: { id: ocrId },
                    data: { invoiceId: newInvoice.id },
                });

                return newInvoice;
            });

            logger.info(
                "Invoice created from OCR with items",
                LogCategory.OCR,
                {
                    ocrId,
                    invoiceId: invoice.id,
                    voucherId,
                    partyName: party.name,
                    itemCount: invoiceItems.length,
                    totalAmount: invoice.amount,
                }
            );

            return invoice;
        } catch (error: any) {
            logger.error(
                "Failed to create invoice from OCR",
                undefined,
                LogCategory.OCR,
                {
                    ocrId,
                    error: error.message,
                }
            );
            throw error;
        }
    }

    // ========================================
    // OTHER RECORD CREATION METHODS
    // ========================================

    static async createInvoicePaymentFromOCR(
        processedData: ProcessedPaymentData,
        userId: string,
        ocrId: string
    ): Promise<any> {
        const party = await prisma.party.findFirst({
            where: {
                userId,
                name: {
                    contains: processedData.partyName,
                    mode: "insensitive",
                },
            },
        });

        if (!party) {
            throw new CustomError(
                400,
                "Party not found. Please create party first."
            );
        }

        const voucherId = generateInvoicePaymentVoucherId(
            party.name,
            new Date(processedData.date)
        );

        const payment = await prisma.invoicePayment.create({
            data: {
                voucherId,
                amount: processedData.amount,
                date: new Date(processedData.date),
                method: processedData.method || "OTHER",
                reference: processedData.reference,
                partyId: party.id,
                userId,
                status: "COMPLETED",
            },
        });

        await prisma.oCRData.update({
            where: { id: ocrId },
            data: { invoicePaymentId: payment.id },
        });

        logger.info("Invoice payment created from OCR", LogCategory.OCR, {
            ocrId,
            paymentId: payment.id,
            voucherId,
            partyName: party.name,
        });

        return payment;
    }

    static async createSaleReceiptFromOCR(
        processedData: ProcessedReceiptData,
        userId: string,
        ocrId: string
    ): Promise<any> {
        const customer = await prisma.customer.findFirst({
            where: {
                userId,
                name: {
                    contains: processedData.customerName,
                    mode: "insensitive",
                },
            },
        });

        if (!customer) {
            throw new CustomError(
                400,
                "Customer not found. Please create customer first."
            );
        }

        const voucherId = generateSaleReceiptVoucherId(
            customer.name,
            new Date(processedData.date)
        );

        const receipt = await prisma.saleReceipt.create({
            data: {
                voucherId,
                receiptNo: processedData.receiptNo || voucherId,
                date: new Date(processedData.date),
                amount: processedData.amount,
                method: processedData.method || "CASH",
                customerId: customer.id,
                userId,
            },
        });

        await prisma.oCRData.update({
            where: { id: ocrId },
            data: { saleReceiptId: receipt.id },
        });

        logger.info("Sale receipt created from OCR", LogCategory.OCR, {
            ocrId,
            receiptId: receipt.id,
            voucherId,
            customerName: customer.name,
        });

        return receipt;
    }

    // ========================================
    // HELPER METHODS (Implementation placeholder)
    // You need to implement these based on your existing code
    // ========================================

    private static async checkImageQuality(
        imageUrl: string
    ): Promise<ImageQualityResult> {
        // Your existing implementation
        return {
            isGoodQuality: true,
            score: 85,
            issues: [],
            warnings: [],
            recommendations: [],
        };
    }

    private static async extractTextFromImage(
        imageUrl: string
    ): Promise<string> {
        // Your existing implementation using Tesseract or Google Vision
        return "";
    }

    private static async parseTextWithConfidence(
        text: string,
        documentType: string
    ): Promise<ParsedDataWithConfidence> {
        // Your existing implementation
        return {
            fields: [],
            overallConfidence: 0.8,
            highConfidenceFields: [],
            lowConfidenceFields: [],
            invalidFields: [],
        };
    }

    private static async enhanceWithFuzzyMatching(
        parsedData: ParsedDataWithConfidence,
        documentType: string,
        userId: string
    ): Promise<ParsedDataWithConfidence> {
        // Your existing implementation
        return parsedData;
    }

    private static async validateExtractedData(
        parsedData: ParsedDataWithConfidence,
        documentType: string
    ): Promise<ParsedDataWithConfidence> {
        // Your existing implementation
        return parsedData;
    }

    private static async checkForDuplicates(
        validatedData: ParsedDataWithConfidence,
        documentType: string,
        userId: string,
        ocrId: string
    ): Promise<DuplicateCheckResult> {
        // Your existing implementation
        return {
            isDuplicate: false,
        };
    }
}
