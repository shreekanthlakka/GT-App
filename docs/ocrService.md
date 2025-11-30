```typescript

// // apps/ocr/src/services/ocrService.ts
// // COMPLETE VERSION with Inventory Item Extraction for Invoices

// import { prisma } from "@repo/db/prisma";
// import { logger, LogCategory } from "@repo/common-backend/logger";
// import { OCRStatus, Prisma } from "@prisma/client";
// import {
// OCRJobCompletedPublisher,
// OCRJobFailedPublisher,
// OCRDataExtractedPublisher,
// OCRManualReviewRequiredPublisher,
// } from "../events/publishers/ocrPublishers";
// import { kafkaWrapper } from "@repo/common-backend/kafka";
// import Tesseract from "tesseract.js";
// import vision from "@google-cloud/vision";
// import {
// CustomError,
// generateInvoiceVoucherId,
// generateInvoicePaymentVoucherId,
// generateSaleReceiptVoucherId,
// } from "@repo/common-backend/utils";
// import Fuse from "fuse.js";
// import { FileUploadService } from "./fileUploadService";
// import sharp from "sharp";

// // Initialize Google Cloud Vision client
// const visionClient = new vision.ImageAnnotatorClient({
// keyFilename: process.env.GOOGLE_CLOUD_KEY_PATH,
// });

// // ========================================
// // TYPE DEFINITIONS
// // ========================================

// /\*_
// _ Represents a single inventory item extracted from the invoice
// \*/
// interface ExtractedInvoiceItem {
// itemName: string; // Name of the item
// description?: string; // Optional description
// quantity: number; // Quantity purchased
// price: number; // Unit price
// totalAmount: number; // Total for this line item
// confidence: number; // Confidence score for this item (0-1)
// matchedInventoryId?: string; // ID of matched inventory item
// needsReview: boolean; // Whether this item needs manual review
// validationErrors: string[]; // Any validation errors
// }

// /\*_
// _ Result of fuzzy matching an item against inventory
// \*/
// interface ItemFuzzyMatchResult {
// matched: boolean;
// matchedItem: any; // Matched inventory item from DB
// confidence: number; // Match confidence (0-1)
// matchType: "exact" | "fuzzy" | "none";
// suggestions: Array<{
// // Alternative suggestions
// item: any;
// score: number;
// }>;
// }

// /\*_
// _ Represents parsed invoice data with items
// \*/
// interface ProcessedInvoiceData {
// invoiceNo: string;
// partyName: string;
// partyGST?: string;
// date: string;
// amount: number;
// items: ExtractedInvoiceItem[]; // Array of line items
// subtotal?: number; // Subtotal before tax
// taxAmount?: number; // Total tax amount
// discount?: number; // Total discount
// }

// interface DuplicateCheckResult {
// isDuplicate: boolean;
// duplicateOCRId?: string;
// duplicateDate?: Date;
// similarity?: number;
// }

// interface FieldConfidence {
// field: string;
// value: any;
// confidence: number;
// needsReview: boolean;
// validationPassed: boolean;
// validationErrors?: string[];
// }

// interface ParsedDataWithConfidence {
// fields: FieldConfidence[];
// overallConfidence: number;
// highConfidenceFields: string[];
// lowConfidenceFields: string[];
// invalidFields: string[];
// }

// interface FuzzyMatchResult {
// matched: boolean;
// matchedEntity: any;
// confidence: number;
// matchType: "exact" | "fuzzy" | "none";
// suggestions: Array<{ entity: any; score: number }>;
// }

// interface ImageQualityResult {
// isGoodQuality: boolean;
// score: number;
// issues: string[];
// warnings: string[];
// recommendations: string[];
// }

// interface ProcessedPaymentData {
// partyName: string;
// amount: number;
// date: string;
// method?: string;
// reference?: string;
// }

// interface ProcessedReceiptData {
// customerName: string;
// receiptNo?: string;
// amount: number;
// date: string;
// method?: string;
// }

// type OCRDataResult = Prisma.OCRDataGetPayload<{
// select: {
// id: true;
// imageUrl: true;
// originalName: true;
// fileSize: true;
// extractedData: true;
// processedData: true;
// confidence: true;
// status: true;
// errorMessage: true;
// invoiceId: true;
// invoicePaymentId: true;
// saleReceiptId: true;
// userId: true;
// createdAt: true;
// updatedAt: true;
// };
// }>;

// export class OCRService {
// // ========================================
// // MAIN PROCESSING WITH INVENTORY ITEMS
// // ========================================
// /\*_
// _ Main method to process OCR document
// _ Steps:
// _ 1. Check image quality
// _ 2. Extract text using OCR engine
// _ 3. Parse text with confidence scores
// _ 4. For invoices: Extract line items with details
// _ 5. Fuzzy match entities (parties, customers, inventory items)
// _ 6. Validate all extracted data
// _ 7. Check for duplicates
// _ 8. Reorganize file structure
// _ 9. Publish appropriate events
// \*/
// static async processDocument(
// ocrId: string,
// imageUrl: string,
// documentType: string,
// userId: string
// ): Promise<OCRDataResult | void> {
// try {
// logger.info("Starting OCR processing", LogCategory.OCR, {
// ocrId,
// imageUrl,
// documentType,
// });

// // STEP 1: Image Quality Pre-check (Feature 4)
// const qualityCheck = await this.checkImageQuality(imageUrl);
// if (!qualityCheck.isGoodQuality) {
// await prisma.oCRData.update({
// where: { id: ocrId },
// data: {
// status: OCRStatus.MANUAL_REVIEW,
// extractedData: {
// qualityCheck,
// message:
// "Low image quality detected. Manual review required.",
// },
// },
// });

// const manualReviewPublisher =
// new OCRManualReviewRequiredPublisher(kafkaWrapper.producer);
// await manualReviewPublisher.publish({
// jobId: ocrId,
// reason: "Low image quality",
// reviewPriority: "HIGH",
// lowConfidenceFields: [],
// invalidFields: [],
// qualityIssues: qualityCheck.issues,
// requiresReview: true,
// userId,
// });

// return;
// }

// // STEP 2: Extract text using OCR engine (Tesseract or Google Vision)
// const extractedText = await this.extractTextFromImage(imageUrl);

// // STEP 3: Parse text with field-level confidence (Feature 2)
// const parsedData = await this.parseWithFieldConfidence(
// extractedText,
// documentType,
// userId
// );

// // STEP 4: For invoices, extract inventory line items
// let extractedItems: ExtractedInvoiceItem[] = [];
// if (documentType === "invoice") {
// logger.info(
// "Extracting inventory items from invoice",
// LogCategory.OCR,
// {
// ocrId,
// }
// );
// extractedItems = await this.extractInvoiceItems(
// extractedText,
// parsedData,
// userId
// );

// // Add items to parsed data
// parsedData.fields.push({
// field: "items",
// value: extractedItems,
// confidence: this.calculateItemsConfidence(extractedItems),
// needsReview: extractedItems.some(
// (item) => item.needsReview
// ),
// validationPassed: extractedItems.every(
// (item) => item.validationErrors.length === 0
// ),
// validationErrors: extractedItems.flatMap(
// (item) => item.validationErrors
// ),
// });
// }

// // STEP 5: Fuzzy matching for entities (Feature 3)
// const enhancedData = await this.enhanceWithFuzzyMatching(
// parsedData,
// documentType,
// userId
// );

// // STEP 6: Validate extracted data (Feature 5)
// const validatedData = await this.validateExtractedData(
// enhancedData,
// documentType
// );

// // STEP 7: Check for duplicates (Feature 1)
// const duplicateCheck = await this.checkForDuplicates(
// validatedData,
// documentType,
// userId,
// ocrId
// );

// // STEP 8: File reorganization after successful parsing
// let finalImageUrl = imageUrl;
// const fields = validatedData.fields.reduce(
// (acc, field) => {
// acc[field.field] = field.value;
// return acc;
// },
// {} as Record<string, any>
// );

// if (fields.partyName || fields.customerName) {
// try {
// finalImageUrl =
// await FileUploadService.moveToOrganizedStructure(
// imageUrl,
// documentType,
// {
// partyName: fields.partyName,
// customerName: fields.customerName,
// invoiceNo: fields.invoiceNo,
// receiptNo: fields.receiptNo,
// date: fields.date
// ? new Date(fields.date)
// : new Date(),
// }
// );
// } catch (error: any) {
// logger.warn("File reorganization failed", LogCategory.OCR, {
// ocrId,
// error: error.message,
// });
// }
// }

// // STEP 9: Update OCR record with all results
// const updatedOCR = await prisma.oCRData.update({
// where: { id: ocrId },
// data: {
// imageUrl: finalImageUrl,
// extractedData: {
// rawText: extractedText,
// fields: validatedData.fields,
// qualityCheck,
// items: extractedItems, // Store extracted items
// },
// processedData: fields,
// confidence: validatedData.overallConfidence,
// status:
// validatedData.overallConfidence < 0.7 ||
// validatedData.invalidFields.length > 0 ||
// duplicateCheck.isDuplicate
// ? OCRStatus.MANUAL_REVIEW
// : OCRStatus.COMPLETED,
// updatedAt: new Date(),
// },
// select: {
// id: true,
// imageUrl: true,
// originalName: true,
// fileSize: true,
// extractedData: true,
// processedData: true,
// confidence: true,
// status: true,
// errorMessage: true,
// invoiceId: true,
// invoicePaymentId: true,
// saleReceiptId: true,
// userId: true,
// createdAt: true,
// updatedAt: true,
// },
// });

// // STEP 10: Publish events based on status
// const needsReview =
// validatedData.overallConfidence < 0.7 ||
// validatedData.invalidFields.length > 0 ||
// duplicateCheck.isDuplicate ||
// (extractedItems.length > 0 &&
// extractedItems.some((item) => item.needsReview));

// if (needsReview) {
// const manualReviewPublisher =
// new OCRManualReviewRequiredPublisher(kafkaWrapper.producer);
// await manualReviewPublisher.publish({
// jobId: ocrId,
// reason: duplicateCheck.isDuplicate
// ? "Duplicate detected"
// : validatedData.overallConfidence < 0.7
// ? "Low confidence"
// : "Validation errors",
// reviewPriority:
// validatedData.invalidFields.length > 2
// ? "HIGH"
// : "MEDIUM",
// lowConfidenceFields: validatedData.lowConfidenceFields,
// invalidFields: validatedData.invalidFields,
// requiresReview: true,
// userId,
// });
// } else {
// const jobCompletedPublisher = new OCRJobCompletedPublisher(
// kafkaWrapper.producer
// );
// await jobCompletedPublisher.publish({
// jobId: ocrId,
// completedAt: new Date().toISOString(),
// confidence: validatedData.overallConfidence,
// status: "COMPLETED",
// extractedText: extractedText,
// processingTime: 0,
// userId,
// });
// }

// logger.info("OCR processing completed", LogCategory.OCR, {
// ocrId,
// overallConfidence: validatedData.overallConfidence,
// needsReview,
// itemsExtracted: extractedItems.length,
// lowConfidenceFields: validatedData.lowConfidenceFields,
// invalidFields: validatedData.invalidFields,
// finalImageUrl,
// });

// return updatedOCR;
// } catch (error: any) {
// logger.error("OCR processing failed", undefined, LogCategory.OCR, {
// ocrId,
// error: error.message,
// });

// await prisma.oCRData.update({
// where: { id: ocrId },
// data: {
// status: OCRStatus.FAILED,
// errorMessage: error.message,
// updatedAt: new Date(),
// },
// });

// const jobFailedPublisher = new OCRJobFailedPublisher(
// kafkaWrapper.producer
// );
// await jobFailedPublisher.publish({
// jobId: ocrId,
// failedAt: new Date().toISOString(),
// error: error.message,
// retryable: true,
// userId,
// });

// throw error;
// }
// }

// // ========================================
// // INVOICE ITEM EXTRACTION (NEW)
// // ========================================
// /\*_
// _ Extract line items from invoice text
// _ This method identifies and parses individual items with their details
// _
// _ Typical invoice format:
// _ Item Name Qty Price Total
// _ Cotton Saree 5 1500 7500
// _ Silk Fabric 10 2000 20000
// _
// _ Steps:
// _ 1. Identify the items section (after headers, before totals)
// _ 2. Parse each line to extract item details
// _ 3. Validate quantities and prices
// _ 4. Fuzzy match items with existing inventory
// _ 5. Calculate confidence scores
// _/
// private static async extractInvoiceItems(
// extractedText: string,
// parsedData: ParsedDataWithConfidence,
// userId: string
// ): Promise<ExtractedInvoiceItem[]> {
// try {
// const items: ExtractedInvoiceItem[] = [];
// const lines = extractedText.split("\n").map((line) => line.trim());

// // STEP 1: Find the items section
// // Look for common table headers like "Item", "Qty", "Price", "Amount"
// let itemsSectionStart = -1;
// let itemsSectionEnd = lines.length;

// for (let i = 0; i < lines.length; i++) {
// const line = lines[i].toLowerCase();
// // Detect header row
// if (
// (line.includes("item") || line.includes("description")) &&
// (line.includes("qty") || line.includes("quantity")) &&
// (line.includes("price") ||
// line.includes("rate") ||
// line.includes("amount"))
// ) {
// itemsSectionStart = i + 1; // Items start after header
// }

// // Detect end of items (usually where totals start)
// if (
// line.includes("subtotal") ||
// line.includes("total") ||
// line.includes("grand total") ||
// line.includes("tax") ||
// line.includes("discount")
// ) {
// itemsSectionEnd = i;
// break;
// }
// }

// if (itemsSectionStart === -1) {
// logger.warn("No items section header found", LogCategory.OCR);
// // Try to extract items without header detection
// itemsSectionStart = 0;
// }

// logger.info("Items section identified", LogCategory.OCR, {
// startLine: itemsSectionStart,
// endLine: itemsSectionEnd,
// });

// // STEP 2: Parse each line in the items section
// for (let i = itemsSectionStart; i < itemsSectionEnd; i++) {
// const line = lines[i];

// // Skip empty lines or very short lines
// if (!line || line.length < 5) continue;

// // Skip lines that look like headers or footers
// if (
// line.toLowerCase().includes("item") ||
// line.toLowerCase().includes("description") ||
// line.toLowerCase().includes("continued")
// ) {
// continue;
// }

// // STEP 3: Extract item details from the line
// const item = await this.parseItemLine(line, userId);

// if (item) {
// items.push(item);
// }
// }

// // STEP 4: Validate total items against invoice total
// const totalFromItems = items.reduce(
// (sum, item) => sum + item.totalAmount,
// 0
// );
// const invoiceTotalField = parsedData.fields.find(
// (f) => f.field === "amount"
// );
// const invoiceTotal = invoiceTotalField?.value || 0;

// // Check if totals match (within 5% tolerance for rounding/tax)
// const tolerance = invoiceTotal \* 0.05;
// const totalsMatch =
// Math.abs(totalFromItems - invoiceTotal) <= tolerance;

// if (!totalsMatch && items.length > 0) {
// logger.warn(
// "Item totals don't match invoice total",
// LogCategory.OCR,
// {
// totalFromItems,
// invoiceTotal,
// difference: Math.abs(totalFromItems - invoiceTotal),
// }
// );

// // Mark all items as needing review
// items.forEach((item) => {
// item.needsReview = true;
// item.validationErrors.push(
// "Item totals don't match invoice total"
// );
// });
// }

// logger.info("Items extraction completed", LogCategory.OCR, {
// itemsFound: items.length,
// totalFromItems,
// invoiceTotal,
// totalsMatch,
// });

// return items;
// } catch (error: any) {
// logger.error("Item extraction failed", undefined, LogCategory.OCR, {
// error: error.message,
// });
// return [];
// }
// }

// /\*_
// _ Parse a single line to extract item details
// _
// _ Common patterns:
// _ - "Cotton Saree 5 1500 7500"
// _ - "Silk Fabric | 10 | 2000 | 20000"
// _ - "Item: Cotton, Qty: 5, Price: 1500, Total: 7500"
// _
// _ Steps:
// _ 1. Try to identify numbers (qty, price, total)
// _ 2. Extract item name (text before numbers)
// _ 3. Validate: total = qty _ price
// _ 4. Fuzzy match item name with inventory
// _ 5. Calculate confidence score
// _/
// private static async parseItemLine(
// line: string,
// userId: string
// ): Promise<ExtractedInvoiceItem | null> {
// try {
// // STEP 1: Extract all numbers from the line
// const numberPattern = /\d+\.?\d\*/g;
// const numbers =
// line.match(numberPattern)?.map((n) => parseFloat(n)) || [];

// // We need at least 2 numbers (qty and price) or 3 (qty, price, total)
// if (numbers.length < 2) {
// return null;
// }

// // STEP 2: Determine which numbers are qty, price, and total
// let quantity: number;
// let price: number;
// let totalAmount: number;

// if (numbers.length === 2) {
// // Only qty and price, calculate total
// [quantity, price] = numbers;
// totalAmount = quantity \* price;
// } else if (numbers.length >= 3) {
// // Most common: qty, price, total
// // Take last 3 numbers
// const relevantNumbers = numbers.slice(-3);
// [quantity, price, totalAmount] = relevantNumbers;

// // Validate: total should equal qty _ price (with small tolerance)
// const calculatedTotal = quantity _ price;
// const tolerance = calculatedTotal \* 0.01; // 1% tolerance

// if (Math.abs(calculatedTotal - totalAmount) > tolerance) {
// // Try different interpretation: maybe first is item code, then qty, price, total
// if (numbers.length >= 4) {
// [, quantity, price, totalAmount] = numbers.slice(-4);
// }
// }
// } else {
// return null;
// }

// // STEP 3: Extract item name (text before the numbers)
// // Remove all numbers and special characters to get item name
// let itemName = line
// .replace(numberPattern, "")
// .replace(/[|,\t]/g, " ")
// .trim();

// // Clean up item name
// itemName = itemName
// .replace(/\s+/g, " ")
// .replace(/^[-.*]\s\*/, "") // Remove bullet points
// .trim();

// if (!itemName || itemName.length < 2) {
// return null;
// }

// // STEP 4: Basic validation
// const validationErrors: string[] = [];

// if (quantity <= 0) {
// validationErrors.push("Invalid quantity");
// }
// if (price <= 0) {
// validationErrors.push("Invalid price");
// }
// if (totalAmount <= 0) {
// validationErrors.push("Invalid total amount");
// }

// // Verify calculation
// const calculatedTotal = quantity _ price;
// const tolerance = Math.max(calculatedTotal _ 0.02, 1); // 2% or minimum 1
// if (Math.abs(calculatedTotal - totalAmount) > tolerance) {
// validationErrors.push(
// `Total mismatch: ${quantity} * ${price} = ${calculatedTotal}, but found ${totalAmount}`
// );
// }

// // STEP 5: Fuzzy match with existing inventory
// const matchResult = await this.fuzzyMatchInventoryItem(
// itemName,
// userId
// );

// // STEP 6: Calculate confidence score
// let confidence = 0.5; // Base confidence

// // Increase confidence based on factors
// if (matchResult.matched && matchResult.matchType === "exact") {
// confidence += 0.3;
// } else if (
// matchResult.matched &&
// matchResult.matchType === "fuzzy"
// ) {
// confidence += matchResult.confidence \* 0.3;
// }

// if (validationErrors.length === 0) {
// confidence += 0.2;
// }

// // Check if numbers make sense (not too large or small)
// if (
// quantity > 0 &&
// quantity < 10000 &&
// price > 0 &&
// price < 1000000
// ) {
// confidence += 0.1;
// }

// const needsReview =
// confidence < 0.7 ||
// validationErrors.length > 0 ||
// !matchResult.matched;

// const item: ExtractedInvoiceItem = {
// itemName: matchResult.matched
// ? matchResult.matchedItem.name
// : itemName,
// description: matchResult.matched
// ? matchResult.matchedItem.description
// : undefined,
// quantity,
// price,
// totalAmount,
// confidence: Math.min(confidence, 1),
// matchedInventoryId: matchResult.matched
// ? matchResult.matchedItem.id
// : undefined,
// needsReview,
// validationErrors,
// };

// logger.info("Item parsed successfully", LogCategory.OCR, {
// itemName: item.itemName,
// quantity,
// price,
// totalAmount,
// matched: matchResult.matched,
// confidence: item.confidence,
// });

// return item;
// } catch (error: any) {
// logger.error(
// "Failed to parse item line",
// undefined,
// LogCategory.OCR,
// {
// line,
// error: error.message,
// }
// );
// return null;
// }
// }

// /\*_
// _ Fuzzy match an item name against inventory database
// _ Uses Fuse.js for fuzzy string matching
// _
// _ Returns:
// _ - matched: true if a good match was found
// _ - matchedItem: The inventory item from database
// _ - confidence: How confident the match is (0-1)
// _ - suggestions: Alternative matches if no exact match
// _/
// private static async fuzzyMatchInventoryItem(
// itemName: string,
// userId: string
// ): Promise<ItemFuzzyMatchResult> {
// try {
// // Fetch all inventory items for this user
// const inventoryItems = await prisma.inventoryItem.findMany({
// where: { userId },
// select: {
// id: true,
// name: true,
// description: true,
// category: true,
// sku: true,
// },
// });

// if (inventoryItems.length === 0) {
// return {
// matched: false,
// matchedItem: null,
// confidence: 0,
// matchType: "none",
// suggestions: [],
// };
// }

// // Configure Fuse.js for fuzzy matching
// const fuse = new Fuse(inventoryItems, {
// keys: ["name", "description", "sku"],
// threshold: 0.4, // 0 = exact match, 1 = match anything
// includeScore: true,
// minMatchCharLength: 3,
// });

// const results = fuse.search(itemName);

// if (results.length === 0) {
// return {
// matched: false,
// matchedItem: null,
// confidence: 0,
// matchType: "none",
// suggestions: [],
// };
// }

// const bestMatch = results[0];
// const confidence = 1 - (bestMatch.score || 0); // Convert score to confidence

// // Determine match type
// let matchType: "exact" | "fuzzy" | "none" = "none";
// if (confidence >= 0.9) {
// matchType = "exact";
// } else if (confidence >= 0.6) {
// matchType = "fuzzy";
// }

// const matched = confidence >= 0.6; // Consider it a match if confidence >= 60%

// return {
// matched,
// matchedItem: bestMatch.item,
// confidence,
// matchType,
// suggestions: results.slice(1, 4).map((r) => ({
// item: r.item,
// score: 1 - (r.score || 0),
// })),
// };
// } catch (error: any) {
// logger.error(
// "Inventory fuzzy matching failed",
// undefined,
// LogCategory.OCR,
// {
// itemName,
// error: error.message,
// }
// );
// return {
// matched: false,
// matchedItem: null,
// confidence: 0,
// matchType: "none",
// suggestions: [],
// };
// }
// }

// /\*_
// _ Calculate overall confidence score for all items
// \*/
// private static calculateItemsConfidence(
// items: ExtractedInvoiceItem[]
// ): number {
// if (items.length === 0) return 1; // No items means no issues

// const totalConfidence = items.reduce(
// (sum, item) => sum + item.confidence,
// 0
// );
// return totalConfidence / items.length;
// }

// // ========================================
// // CREATE INVOICE WITH ITEMS
// // ========================================
// /\*_
// _ Create invoice from OCR data with inventory items
// _
// _ Steps:
// _ 1. Find the party (supplier)
// _ 2. Generate proper voucher ID
// _ 3. Prepare items data for database
// _ 4. Create invoice with items in a transaction
// _ 5. Update inventory stock levels
// _ 6. Link OCR data to invoice
// \*/
// static async createInvoiceFromOCR(
// processedData: ProcessedInvoiceData,
// userId: string,
// ocrId: string
// ): Promise<any> {
// try {
// // STEP 1: Find party
// const party = await prisma.party.findFirst({
// where: {
// userId,
// OR: [
// { gstNo: processedData.partyGST },
// {
// name: {
// contains: processedData.partyName,
// mode: "insensitive",
// },
// },
// ],
// },
// });

// if (!party) {
// throw new CustomError(
// 400,
// "Party not found. Please create party first."
// );
// }

// // STEP 2: Generate proper voucher ID
// const voucherId = generateInvoiceVoucherId(
// party.name,
// new Date(processedData.date)
// );

// // STEP 3: Prepare items data
// // Convert ExtractedInvoiceItem to invoice item format
// const invoiceItems = processedData.items.map((item) => ({
// itemName: item.itemName,
// description: item.description || "",
// quantity: item.quantity,
// price: item.price,
// totalAmount: item.totalAmount,
// inventoryId: item.matchedInventoryId, // Link to inventory if matched
// }));

// logger.info("Creating invoice with items", LogCategory.OCR, {
// ocrId,
// partyName: party.name,
// voucherId,
// itemCount: invoiceItems.length,
// totalAmount: processedData.amount,
// });

// // STEP 4: Create invoice with items in a transaction
// const invoice = await prisma.$transaction(async (tx) => {
// // Create the invoice
// const newInvoice = await tx.invoice.create({
// data: {
// voucherId,
// invoiceNo: processedData.invoiceNo,
// date: new Date(processedData.date),
// amount: processedData.amount,
// remainingAmount: processedData.amount,
// partyId: party.id,
// userId,
// items: invoiceItems, // Store as JSON
// status: "PENDING",
// },
// });

// // STEP 5: Update inventory stock levels for matched items
// for (const item of processedData.items) {
// if (item.matchedInventoryId) {
// // Increase stock (purchase increases inventory)
// await tx.inventoryItem.update({
// where: { id: item.matchedInventoryId },
// data: {
// currentStock: {
// increment: item.quantity,
// },
// lastPurchaseDate: new Date(),
// lastPurchasePrice: item.price,
// updatedAt: new Date(),
// },
// });

// // Create stock movement record
// const previousStock = await tx.inventoryItem.findUnique(
// {
// where: { id: item.matchedInventoryId },
// select: { currentStock: true },
// }
// );

// await tx.stockMovement.create({
// data: {
// inventoryItemId: item.matchedInventoryId,
// type: "IN",
// quantity: item.quantity,
// previousStock: previousStock?.currentStock || 0,
// newStock:
// (previousStock?.currentStock || 0) +
// item.quantity,
// reason: "Purchase Invoice",
// reference: newInvoice.invoiceNo,
// unitPrice: item.price,
// totalValue: item.totalAmount,
// userId,
// },
// });

// logger.info(
// "Inventory updated",
// LogCategory.INVENTORY,
// {
// inventoryId: item.matchedInventoryId,
// quantityAdded: item.quantity,
// itemName: item.itemName,
// }
// );
// }
// }

// // STEP 6: Link OCR data to invoice
// await tx.oCRData.update({
// where: { id: ocrId },
// data: { invoiceId: newInvoice.id },
// });

// return newInvoice;
// });

// logger.info(
// "Invoice created from OCR with items",
// LogCategory.OCR,
// {
// ocrId,
// invoiceId: invoice.id,
// voucherId,
// partyName: party.name,
// itemCount: invoiceItems.length,
// totalAmount: invoice.amount,
// }
// );

// return invoice;
// } catch (error: any) {
// logger.error(
// "Failed to create invoice from OCR",
// undefined,
// LogCategory.OCR,
// {
// ocrId,
// error: error.message,
// }
// );
// throw error;
// }
// }

// // ========================================
// // OTHER RECORD CREATION METHODS
// // ========================================

// static async createInvoicePaymentFromOCR(
// processedData: ProcessedPaymentData,
// userId: string,
// ocrId: string
// ): Promise<any> {
// const party = await prisma.party.findFirst({
// where: {
// userId,
// name: {
// contains: processedData.partyName,
// mode: "insensitive",
// },
// },
// });

// if (!party) {
// throw new CustomError(
// 400,
// "Party not found. Please create party first."
// );
// }

// const voucherId = generateInvoicePaymentVoucherId(
// party.name,
// new Date(processedData.date)
// );

// const payment = await prisma.invoicePayment.create({
// data: {
// voucherId,
// amount: processedData.amount,
// date: new Date(processedData.date),
// method: processedData.method || "OTHER",
// reference: processedData.reference,
// partyId: party.id,
// userId,
// status: "COMPLETED",
// },
// });

// await prisma.oCRData.update({
// where: { id: ocrId },
// data: { invoicePaymentId: payment.id },
// });

// logger.info("Invoice payment created from OCR", LogCategory.OCR, {
// ocrId,
// paymentId: payment.id,
// voucherId,
// partyName: party.name,
// });

// return payment;
// }

// static async createSaleReceiptFromOCR(
// processedData: ProcessedReceiptData,
// userId: string,
// ocrId: string
// ): Promise<any> {
// const customer = await prisma.customer.findFirst({
// where: {
// userId,
// name: {
// contains: processedData.customerName,
// mode: "insensitive",
// },
// },
// });

// if (!customer) {
// throw new CustomError(
// 400,
// "Customer not found. Please create customer first."
// );
// }

// const voucherId = generateSaleReceiptVoucherId(
// customer.name,
// new Date(processedData.date)
// );

// const receipt = await prisma.saleReceipt.create({
// data: {
// voucherId,
// receiptNo: processedData.receiptNo || voucherId,
// date: new Date(processedData.date),
// amount: processedData.amount,
// method: processedData.method || "CASH",
// customerId: customer.id,
// userId,
// },
// });

// await prisma.oCRData.update({
// where: { id: ocrId },
// data: { saleReceiptId: receipt.id },
// });

// logger.info("Sale receipt created from OCR", LogCategory.OCR, {
// ocrId,
// receiptId: receipt.id,
// voucherId,
// customerName: customer.name,
// });

// return receipt;
// }

// // ========================================
// // 1. IMAGE QUALITY CHECK (FEATURE 4)
// // ========================================
// /\*_
// _ Check image quality using sharp library
// _ Validates: resolution, blur, lighting, compression
// _/
// private static async checkImageQuality(
// imageUrl: string
// ): Promise<ImageQualityResult> {
// try {
// let imageBuffer: Buffer;

// // Load image (supports both local and remote URLs)
// if (imageUrl.startsWith("http")) {
// const response = await fetch(imageUrl);
// imageBuffer = Buffer.from(await response.arrayBuffer());
// } else {
// const fs = require("fs");
// imageBuffer = fs.readFileSync(imageUrl);
// }

// // Get image metadata and statistics
// const metadata = await sharp(imageBuffer).metadata();
// const stats = await sharp(imageBuffer).stats();

// const issues: string[] = [];
// const warnings: string[] = [];
// const recommendations: string[] = [];
// let score = 100; // Start with perfect score

// // 1. Check Resolution
// if (metadata.width && metadata.height) {
// const totalPixels = metadata.width \* metadata.height;
// if (totalPixels < 500000) {
// issues.push("Resolution too low");
// recommendations.push(
// "Use higher resolution image (min 1000x700)"
// );
// score -= 40;
// } else if (totalPixels < 1000000) {
// warnings.push("Resolution is low, may affect accuracy");
// score -= 15;
// }
// }

// // 2. Check for Blur (using standard deviation)
// const avgStdDev =
// stats.channels.reduce((sum, ch) => sum + ch.std, 0) /
// stats.channels.length;

// if (avgStdDev < 20) {
// issues.push("Image is too blurry");
// recommendations.push("Ensure camera is focused and stable");
// score -= 35;
// } else if (avgStdDev < 35) {
// warnings.push("Image may be slightly blurry");
// score -= 10;
// }

// // 3. Check Lighting (using mean brightness)
// const avgMean =
// stats.channels.reduce((sum, ch) => sum + ch.mean, 0) /
// stats.channels.length;

// if (avgMean < 50) {
// warnings.push("Image is too dark");
// recommendations.push(
// "Increase lighting or adjust camera settings"
// );
// score -= 15;
// } else if (avgMean > 220) {
// warnings.push("Image is overexposed");
// recommendations.push(
// "Reduce lighting or adjust camera settings"
// );
// score -= 15;
// }

// // 4. Check Compression
// const fileSize = imageBuffer.length;
// if (
// fileSize < 50000 &&
// metadata.width! \* metadata.height! > 500000
// ) {
// warnings.push("Image appears heavily compressed");
// score -= 10;
// }

// // Good quality if score >= 60 and no critical issues
// const isGoodQuality = score >= 60 && issues.length === 0;

// return {
// isGoodQuality,
// score,
// issues,
// warnings,
// recommendations,
// };
// } catch (error: any) {
// logger.error(
// "Image quality check failed",
// undefined,
// LogCategory.OCR,
// {
// error: error.message,
// }
// );

// // Return default result on error
// return {
// isGoodQuality: true,
// score: 75,
// issues: [],
// warnings: ["Could not perform quality check"],
// recommendations: [],
// };
// }
// }

// // ========================================
// // 2. TEXT EXTRACTION
// // ========================================
// /\*_
// _ Extract text from image using configured OCR engine
// \*/
// private static async extractTextFromImage(
// imageUrl: string
// ): Promise<string> {
// const useGoogleVision = process.env.USE_GOOGLE_VISION === "true";

// if (useGoogleVision) {
// return this.extractWithGoogleVision(imageUrl);
// } else {
// return this.extractWithTesseract(imageUrl);
// }
// }

// /\*_
// _ Extract text using Google Cloud Vision API
// _ Better accuracy but requires API key and billing
// _/
// private static async extractWithGoogleVision(
// imageUrl: string
// ): Promise<string> {
// try {
// const [result] = await visionClient.textDetection(imageUrl);
// const detections = result.textAnnotations;
// return detections && detections.length > 0
// ? detections[0].description || ""
// : "";
// } catch (error: any) {
// logger.error(
// "Google Vision extraction failed",
// undefined,
// LogCategory.OCR,
// {
// error: error.message,
// }
// );
// throw new Error("Failed to extract text using Google Vision");
// }
// }

// /\*_
// _ Extract text using Tesseract.js
// _ Free and runs locally, but less accurate than Google Vision
// _/
// private static async extractWithTesseract(
// imageUrl: string
// ): Promise<string> {
// try {
// const result = await Tesseract.recognize(imageUrl, "eng", {
// logger: (m) => console.log(m),
// });
// return result.data.text;
// } catch (error: any) {
// logger.error(
// "Tesseract extraction failed",
// undefined,
// LogCategory.OCR,
// {
// error: error.message,
// }
// );
// throw new Error("Failed to extract text using Tesseract");
// }
// }

// // ========================================
// // 3. PARSE WITH FIELD CONFIDENCE (FEATURE 2)
// // ========================================
// /\*_
// _ Parse extracted text into structured fields with confidence scores
// _ Different patterns for invoice, payment, receipt
// _/
// private static async parseWithFieldConfidence(
// text: string,
// documentType: string,
// userId: string
// ): Promise<ParsedDataWithConfidence> {
// const lines = text.split("\n").filter((line) => line.trim());
// const fields: FieldConfidence[] = [];

// if (documentType === "invoice") {
// // Extract Invoice Number
// const invoiceNoPattern =
// /(?:invoice|bill|inv)[\s#:]\*([A-Z0-9\-\/]+)/i;
// const invoiceMatch = text.match(invoiceNoPattern);
// fields.push({
// field: "invoiceNo",
// value: invoiceMatch ? invoiceMatch[1].trim() : null,
// confidence: invoiceMatch ? 0.95 : 0,
// needsReview: !invoiceMatch,
// validationPassed: true,
// validationErrors: invoiceMatch
// ? []
// : ["Invoice number not found"],
// });

// // Extract Date
// const datePattern =
// /(?:date|dated)[\s:]\*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
// const dateMatch = text.match(datePattern);
// const parsedDate = dateMatch ? this.parseDate(dateMatch[1]) : null;
// fields.push({
// field: "date",
// value: parsedDate,
// confidence: dateMatch ? 0.9 : 0,
// needsReview: !dateMatch,
// validationPassed: true,
// validationErrors: dateMatch ? [] : ["Date not found"],
// });

// // Extract Amount
// const amountPattern =
// /(?:total|amount|grand total)[\s:]_(?:rs\.?|₹)?\s_([0-9,]+\.?\d\*)/i;
// const amountMatch = text.match(amountPattern);
// const amount = amountMatch
// ? parseFloat(amountMatch[1].replace(/,/g, ""))
// : null;
// fields.push({
// field: "amount",
// value: amount,
// confidence: amountMatch ? 0.9 : 0,
// needsReview: !amountMatch || amount === 0,
// validationPassed: amount ? amount > 0 : false,
// validationErrors: amount ? [] : ["Amount not found or invalid"],
// });

// // Extract Party GST (if present)
// const gstPattern =
// /(?:gstin|gst)[\s:]\*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1})/i;
// const gstMatch = text.match(gstPattern);
// if (gstMatch) {
// fields.push({
// field: "partyGST",
// value: gstMatch[1].toUpperCase(),
// confidence: 0.95,
// needsReview: false,
// validationPassed: true,
// validationErrors: [],
// });
// }

// // Extract Party Name (look for "from", "vendor", "supplier")
// const partyPattern =
// /(?:from|vendor|supplier|sold by)[\s:]_([^\n]+)/i;
// const partyMatch = text.match(partyPattern);
// if (partyMatch) {
// fields.push({
// field: "partyName",
// value: partyMatch[1].trim(),
// confidence: 0.85,
// needsReview: false,
// validationPassed: true,
// validationErrors: [],
// });
// }
// } else if (documentType === "invoice_payment") {
// // Extract Payment Amount
// const amountPattern =
// /(?:amount|paid)[\s:]_(?:rs\.?|₹)?\s*([0-9,]+\.?\d*)/i;
// const amountMatch = text.match(amountPattern);
// const amount = amountMatch
// ? parseFloat(amountMatch[1].replace(/,/g, ""))
// : null;
// fields.push({
// field: "amount",
// value: amount,
// confidence: amountMatch ? 0.9 : 0,
// needsReview: !amountMatch,
// validationPassed: amount ? amount > 0 : false,
// validationErrors: amount ? [] : ["Amount not found"],
// });

// // Extract Date
// const datePattern =
// /(?:date|dated)[\s:]\*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
// const dateMatch = text.match(datePattern);
// const parsedDate = dateMatch ? this.parseDate(dateMatch[1]) : null;
// fields.push({
// field: "date",
// value: parsedDate,
// confidence: dateMatch ? 0.9 : 0,
// needsReview: !dateMatch,
// validationPassed: true,
// validationErrors: dateMatch ? [] : ["Date not found"],
// });

// // Extract Payment Method
// const methodPattern = /(?:method|mode|via)[\s:]\*([^\n]+)/i;
// const methodMatch = text.match(methodPattern);
// if (methodMatch) {
// fields.push({
// field: "method",
// value: methodMatch[1].trim(),
// confidence: 0.8,
// needsReview: false,
// validationPassed: true,
// validationErrors: [],
// });
// }

// // Extract Reference Number
// const refPattern =
// /(?:ref|reference|transaction)[\s#:]_([A-Z0-9]+)/i;
// const refMatch = text.match(refPattern);
// if (refMatch) {
// fields.push({
// field: "reference",
// value: refMatch[1].trim(),
// confidence: 0.85,
// needsReview: false,
// validationPassed: true,
// validationErrors: [],
// });
// }
// } else if (documentType === "sale_receipt") {
// // Extract Receipt Number
// const receiptPattern = /(?:receipt|rec)[\s#:]_([A-Z0-9\-\/]+)/i;
// const receiptMatch = text.match(receiptPattern);
// fields.push({
// field: "receiptNo",
// value: receiptMatch ? receiptMatch[1].trim() : null,
// confidence: receiptMatch ? 0.95 : 0,
// needsReview: !receiptMatch,
// validationPassed: true,
// validationErrors: receiptMatch
// ? []
// : ["Receipt number not found"],
// });

// // Extract Amount
// const amountPattern =
// /(?:amount|total|paid)[\s:]_(?:rs\.?|₹)?\s_([0-9,]+\.?\d\*)/i;
// const amountMatch = text.match(amountPattern);
// const amount = amountMatch
// ? parseFloat(amountMatch[1].replace(/,/g, ""))
// : null;
// fields.push({
// field: "amount",
// value: amount,
// confidence: amountMatch ? 0.9 : 0,
// needsReview: !amountMatch,
// validationPassed: amount ? amount > 0 : false,
// validationErrors: amount ? [] : ["Amount not found"],
// });

// // Extract Date
// const datePattern =
// /(?:date|dated)[\s:]\*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
// const dateMatch = text.match(datePattern);
// const parsedDate = dateMatch ? this.parseDate(dateMatch[1]) : null;
// fields.push({
// field: "date",
// value: parsedDate,
// confidence: dateMatch ? 0.9 : 0,
// needsReview: !dateMatch,
// validationPassed: true,
// validationErrors: dateMatch ? [] : ["Date not found"],
// });

// // Extract Customer Name
// const customerPattern = /(?:customer|buyer|to)[\s:]\*([^\n]+)/i;
// const customerMatch = text.match(customerPattern);
// if (customerMatch) {
// fields.push({
// field: "customerName",
// value: customerMatch[1].trim(),
// confidence: 0.85,
// needsReview: false,
// validationPassed: true,
// validationErrors: [],
// });
// }
// }

// // Calculate overall confidence
// const totalConfidence = fields.reduce(
// (sum, f) => sum + f.confidence,
// 0
// );
// const overallConfidence =
// fields.length > 0 ? totalConfidence / fields.length : 0;

// // Categorize fields
// const highConfidenceFields = fields
// .filter((f) => f.confidence >= 0.8)
// .map((f) => f.field);
// const lowConfidenceFields = fields
// .filter((f) => f.confidence < 0.8 && f.confidence > 0)
// .map((f) => f.field);
// const invalidFields = fields
// .filter((f) => !f.validationPassed)
// .map((f) => f.field);

// return {
// fields,
// overallConfidence,
// highConfidenceFields,
// lowConfidenceFields,
// invalidFields,
// };
// }

// /\*_
// _ Parse date string into ISO format
// _ Handles various date formats: DD/MM/YYYY, DD-MM-YYYY, etc.
// _/
// private static parseDate(dateStr: string): string | null {
// try {
// const cleaned = dateStr.trim();
// const parts = cleaned.split(/[-\/]/);

// if (parts.length === 3) {
// let day = parseInt(parts[0]);
// let month = parseInt(parts[1]);
// let year = parseInt(parts[2]);

// // Handle 2-digit year
// if (year < 100) {
// year = year > 50 ? 1900 + year : 2000 + year;
// }

// const date = new Date(year, month - 1, day);
// return date.toISOString();
// }
// return null;
// } catch (error) {
// return null;
// }
// }

// // ========================================
// // 4. FUZZY MATCHING (FEATURE 3)
// // ========================================
// /\*_
// _ Enhance parsed data with fuzzy matching for parties/customers
// \*/
// private static async enhanceWithFuzzyMatching(
// parsedData: ParsedDataWithConfidence,
// documentType: string,
// userId: string
// ): Promise<ParsedDataWithConfidence> {
// const enhancedFields = await Promise.all(
// parsedData.fields.map(async (field) => {
// // Fuzzy match party names
// if (field.field === "partyName" && field.value) {
// const matchResult = await this.fuzzyMatchParty(
// field.value,
// userId
// );

// if (matchResult.matched) {
// return {
// ...field,
// value: matchResult.matchedEntity.name,
// confidence: Math.max(
// field.confidence,
// matchResult.confidence
// ),
// needsReview: matchResult.matchType === "fuzzy",
// };
// }
// }

// // Fuzzy match customer names
// if (field.field === "customerName" && field.value) {
// const matchResult = await this.fuzzyMatchCustomer(
// field.value,
// userId
// );

// if (matchResult.matched) {
// return {
// ...field,
// value: matchResult.matchedEntity.name,
// confidence: Math.max(
// field.confidence,
// matchResult.confidence
// ),
// needsReview: matchResult.matchType === "fuzzy",
// };
// }
// }

// return field;
// })
// );

// return {
// ...parsedData,
// fields: enhancedFields,
// };
// }

// /\*_
// _ Fuzzy match party (supplier) names using Fuse.js
// \*/
// private static async fuzzyMatchParty(
// partyName: string,
// userId: string
// ): Promise<FuzzyMatchResult> {
// try {
// const parties = await prisma.party.findMany({
// where: { userId },
// select: { id: true, name: true, gstNo: true },
// });

// if (parties.length === 0) {
// return {
// matched: false,
// matchedEntity: null,
// confidence: 0,
// matchType: "none",
// suggestions: [],
// };
// }

// const fuse = new Fuse(parties, {
// keys: ["name", "gstNo"],
// threshold: 0.4, // 0 = exact match, 1 = match anything
// includeScore: true,
// });

// const results = fuse.search(partyName);

// if (results.length > 0 && results[0].score! < 0.3) {
// return {
// matched: true,
// matchedEntity: results[0].item,
// confidence: 1 - results[0].score!,
// matchType: results[0].score! < 0.1 ? "exact" : "fuzzy",
// suggestions: results
// .slice(1, 4)
// .map((r) => ({ entity: r.item, score: 1 - r.score! })),
// };
// }

// return {
// matched: false,
// matchedEntity: null,
// confidence: results.length > 0 ? 1 - results[0].score! : 0,
// matchType: "none",
// suggestions: results
// .slice(0, 3)
// .map((r) => ({ entity: r.item, score: 1 - r.score! })),
// };
// } catch (error: any) {
// logger.error(
// "Party fuzzy matching failed",
// undefined,
// LogCategory.OCR,
// {
// error: error.message,
// }
// );
// return {
// matched: false,
// matchedEntity: null,
// confidence: 0,
// matchType: "none",
// suggestions: [],
// };
// }
// }

// /\*_
// _ Fuzzy match customer names using Fuse.js
// \*/
// private static async fuzzyMatchCustomer(
// customerName: string,
// userId: string
// ): Promise<FuzzyMatchResult> {
// try {
// const customers = await prisma.customer.findMany({
// where: { userId },
// select: { id: true, name: true, phone: true, email: true },
// });

// if (customers.length === 0) {
// return {
// matched: false,
// matchedEntity: null,
// confidence: 0,
// matchType: "none",
// suggestions: [],
// };
// }

// const fuse = new Fuse(customers, {
// keys: ["name", "phone", "email"],
// threshold: 0.4,
// includeScore: true,
// });

// const results = fuse.search(customerName);

// if (results.length > 0 && results[0].score! < 0.3) {
// return {
// matched: true,
// matchedEntity: results[0].item,
// confidence: 1 - results[0].score!,
// matchType: results[0].score! < 0.1 ? "exact" : "fuzzy",
// suggestions: results
// .slice(1, 4)
// .map((r) => ({ entity: r.item, score: 1 - r.score! })),
// };
// }

// return {
// matched: false,
// matchedEntity: null,
// confidence: results.length > 0 ? 1 - results[0].score! : 0,
// matchType: "none",
// suggestions: results
// .slice(0, 3)
// .map((r) => ({ entity: r.item, score: 1 - r.score! })),
// };
// } catch (error: any) {
// logger.error(
// "Customer fuzzy matching failed",
// undefined,
// LogCategory.OCR,
// {
// error: error.message,
// }
// );
// return {
// matched: false,
// matchedEntity: null,
// confidence: 0,
// matchType: "none",
// suggestions: [],
// };
// }
// }

// // ========================================
// // 5. VALIDATION (FEATURE 5)
// // ========================================
// /\*_
// _ Validate extracted fields using business rules
// \*/
// private static async validateExtractedData(
// parsedData: ParsedDataWithConfidence,
// documentType: string
// ): Promise<ParsedDataWithConfidence> {
// const validatedFields = await Promise.all(
// parsedData.fields.map(async (field) => {
// const validationErrors: string[] = [];
// let validationPassed = true;

// switch (field.field) {
// case "partyGST":
// case "gstNumber":
// if (field.value) {
// const gstValid = this.validateGSTNumber(
// field.value
// );
// if (!gstValid) {
// validationErrors.push(
// "Invalid GST number format"
// );
// validationPassed = false;
// }
// }
// break;

// case "amount":
// if (!field.value || field.value <= 0) {
// validationErrors.push(
// "Amount must be greater than 0"
// );
// validationPassed = false;
// }
// if (field.value && field.value > 10000000) {
// validationErrors.push(
// "Amount seems unusually high"
// );
// validationPassed = false;
// }
// break;

// case "date":
// if (field.value) {
// const date = new Date(field.value);
// const now = new Date();
// const futureLimit = new Date();
// futureLimit.setDate(futureLimit.getDate() + 30);

// if (date > futureLimit) {
// validationErrors.push(
// "Date is too far in the future"
// );
// validationPassed = false;
// }

// const pastLimit = new Date();
// pastLimit.setFullYear(pastLimit.getFullYear() - 5);
// if (date < pastLimit) {
// validationErrors.push(
// "Date is too far in the past"
// );
// validationPassed = false;
// }
// }
// break;

// case "invoiceNo":
// case "receiptNo":
// if (!field.value) {
// validationErrors.push("Required field is missing");
// validationPassed = false;
// }
// break;
// }

// return {
// ...field,
// validationErrors: [
// ...(field.validationErrors || []),
// ...validationErrors,
// ],
// validationPassed:
// field.validationPassed && validationPassed,
// };
// })
// );

// // Update invalid fields list
// const invalidFields = validatedFields
// .filter((f) => !f.validationPassed)
// .map((f) => f.field);

// return {
// ...parsedData,
// fields: validatedFields,
// invalidFields,
// };
// }

// /\*_
// _ Validate GST number format
// _ Format: 22AAAAA0000A1Z5
// _/
// private static validateGSTNumber(gst: string): boolean {
// const gstPattern =
// /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
// return gstPattern.test(gst);
// }

// // ========================================
// // 6. DUPLICATE DETECTION (FEATURE 1)
// // ========================================
// /\*_
// _ Check for duplicate documents
// _ Compares: invoice number, amount, date, party
// _/
// private static async checkForDuplicates(
// validatedData: ParsedDataWithConfidence,
// documentType: string,
// userId: string,
// ocrId: string
// ): Promise<DuplicateCheckResult> {
// try {
// const fields = validatedData.fields.reduce(
// (acc, field) => {
// acc[field.field] = field.value;
// return acc;
// },
// {} as Record<string, any>
// );

// // Check by invoice number (strongest indicator)
// if (fields.invoiceNo) {
// const existingOCR = await prisma.oCRData.findFirst({
// where: {
// userId,
// id: { not: ocrId },
// extractedData: {
// path: ["$.fields[?(@.field=='invoiceNo')].value"],
// string_contains: fields.invoiceNo,
// },
// },
// select: { id: true, createdAt: true },
// });

// if (existingOCR) {
// return {
// isDuplicate: true,
// duplicateOCRId: existingOCR.id,
// duplicateDate: existingOCR.createdAt,
// similarity: 0.95,
// };
// }
// }

// // Check by amount and date (weaker indicator)
// if (fields.amount && fields.date) {
// const date = new Date(fields.date);
// const dayBefore = new Date(date);
// dayBefore.setDate(dayBefore.getDate() - 1);
// const dayAfter = new Date(date);
// dayAfter.setDate(dayAfter.getDate() + 1);

// const similarAmountOCRs = await prisma.oCRData.findMany({
// where: {
// userId,
// id: { not: ocrId },
// createdAt: {
// gte: dayBefore,
// lte: dayAfter,
// },
// },
// select: { id: true, createdAt: true, extractedData: true },
// });

// for (const ocr of similarAmountOCRs) {
// const ocrData = ocr.extractedData as any;
// if (ocrData.fields && Array.isArray(ocrData.fields)) {
// const amountField = ocrData.fields.find(
// (f: any) => f.field === "amount"
// );
// if (
// amountField &&
// Math.abs(amountField.value - fields.amount) < 10
// ) {
// return {
// isDuplicate: true,
// duplicateOCRId: ocr.id,
// duplicateDate: ocr.createdAt,
// similarity: 0.8,
// };
// }
// }
// }
// }

// return { isDuplicate: false };
// } catch (error: any) {
// logger.error("Duplicate check failed", undefined, LogCategory.OCR, {
// error: error.message,
// });
// return { isDuplicate: false };
// }
// }
// }

// apps/ocr/src/services/ocrService.ts
// COMPLETE VERSION with Inventory Item Extraction for Invoices - TypeScript Errors Fixed

import { prisma } from "@repo/db/prisma";
import { logger, LogCategory } from "@repo/common-backend/logger";
import {
OCRStatus,
Prisma,
Invoice,
InvoicePayment,
SaleReceipt,
StockMovement,
PrismaClient,
} from "@repo/db";
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
// import Fuse from "fuse.js";
import { FileUploadService } from "./fileUploadService";
import sharp from "sharp";
import \* as fs from "fs";
// const Fuse = (await import("fuse.js")).default;

async function getFuse() {
const { default: Fuse } = await import("fuse.js");
return Fuse;
}

const Fuse = await getFuse();

// Initialize Google Cloud Vision client
const visionClient = new vision.ImageAnnotatorClient({
keyFilename: process.env.GOOGLE_CLOUD_KEY_PATH,
});

// ========================================
// TYPE DEFINITIONS
// ========================================

/\*\*

- Represents a single inventory item extracted from the invoice
  \*/
  interface ExtractedInvoiceItem {
  itemName: string;
  description?: string;
  quantity: number;
  price: number;
  totalAmount: number;
  confidence: number;
  matchedInventoryId?: string;
  needsReview: boolean;
  validationErrors: string[];
  }

/\*\*

- Result of fuzzy matching an item against inventory
  \*/
  interface ItemFuzzyMatchResult {
  matched: boolean;
  matchedItem: any | null;
  confidence: number;
  matchType: "exact" | "fuzzy" | "none";
  suggestions: Array<{
  item: any;
  score: number;
  }>;
  }

/\*\*

- Represents parsed invoice data with items
  \*/
  interface ProcessedInvoiceData {
  invoiceNo: string;
  partyName: string;
  partyGST?: string;
  date: string;
  amount: number;
  items: ExtractedInvoiceItem[];
  subtotal?: number;
  taxAmount?: number;
  discount?: number;
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
matchedEntity: any | null;
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

// Type for ExtractedData stored in Prisma JSON field
interface ExtractedData {
rawText: string;
fields: FieldConfidence[];
qualityCheck: ImageQualityResult;
items?: ExtractedInvoiceItem[];
message?: string;
}

// Type for ProcessedData stored in Prisma JSON field
type ProcessedData = Record<string, any>;

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
/\*\*
_ Main method to process OCR document
_/
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

            // STEP 1: Image Quality Pre-check
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
                        } as any,
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

            // STEP 2: Extract text using OCR engine
            const extractedText = await this.extractTextFromImage(imageUrl);

            // STEP 3: Parse text with field-level confidence
            const parsedData = await this.parseWithFieldConfidence(
                extractedText,
                documentType,
                userId
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

            // STEP 5: Fuzzy matching for entities
            const enhancedData = await this.enhanceWithFuzzyMatching(
                parsedData,
                documentType,
                userId
            );

            // STEP 6: Validate extracted data
            const validatedData = await this.validateExtractedData(
                enhancedData,
                documentType
            );

            // STEP 7: Check for duplicates
            const duplicateCheck = await this.checkForDuplicates(
                validatedData,
                documentType,
                userId,
                ocrId
            );

            // STEP 8: File reorganization after successful parsing
            let finalImageUrl = imageUrl;
            const fields = validatedData.fields.reduce((acc, field) => {
                acc[field.field] = field.value;
                return acc;
            }, {} as ProcessedData);

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
            const extractedData: ExtractedData = {
                rawText: extractedText,
                fields: validatedData.fields,
                qualityCheck,
                items: extractedItems,
            };

            const updatedOCR = await prisma.oCRData.update({
                where: { id: ocrId },
                data: {
                    imageUrl: finalImageUrl,
                    extractedData: extractedData as any,
                    processedData: fields as any,
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
                errorMessage: error.message,
                retryable: true,
                userId,
            });

            throw error;
        }
    }

    // ========================================
    // INVOICE ITEM EXTRACTION
    // ========================================
    private static async extractInvoiceItems(
        extractedText: string,
        parsedData: ParsedDataWithConfidence,
        userId: string
    ): Promise<ExtractedInvoiceItem[]> {
        try {
            const items: ExtractedInvoiceItem[] = [];
            const lines = extractedText.split("\n").map((line) => line.trim());

            // Find the items section
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
                    itemsSectionStart = i + 1;
                }

                // Detect end of items
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
                itemsSectionStart = 0;
            }

            logger.info("Items section identified", LogCategory.OCR, {
                startLine: itemsSectionStart,
                endLine: itemsSectionEnd,
            });

            // Parse each line in the items section
            for (let i = itemsSectionStart; i < itemsSectionEnd; i++) {
                const line = lines[i];

                if (!line || line.length < 5) continue;

                if (
                    line.toLowerCase().includes("item") ||
                    line.toLowerCase().includes("description") ||
                    line.toLowerCase().includes("continued")
                ) {
                    continue;
                }

                const item = await this.parseItemLine(line, userId);
                if (item) {
                    items.push(item);
                }
            }

            // Validate total items against invoice total
            const totalFromItems = items.reduce(
                (sum, item) => sum + item.totalAmount,
                0
            );
            const invoiceTotalField = parsedData.fields.find(
                (f) => f.field === "amount"
            );
            const invoiceTotal = invoiceTotalField?.value || 0;

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

    private static async parseItemLine(
        line: string,
        userId: string
    ): Promise<ExtractedInvoiceItem | null> {
        try {
            // Extract all numbers from the line
            const numberPattern = /\d+\.?\d*/g;
            const numbers =
                line.match(numberPattern)?.map((n) => parseFloat(n)) || [];

            if (numbers.length < 2) {
                return null;
            }

            let quantity: number;
            let price: number;
            let totalAmount: number;

            if (numbers.length === 2) {
                [quantity, price] = numbers;
                totalAmount = quantity * price;
            } else if (numbers.length >= 3) {
                const relevantNumbers = numbers.slice(-3);
                [quantity, price, totalAmount] = relevantNumbers;

                const calculatedTotal = quantity * price;
                const tolerance = calculatedTotal * 0.01;

                if (Math.abs(calculatedTotal - totalAmount) > tolerance) {
                    if (numbers.length >= 4) {
                        [, quantity, price, totalAmount] = numbers.slice(-4);
                    }
                }
            } else {
                return null;
            }

            // Extract item name
            let itemName = line
                .replace(numberPattern, "")
                .replace(/[|,\t]/g, " ")
                .trim();

            // Clean up item name - Fixed character encoding issue
            itemName = itemName
                .replace(/\s+/g, " ")
                .replace(/^[-•*]\s*/, "") // Fixed: Using proper bullet characters
                .trim();

            if (!itemName || itemName.length < 2) {
                return null;
            }

            // Basic validation
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

            // Verify calculation - Fixed multiplication symbol
            const calculatedTotal = quantity * price;
            const tolerance = Math.max(calculatedTotal * 0.02, 1);
            if (Math.abs(calculatedTotal - totalAmount) > tolerance) {
                validationErrors.push(
                    `Total mismatch: ${quantity} × ${price} = ${calculatedTotal}, but found ${totalAmount}`
                );
            }

            // Fuzzy match with existing inventory
            const matchResult = await this.fuzzyMatchInventoryItem(
                itemName,
                userId
            );

            // Calculate confidence score
            let confidence = 0.5;

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

    private static async fuzzyMatchInventoryItem(
        itemName: string,
        userId: string
    ): Promise<ItemFuzzyMatchResult> {
        try {
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

            const fuse = new Fuse(inventoryItems, {
                keys: ["name", "description", "sku"],
                threshold: 0.4,
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
            const confidence = 1 - (bestMatch.score || 0);

            let matchType: "exact" | "fuzzy" | "none" = "none";
            if (confidence >= 0.9) {
                matchType = "exact";
            } else if (confidence >= 0.6) {
                matchType = "fuzzy";
            }

            const matched = confidence >= 0.6;

            return {
                matched,
                matchedItem: matched ? bestMatch.item : null,
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

    private static calculateItemsConfidence(
        items: ExtractedInvoiceItem[]
    ): number {
        if (items.length === 0) return 1;
        const totalConfidence = items.reduce(
            (sum, item) => sum + item.confidence,
            0
        );
        return totalConfidence / items.length;
    }

    // ========================================
    // CREATE INVOICE WITH ITEMS
    // ========================================
    static async createInvoiceFromOCR(
        processedData: ProcessedInvoiceData,
        userId: string,
        ocrId: string
    ): Promise<Invoice> {
        try {
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

            const voucherId = generateInvoiceVoucherId(
                party.name,
                new Date(processedData.date)
            );

            const invoiceItems = processedData.items.map((item) => ({
                itemName: item.itemName,
                description: item.description || "",
                quantity: item.quantity,
                price: item.price,
                totalAmount: item.totalAmount,
                inventoryId: item.matchedInventoryId,
            }));

            logger.info("Creating invoice with items", LogCategory.OCR, {
                ocrId,
                partyName: party.name,
                voucherId,
                itemCount: invoiceItems.length,
                totalAmount: processedData.amount,
            });

            const invoice = await prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    const newInvoice = await tx.invoice.create({
                        data: {
                            voucherId,
                            invoiceNo: processedData.invoiceNo,
                            date: new Date(processedData.date),
                            amount: processedData.amount,
                            remainingAmount: processedData.amount,
                            partyId: party.id,
                            userId,
                            items: invoiceItems as any,
                            status: "PENDING",
                        },
                    });

                    // Update inventory stock levels for matched items
                    for (const item of processedData.items) {
                        if (item.matchedInventoryId) {
                            const previousInventory =
                                await tx.inventoryItem.findUnique({
                                    where: { id: item.matchedInventoryId },
                                    select: { currentStock: true },
                                });

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

                            await tx.stockMovement.create({
                                data: {
                                    inventoryItemId: item.matchedInventoryId,
                                    type: "IN",
                                    quantity: item.quantity,
                                    previousStock:
                                        previousInventory?.currentStock || 0,
                                    newStock:
                                        (previousInventory?.currentStock || 0) +
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

                    await tx.oCRData.update({
                        where: { id: ocrId },
                        data: { invoiceId: newInvoice.id },
                    });

                    return newInvoice;
                }
            );

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

    static async createInvoicePaymentFromOCR(
        processedData: ProcessedPaymentData,
        userId: string,
        ocrId: string
    ): Promise<InvoicePayment> {
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
    ): Promise<SaleReceipt> {
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
    // IMAGE QUALITY CHECK
    // ========================================
    private static async checkImageQuality(
        imageUrl: string
    ): Promise<ImageQualityResult> {
        try {
            let imageBuffer: Buffer;

            if (imageUrl.startsWith("http")) {
                const response = await fetch(imageUrl);
                imageBuffer = Buffer.from(await response.arrayBuffer());
            } else {
                imageBuffer = fs.readFileSync(imageUrl);
            }

            const metadata = await sharp(imageBuffer).metadata();
            const stats = await sharp(imageBuffer).stats();

            const issues: string[] = [];
            const warnings: string[] = [];
            const recommendations: string[] = [];
            let score = 100;

            // Check Resolution
            if (metadata.width && metadata.height) {
                const totalPixels = metadata.width * metadata.height;
                if (totalPixels < 500000) {
                    issues.push("Resolution too low");
                    recommendations.push(
                        "Use higher resolution image (min 1000x700)"
                    );
                    score -= 40;
                } else if (totalPixels < 1000000) {
                    warnings.push("Resolution is low, may affect accuracy");
                    score -= 15;
                }
            }

            // Check for Blur
            const avgStdDev =
                stats.channels.reduce(
                    (sum: number, ch: any) => sum + ch.std,
                    0
                ) / stats.channels.length;

            if (avgStdDev < 20) {
                issues.push("Image is too blurry");
                recommendations.push("Ensure camera is focused and stable");
                score -= 35;
            } else if (avgStdDev < 35) {
                warnings.push("Image may be slightly blurry");
                score -= 10;
            }

            // Check Lighting
            const avgMean =
                stats.channels.reduce((sum, ch) => sum + ch.mean, 0) /
                stats.channels.length;

            if (avgMean < 50) {
                warnings.push("Image is too dark");
                recommendations.push(
                    "Increase lighting or adjust camera settings"
                );
                score -= 15;
            } else if (avgMean > 220) {
                warnings.push("Image is overexposed");
                recommendations.push(
                    "Reduce lighting or adjust camera settings"
                );
                score -= 15;
            }

            // Check Compression
            const fileSize = imageBuffer.length;
            if (
                fileSize < 50000 &&
                metadata.width! * metadata.height! > 500000
            ) {
                warnings.push("Image appears heavily compressed");
                score -= 10;
            }

            const isGoodQuality = score >= 60 && issues.length === 0;

            return {
                isGoodQuality,
                score,
                issues,
                warnings,
                recommendations,
            };
        } catch (error: any) {
            logger.error(
                "Image quality check failed",
                undefined,
                LogCategory.OCR,
                {
                    error: error.message,
                }
            );

            return {
                isGoodQuality: true,
                score: 75,
                issues: [],
                warnings: ["Could not perform quality check"],
                recommendations: [],
            };
        }
    }

    // ========================================
    // TEXT EXTRACTION
    // ========================================
    private static async extractTextFromImage(
        imageUrl: string
    ): Promise<string> {
        const useGoogleVision = process.env.USE_GOOGLE_VISION === "true";

        if (useGoogleVision) {
            return this.extractWithGoogleVision(imageUrl);
        } else {
            return this.extractWithTesseract(imageUrl);
        }
    }

    private static async extractWithGoogleVision(
        imageUrl: string
    ): Promise<string> {
        try {
            const [result] = await visionClient.textDetection(imageUrl);
            const detections = result.textAnnotations;
            return detections && detections.length > 0
                ? detections[0].description || ""
                : "";
        } catch (error: any) {
            logger.error(
                "Google Vision extraction failed",
                undefined,
                LogCategory.OCR,
                {
                    error: error.message,
                }
            );
            throw new Error("Failed to extract text using Google Vision");
        }
    }

    private static async extractWithTesseract(
        imageUrl: string
    ): Promise<string> {
        try {
            const result = await Tesseract.recognize(imageUrl, "eng", {
                logger: (m) => console.log(m),
            });
            return result.data.text;
        } catch (error: any) {
            logger.error(
                "Tesseract extraction failed",
                undefined,
                LogCategory.OCR,
                {
                    error: error.message,
                }
            );
            throw new Error("Failed to extract text using Tesseract");
        }
    }

    // ========================================
    // PARSE WITH FIELD CONFIDENCE
    // ========================================
    private static async parseWithFieldConfidence(
        text: string,
        documentType: string,
        userId: string
    ): Promise<ParsedDataWithConfidence> {
        const lines = text.split("\n").filter((line) => line.trim());
        const fields: FieldConfidence[] = [];

        if (documentType === "invoice") {
            // Extract Invoice Number
            const invoiceNoPattern =
                /(?:invoice|bill|inv)[\s#:]*([A-Z0-9\-\/]+)/i;
            const invoiceMatch = text.match(invoiceNoPattern);
            fields.push({
                field: "invoiceNo",
                value: invoiceMatch ? invoiceMatch[1].trim() : null,
                confidence: invoiceMatch ? 0.95 : 0,
                needsReview: !invoiceMatch,
                validationPassed: true,
                validationErrors: invoiceMatch
                    ? []
                    : ["Invoice number not found"],
            });

            // Extract Date
            const datePattern =
                /(?:date|dated)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
            const dateMatch = text.match(datePattern);
            const parsedDate = dateMatch ? this.parseDate(dateMatch[1]) : null;
            fields.push({
                field: "date",
                value: parsedDate,
                confidence: dateMatch ? 0.9 : 0,
                needsReview: !dateMatch,
                validationPassed: true,
                validationErrors: dateMatch ? [] : ["Date not found"],
            });

            // Extract Amount - Fixed currency symbol
            const amountPattern =
                /(?:total|amount|grand total)[\s:]*(?:rs\.?|₹)?\s*([0-9,]+\.?\d*)/i;
            const amountMatch = text.match(amountPattern);
            const amount = amountMatch
                ? parseFloat(amountMatch[1].replace(/,/g, ""))
                : null;
            fields.push({
                field: "amount",
                value: amount,
                confidence: amountMatch ? 0.9 : 0,
                needsReview: !amountMatch || amount === 0,
                validationPassed: amount ? amount > 0 : false,
                validationErrors: amount ? [] : ["Amount not found or invalid"],
            });

            // Extract Party GST
            const gstPattern =
                /(?:gstin|gst)[\s:]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1})/i;
            const gstMatch = text.match(gstPattern);
            if (gstMatch) {
                fields.push({
                    field: "partyGST",
                    value: gstMatch[1].toUpperCase(),
                    confidence: 0.95,
                    needsReview: false,
                    validationPassed: true,
                    validationErrors: [],
                });
            }

            // Extract Party Name
            const partyPattern =
                /(?:from|vendor|supplier|sold by)[\s:]*([^\n]+)/i;
            const partyMatch = text.match(partyPattern);
            if (partyMatch) {
                fields.push({
                    field: "partyName",
                    value: partyMatch[1].trim(),
                    confidence: 0.85,
                    needsReview: false,
                    validationPassed: true,
                    validationErrors: [],
                });
            }
        } else if (documentType === "invoice_payment") {
            // Extract Payment Amount - Fixed currency symbol
            const amountPattern =
                /(?:amount|paid)[\s:]*(?:rs\.?|₹)?\s*([0-9,]+\.?\d*)/i;
            const amountMatch = text.match(amountPattern);
            const amount = amountMatch
                ? parseFloat(amountMatch[1].replace(/,/g, ""))
                : null;
            fields.push({
                field: "amount",
                value: amount,
                confidence: amountMatch ? 0.9 : 0,
                needsReview: !amountMatch,
                validationPassed: amount ? amount > 0 : false,
                validationErrors: amount ? [] : ["Amount not found"],
            });

            // Extract Date
            const datePattern =
                /(?:date|dated)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
            const dateMatch = text.match(datePattern);
            const parsedDate = dateMatch ? this.parseDate(dateMatch[1]) : null;
            fields.push({
                field: "date",
                value: parsedDate,
                confidence: dateMatch ? 0.9 : 0,
                needsReview: !dateMatch,
                validationPassed: true,
                validationErrors: dateMatch ? [] : ["Date not found"],
            });

            // Extract Payment Method
            const methodPattern = /(?:method|mode|via)[\s:]*([^\n]+)/i;
            const methodMatch = text.match(methodPattern);
            if (methodMatch) {
                fields.push({
                    field: "method",
                    value: methodMatch[1].trim(),
                    confidence: 0.8,
                    needsReview: false,
                    validationPassed: true,
                    validationErrors: [],
                });
            }

            // Extract Reference Number
            const refPattern =
                /(?:ref|reference|transaction)[\s#:]*([A-Z0-9]+)/i;
            const refMatch = text.match(refPattern);
            if (refMatch) {
                fields.push({
                    field: "reference",
                    value: refMatch[1].trim(),
                    confidence: 0.85,
                    needsReview: false,
                    validationPassed: true,
                    validationErrors: [],
                });
            }
        } else if (documentType === "sale_receipt") {
            // Extract Receipt Number
            const receiptPattern = /(?:receipt|rec)[\s#:]*([A-Z0-9\-\/]+)/i;
            const receiptMatch = text.match(receiptPattern);
            fields.push({
                field: "receiptNo",
                value: receiptMatch ? receiptMatch[1].trim() : null,
                confidence: receiptMatch ? 0.95 : 0,
                needsReview: !receiptMatch,
                validationPassed: true,
                validationErrors: receiptMatch
                    ? []
                    : ["Receipt number not found"],
            });

            // Extract Amount - Fixed currency symbol
            const amountPattern =
                /(?:amount|total|paid)[\s:]*(?:rs\.?|₹)?\s*([0-9,]+\.?\d*)/i;
            const amountMatch = text.match(amountPattern);
            const amount = amountMatch
                ? parseFloat(amountMatch[1].replace(/,/g, ""))
                : null;
            fields.push({
                field: "amount",
                value: amount,
                confidence: amountMatch ? 0.9 : 0,
                needsReview: !amountMatch,
                validationPassed: amount ? amount > 0 : false,
                validationErrors: amount ? [] : ["Amount not found"],
            });

            // Extract Date
            const datePattern =
                /(?:date|dated)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
            const dateMatch = text.match(datePattern);
            const parsedDate = dateMatch ? this.parseDate(dateMatch[1]) : null;
            fields.push({
                field: "date",
                value: parsedDate,
                confidence: dateMatch ? 0.9 : 0,
                needsReview: !dateMatch,
                validationPassed: true,
                validationErrors: dateMatch ? [] : ["Date not found"],
            });

            // Extract Customer Name
            const customerPattern = /(?:customer|buyer|to)[\s:]*([^\n]+)/i;
            const customerMatch = text.match(customerPattern);
            if (customerMatch) {
                fields.push({
                    field: "customerName",
                    value: customerMatch[1].trim(),
                    confidence: 0.85,
                    needsReview: false,
                    validationPassed: true,
                    validationErrors: [],
                });
            }
        }

        // Calculate overall confidence
        const totalConfidence = fields.reduce(
            (sum, f) => sum + f.confidence,
            0
        );
        const overallConfidence =
            fields.length > 0 ? totalConfidence / fields.length : 0;

        // Categorize fields
        const highConfidenceFields = fields
            .filter((f) => f.confidence >= 0.8)
            .map((f) => f.field);
        const lowConfidenceFields = fields
            .filter((f) => f.confidence < 0.8 && f.confidence > 0)
            .map((f) => f.field);
        const invalidFields = fields
            .filter((f) => !f.validationPassed)
            .map((f) => f.field);

        return {
            fields,
            overallConfidence,
            highConfidenceFields,
            lowConfidenceFields,
            invalidFields,
        };
    }

    private static parseDate(dateStr: string): string | null {
        try {
            const cleaned = dateStr.trim();
            const parts = cleaned.split(/[-\/]/);

            if (parts.length === 3) {
                let day = parseInt(parts[0]);
                let month = parseInt(parts[1]);
                let year = parseInt(parts[2]);

                if (year < 100) {
                    year = year > 50 ? 1900 + year : 2000 + year;
                }

                const date = new Date(year, month - 1, day);
                return date.toISOString();
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    // ========================================
    // FUZZY MATCHING
    // ========================================
    private static async enhanceWithFuzzyMatching(
        parsedData: ParsedDataWithConfidence,
        documentType: string,
        userId: string
    ): Promise<ParsedDataWithConfidence> {
        const enhancedFields = await Promise.all(
            parsedData.fields.map(async (field) => {
                if (field.field === "partyName" && field.value) {
                    const matchResult = await this.fuzzyMatchParty(
                        field.value,
                        userId
                    );

                    if (matchResult.matched && matchResult.matchedEntity) {
                        return {
                            ...field,
                            value: matchResult.matchedEntity.name,
                            confidence: Math.max(
                                field.confidence,
                                matchResult.confidence
                            ),
                            needsReview: matchResult.matchType === "fuzzy",
                        };
                    }
                }

                if (field.field === "customerName" && field.value) {
                    const matchResult = await this.fuzzyMatchCustomer(
                        field.value,
                        userId
                    );

                    if (matchResult.matched && matchResult.matchedEntity) {
                        return {
                            ...field,
                            value: matchResult.matchedEntity.name,
                            confidence: Math.max(
                                field.confidence,
                                matchResult.confidence
                            ),
                            needsReview: matchResult.matchType === "fuzzy",
                        };
                    }
                }

                return field;
            })
        );

        return {
            ...parsedData,
            fields: enhancedFields,
        };
    }

    private static async fuzzyMatchParty(
        partyName: string,
        userId: string
    ): Promise<FuzzyMatchResult> {
        try {
            const parties = await prisma.party.findMany({
                where: { userId },
                select: { id: true, name: true, gstNo: true },
            });

            if (parties.length === 0) {
                return {
                    matched: false,
                    matchedEntity: null,
                    confidence: 0,
                    matchType: "none",
                    suggestions: [],
                };
            }

            const fuse = new Fuse(parties, {
                keys: ["name", "gstNo"],
                threshold: 0.4,
                includeScore: true,
            });

            const results = fuse.search(partyName);

            if (results.length > 0 && results[0].score! < 0.3) {
                return {
                    matched: true,
                    matchedEntity: results[0].item,
                    confidence: 1 - results[0].score!,
                    matchType: results[0].score! < 0.1 ? "exact" : "fuzzy",
                    suggestions: results
                        .slice(1, 4)
                        .map((r) => ({ entity: r.item, score: 1 - r.score! })),
                };
            }

            return {
                matched: false,
                matchedEntity: null,
                confidence: results.length > 0 ? 1 - results[0].score! : 0,
                matchType: "none",
                suggestions: results
                    .slice(0, 3)
                    .map((r) => ({ entity: r.item, score: 1 - r.score! })),
            };
        } catch (error: any) {
            logger.error(
                "Party fuzzy matching failed",
                undefined,
                LogCategory.OCR,
                {
                    error: error.message,
                }
            );
            return {
                matched: false,
                matchedEntity: null,
                confidence: 0,
                matchType: "none",
                suggestions: [],
            };
        }
    }

    private static async fuzzyMatchCustomer(
        customerName: string,
        userId: string
    ): Promise<FuzzyMatchResult> {
        try {
            const customers = await prisma.customer.findMany({
                where: { userId },
                select: { id: true, name: true, phone: true, email: true },
            });

            if (customers.length === 0) {
                return {
                    matched: false,
                    matchedEntity: null,
                    confidence: 0,
                    matchType: "none",
                    suggestions: [],
                };
            }

            const fuse = new Fuse(customers, {
                keys: ["name", "phone", "email"],
                threshold: 0.4,
                includeScore: true,
            });

            const results = fuse.search(customerName);

            if (results.length > 0 && results[0].score! < 0.3) {
                return {
                    matched: true,
                    matchedEntity: results[0].item,
                    confidence: 1 - results[0].score!,
                    matchType: results[0].score! < 0.1 ? "exact" : "fuzzy",
                    suggestions: results
                        .slice(1, 4)
                        .map((r) => ({ entity: r.item, score: 1 - r.score! })),
                };
            }

            return {
                matched: false,
                matchedEntity: null,
                confidence: results.length > 0 ? 1 - results[0].score! : 0,
                matchType: "none",
                suggestions: results
                    .slice(0, 3)
                    .map((r) => ({ entity: r.item, score: 1 - r.score! })),
            };
        } catch (error: any) {
            logger.error(
                "Customer fuzzy matching failed",
                undefined,
                LogCategory.OCR,
                {
                    error: error.message,
                }
            );
            return {
                matched: false,
                matchedEntity: null,
                confidence: 0,
                matchType: "none",
                suggestions: [],
            };
        }
    }

    // ========================================
    // VALIDATION
    // ========================================
    private static async validateExtractedData(
        parsedData: ParsedDataWithConfidence,
        documentType: string
    ): Promise<ParsedDataWithConfidence> {
        const validatedFields = await Promise.all(
            parsedData.fields.map(async (field) => {
                const validationErrors: string[] = [];
                let validationPassed = true;

                switch (field.field) {
                    case "partyGST":
                    case "gstNumber":
                        if (field.value) {
                            const gstValid = this.validateGSTNumber(
                                field.value
                            );
                            if (!gstValid) {
                                validationErrors.push(
                                    "Invalid GST number format"
                                );
                                validationPassed = false;
                            }
                        }
                        break;

                    case "amount":
                        if (!field.value || field.value <= 0) {
                            validationErrors.push(
                                "Amount must be greater than 0"
                            );
                            validationPassed = false;
                        }
                        if (field.value && field.value > 10000000) {
                            validationErrors.push(
                                "Amount seems unusually high"
                            );
                            validationPassed = false;
                        }
                        break;

                    case "date":
                        if (field.value) {
                            const date = new Date(field.value);
                            const now = new Date();
                            const futureLimit = new Date();
                            futureLimit.setDate(futureLimit.getDate() + 30);

                            if (date > futureLimit) {
                                validationErrors.push(
                                    "Date is too far in the future"
                                );
                                validationPassed = false;
                            }

                            const pastLimit = new Date();
                            pastLimit.setFullYear(pastLimit.getFullYear() - 5);
                            if (date < pastLimit) {
                                validationErrors.push(
                                    "Date is too far in the past"
                                );
                                validationPassed = false;
                            }
                        }
                        break;

                    case "invoiceNo":
                    case "receiptNo":
                        if (!field.value) {
                            validationErrors.push("Required field is missing");
                            validationPassed = false;
                        }
                        break;
                }

                return {
                    ...field,
                    validationErrors: [
                        ...(field.validationErrors || []),
                        ...validationErrors,
                    ],
                    validationPassed:
                        field.validationPassed && validationPassed,
                };
            })
        );

        const invalidFields = validatedFields
            .filter((f) => !f.validationPassed)
            .map((f) => f.field);

        return {
            ...parsedData,
            fields: validatedFields,
            invalidFields,
        };
    }

    private static validateGSTNumber(gst: string): boolean {
        const gstPattern =
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
        return gstPattern.test(gst);
    }

    // ========================================
    // DUPLICATE DETECTION
    // ========================================
    private static async checkForDuplicates(
        validatedData: ParsedDataWithConfidence,
        documentType: string,
        userId: string,
        ocrId: string
    ): Promise<DuplicateCheckResult> {
        try {
            const fields = validatedData.fields.reduce((acc, field) => {
                acc[field.field] = field.value;
                return acc;
            }, {} as ProcessedData);

            if (fields.invoiceNo) {
                const existingOCR = await prisma.oCRData.findFirst({
                    where: {
                        userId,
                        id: { not: ocrId },
                        extractedData: {
                            path: ["$.fields[?(@.field=='invoiceNo')].value"],
                            string_contains: fields.invoiceNo,
                        },
                    },
                    select: { id: true, createdAt: true },
                });

                if (existingOCR) {
                    return {
                        isDuplicate: true,
                        duplicateOCRId: existingOCR.id,
                        duplicateDate: existingOCR.createdAt,
                        similarity: 0.95,
                    };
                }
            }

            if (fields.amount && fields.date) {
                const date = new Date(fields.date);
                const dayBefore = new Date(date);
                dayBefore.setDate(dayBefore.getDate() - 1);
                const dayAfter = new Date(date);
                dayAfter.setDate(dayAfter.getDate() + 1);

                const similarAmountOCRs = await prisma.oCRData.findMany({
                    where: {
                        userId,
                        id: { not: ocrId },
                        createdAt: {
                            gte: dayBefore,
                            lte: dayAfter,
                        },
                    },
                    select: { id: true, createdAt: true, extractedData: true },
                });

                for (const ocr of similarAmountOCRs) {
                    const ocrData = ocr.extractedData as any;
                    if (ocrData?.fields && Array.isArray(ocrData.fields)) {
                        const amountField = ocrData.fields.find(
                            (f: any) => f.field === "amount"
                        );
                        if (
                            amountField &&
                            Math.abs(amountField.value - fields.amount) < 10
                        ) {
                            return {
                                isDuplicate: true,
                                duplicateOCRId: ocr.id,
                                duplicateDate: ocr.createdAt,
                                similarity: 0.8,
                            };
                        }
                    }
                }
            }

            return { isDuplicate: false };
        } catch (error: any) {
            logger.error("Duplicate check failed", undefined, LogCategory.OCR, {
                error: error.message,
            });
            return { isDuplicate: false };
        }
    }

}

```
