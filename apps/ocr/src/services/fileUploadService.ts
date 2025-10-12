// apps/ocr/src/services/fileUploadService.ts
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { logger, LogCategory } from "@repo/common-backend/logger";
import { CustomError } from "@repo/common-backend/utils";
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

// Initialize S3 client (optional - for cloud storage)
const s3Client = process.env.AWS_S3_BUCKET
    ? new S3Client({
          region: process.env.AWS_REGION || "ap-south-1",
          credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
          },
      })
    : null;

export class FileUploadService {
    private static UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
    private static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static ALLOWED_TYPES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
    ];

    /**
     * Upload file to local storage with organized structure
     * Format: Invoices/party-name/year/month/INV-RAJLAX-07-10-25.jpeg
     */
    static async uploadFile(
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
    ): Promise<string> {
        try {
            // Validate file
            this.validateFile(file);

            // Upload to local storage (S3 disabled for now)
            return await this.uploadToLocalWithStructure(
                file,
                userId,
                documentType,
                metadata
            );
        } catch (error: any) {
            logger.error("File upload failed", undefined, LogCategory.OCR, {
                error: error.message,
                userId,
            });
            throw error;
        }
    }

    /**
     * Validate uploaded file
     */
    private static validateFile(file: Express.Multer.File) {
        // Check file size
        if (file.size > this.MAX_FILE_SIZE) {
            throw new CustomError(400, "File size exceeds 10MB limit");
        }

        // Check file type
        if (!this.ALLOWED_TYPES.includes(file.mimetype)) {
            throw new CustomError(
                400,
                "Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed"
            );
        }
    }

    /**
     * Generate filename based on document type and metadata
     * Format: INV-RAJLAX-07-10-25.jpeg or REC-CUSTOMER-07-10-25.jpeg
     */
    private static generateFilename(
        file: Express.Multer.File,
        documentType: string,
        metadata?: {
            invoiceNo?: string;
            receiptNo?: string;
            date?: Date;
        }
    ): string {
        const ext = path.extname(file.originalname);
        const date = metadata?.date || new Date();

        // Format: DD-MM-YY
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = String(date.getFullYear()).slice(-2);
        const dateStr = `${day}-${month}-${year}`;

        let filename: string;

        if (documentType === "invoice" && metadata?.invoiceNo) {
            // Clean invoice number: remove special chars except hyphen
            const cleanInvoiceNo = metadata.invoiceNo
                .replace(/[^a-zA-Z0-9-]/g, "-")
                .replace(/-+/g, "-")
                .toUpperCase();
            filename = `${cleanInvoiceNo}-${dateStr}${ext}`;
        } else if (
            (documentType === "sale_receipt" ||
                documentType === "invoice_payment") &&
            metadata?.receiptNo
        ) {
            const cleanReceiptNo = metadata.receiptNo
                .replace(/[^a-zA-Z0-9-]/g, "-")
                .replace(/-+/g, "-")
                .toUpperCase();
            filename = `${cleanReceiptNo}-${dateStr}${ext}`;
        } else {
            // Fallback: use timestamp
            const timestamp = Date.now();
            filename = `${documentType.toUpperCase()}-${timestamp}-${dateStr}${ext}`;
        }

        return filename;
    }

    /**
     * Sanitize party/customer name for folder structure
     */
    private static sanitizeName(name: string): string {
        return name
            .trim()
            .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special chars
            .replace(/\s+/g, "-") // Replace spaces with hyphen
            .replace(/-+/g, "-") // Remove multiple hyphens
            .toUpperCase()
            .substring(0, 50); // Limit length
    }

    /**
     * Upload file to local storage with organized structure
     * Structure:
     * - Invoices/{party-name}/{year}/{month}/{filename}
     * - Payments/{party-name}/{year}/{month}/{filename}
     * - Receipts/{customer-name}/{year}/{month}/{filename}
     */
    private static async uploadToLocalWithStructure(
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
    ): Promise<string> {
        const date = metadata?.date || new Date();
        const year = String(date.getFullYear());
        const month = String(date.getMonth() + 1).padStart(2, "0");

        // Determine base folder and entity name
        let baseFolder: string;
        let entityName: string;

        switch (documentType) {
            case "invoice":
                baseFolder = "Invoices";
                entityName = metadata?.partyName
                    ? this.sanitizeName(metadata.partyName)
                    : "UNKNOWN-PARTY";
                break;

            case "invoice_payment":
                baseFolder = "Payments";
                entityName = metadata?.partyName
                    ? this.sanitizeName(metadata.partyName)
                    : "UNKNOWN-PARTY";
                break;

            case "sale_receipt":
                baseFolder = "Receipts";
                entityName = metadata?.customerName
                    ? this.sanitizeName(metadata.customerName)
                    : "UNKNOWN-CUSTOMER";
                break;

            default:
                baseFolder = "Others";
                entityName = "MISC";
        }

        // Build directory structure: uploads/Invoices/RAJLAX-TEXTILES/2025/10/
        const uploadPath = path.join(
            this.UPLOAD_DIR,
            baseFolder,
            entityName,
            year,
            month
        );

        // Ensure directory exists
        await mkdir(uploadPath, { recursive: true });

        // Generate filename
        const filename = this.generateFilename(file, documentType, metadata);

        // Full file path
        const filePath = path.join(uploadPath, filename);

        // Check if file already exists, if so add counter
        let finalPath = filePath;
        let counter = 1;
        while (fs.existsSync(finalPath)) {
            const ext = path.extname(filename);
            const nameWithoutExt = filename.replace(ext, "");
            finalPath = path.join(
                uploadPath,
                `${nameWithoutExt}-${counter}${ext}`
            );
            counter++;
        }

        // Write file
        await writeFile(finalPath, file.buffer);

        logger.info("File uploaded to local storage", LogCategory.OCR, {
            filePath: finalPath,
            fileSize: file.size,
            documentType,
            entityName,
        });

        // Return relative path from UPLOAD_DIR
        return finalPath;
    }

    /**
     * Upload file to AWS S3 (kept for future use)
     */
    private static async uploadToS3(
        file: Express.Multer.File,
        filename: string
    ): Promise<string> {
        if (!s3Client || !process.env.AWS_S3_BUCKET) {
            throw new CustomError(500, "S3 not configured");
        }

        const key = `ocr-documents/${filename}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            Metadata: {
                originalName: file.originalname,
                uploadDate: new Date().toISOString(),
            },
        });

        await s3Client.send(command);

        logger.info("File uploaded to S3", LogCategory.OCR, {
            bucket: process.env.AWS_S3_BUCKET,
            key,
            fileSize: file.size,
        });

        return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    /**
     * Delete file from storage
     */
    static async deleteFile(fileUrl: string): Promise<void> {
        try {
            if (fileUrl.startsWith("https://") && s3Client) {
                await this.deleteFromS3(fileUrl);
            } else {
                await this.deleteFromLocal(fileUrl);
            }

            logger.info("File deleted successfully", LogCategory.OCR, {
                fileUrl,
            });
        } catch (error: any) {
            logger.error("File deletion failed", undefined, LogCategory.OCR, {
                fileUrl,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Delete file from local storage
     */
    private static async deleteFromLocal(filePath: string): Promise<void> {
        if (fs.existsSync(filePath)) {
            await unlink(filePath);
        }
    }

    /**
     * Delete file from S3
     */
    private static async deleteFromS3(fileUrl: string): Promise<void> {
        if (!s3Client || !process.env.AWS_S3_BUCKET) {
            throw new CustomError(500, "S3 not configured");
        }

        const urlParts = fileUrl.split(".amazonaws.com/");
        const key = urlParts.length > 1 ? urlParts[1] : "";

        if (!key) {
            throw new CustomError(400, "Invalid S3 URL");
        }

        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
        });

        await s3Client.send(command);
    }

    /**
     * Get file info
     */
    static getFileInfo(filePath: string): {
        exists: boolean;
        size?: number;
        createdAt?: Date;
    } {
        try {
            if (!fs.existsSync(filePath)) {
                return { exists: false };
            }

            const stats = fs.statSync(filePath);
            return {
                exists: true,
                size: stats.size,
                createdAt: stats.birthtime,
            };
        } catch (error) {
            return { exists: false };
        }
    }

    /**
     * Update file path after OCR processing (when party/customer name is extracted)
     * Moves file from temporary location to proper organized structure
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
    ): Promise<string> {
        try {
            if (!fs.existsSync(currentPath)) {
                throw new CustomError(404, "File not found");
            }

            const date = metadata.date || new Date();
            const year = String(date.getFullYear());
            const month = String(date.getMonth() + 1).padStart(2, "0");

            // Determine new location
            let baseFolder: string;
            let entityName: string;

            switch (documentType) {
                case "invoice":
                    baseFolder = "Invoices";
                    entityName = metadata.partyName
                        ? this.sanitizeName(metadata.partyName)
                        : "UNKNOWN-PARTY";
                    break;

                case "invoice_payment":
                    baseFolder = "Payments";
                    entityName = metadata.partyName
                        ? this.sanitizeName(metadata.partyName)
                        : "UNKNOWN-PARTY";
                    break;

                case "sale_receipt":
                    baseFolder = "Receipts";
                    entityName = metadata.customerName
                        ? this.sanitizeName(metadata.customerName)
                        : "UNKNOWN-CUSTOMER";
                    break;

                default:
                    return currentPath; // Don't move if unknown type
            }

            const newDir = path.join(
                this.UPLOAD_DIR,
                baseFolder,
                entityName,
                year,
                month
            );

            // Create directory
            await mkdir(newDir, { recursive: true });

            // Generate proper filename
            const ext = path.extname(currentPath);
            let filename: string;

            if (documentType === "invoice" && metadata.invoiceNo) {
                const cleanInvoiceNo = metadata.invoiceNo
                    .replace(/[^a-zA-Z0-9-]/g, "-")
                    .replace(/-+/g, "-")
                    .toUpperCase();
                const day = String(date.getDate()).padStart(2, "0");
                const monthStr = String(date.getMonth() + 1).padStart(2, "0");
                const yearStr = String(date.getFullYear()).slice(-2);
                filename = `${cleanInvoiceNo}-${day}-${monthStr}-${yearStr}${ext}`;
            } else if (metadata.receiptNo) {
                const cleanReceiptNo = metadata.receiptNo
                    .replace(/[^a-zA-Z0-9-]/g, "-")
                    .replace(/-+/g, "-")
                    .toUpperCase();
                const day = String(date.getDate()).padStart(2, "0");
                const monthStr = String(date.getMonth() + 1).padStart(2, "0");
                const yearStr = String(date.getFullYear()).slice(-2);
                filename = `${cleanReceiptNo}-${day}-${monthStr}-${yearStr}${ext}`;
            } else {
                filename = path.basename(currentPath);
            }

            const newPath = path.join(newDir, filename);

            // Handle duplicate filenames
            let finalPath = newPath;
            let counter = 1;
            while (fs.existsSync(finalPath)) {
                const extName = path.extname(filename);
                const nameWithoutExt = filename.replace(extName, "");
                finalPath = path.join(
                    newDir,
                    `${nameWithoutExt}-${counter}${extName}`
                );
                counter++;
            }

            // Move file
            fs.renameSync(currentPath, finalPath);

            logger.info("File moved to organized structure", LogCategory.OCR, {
                from: currentPath,
                to: finalPath,
                entityName,
            });

            return finalPath;
        } catch (error: any) {
            logger.error(
                "Failed to move file to organized structure",
                undefined,
                LogCategory.OCR,
                {
                    currentPath,
                    error: error.message,
                }
            );
            // Return original path if move fails
            return currentPath;
        }
    }
}
