// apps/ocr/src/index.ts
import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectKafka, disconnectKafka } from "@repo/common-backend/kafka";
import { LogCategory, logger } from "@repo/common-backend/logger";
import * as fs from "fs";
import * as path from "path";

const PORT = process.env.PORT || 3005;
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

async function startServer() {
    try {
        // Create upload directories if they don't exist
        const uploadDirs = [
            UPLOAD_DIR,
            path.join(UPLOAD_DIR, "temp"),
            path.join(UPLOAD_DIR, "invoices"),
            path.join(UPLOAD_DIR, "payments"),
            path.join(UPLOAD_DIR, "receipts"),
            path.join(UPLOAD_DIR, "processed"),
        ];

        for (const dir of uploadDirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                logger.info(
                    `Created upload directory: ${dir}`,
                    LogCategory.SYSTEM
                );
            }
        }

        // Connect to Kafka
        await connectKafka();
        logger.info("Kafka connected successfully", LogCategory.SYSTEM);

        // TODO: Initialize OCR event consumers here
        // Example:
        // const ocrJobCreatedConsumer = new OCRJobCreatedConsumer();
        // await ocrJobCreatedConsumer.listen();

        // Start Express server
        app.listen(PORT, () => {
            logger.info(
                `OCR service running on port ${PORT}`,
                LogCategory.SYSTEM,
                {
                    port: PORT,
                    nodeEnv: process.env.NODE_ENV,
                    uploadDir: UPLOAD_DIR,
                    ocrEngine:
                        process.env.USE_GOOGLE_VISION === "true"
                            ? "Google Vision API"
                            : "Tesseract.js",
                }
            );
        });
    } catch (error) {
        logger.error(
            "Failed to start OCR service",
            error as Error,
            LogCategory.SYSTEM
        );
        process.exit(1);
    }
}

// ========================================
// GRACEFUL SHUTDOWN HANDLERS
// ========================================

process.on("SIGTERM", async () => {
    logger.info(
        "SIGTERM received, shutting down gracefully",
        LogCategory.SYSTEM
    );

    try {
        await disconnectKafka();
        logger.info("Kafka disconnected successfully", LogCategory.SYSTEM);
    } catch (error) {
        logger.error(
            "Error during Kafka disconnection",
            error as Error,
            LogCategory.SYSTEM
        );
    }

    process.exit(0);
});

process.on("SIGINT", async () => {
    logger.info(
        "SIGINT received, shutting down gracefully",
        LogCategory.SYSTEM
    );

    try {
        await disconnectKafka();
        logger.info("Kafka disconnected successfully", LogCategory.SYSTEM);
    } catch (error) {
        logger.error(
            "Error during Kafka disconnection",
            error as Error,
            LogCategory.SYSTEM
        );
    }

    process.exit(0);
});

// ========================================
// UNCAUGHT EXCEPTION HANDLER
// ========================================

process.on("uncaughtException", (error: Error) => {
    logger.error(
        "Uncaught Exception - shutting down",
        error,
        LogCategory.SYSTEM
    );
    process.exit(1);
});

// ========================================
// UNHANDLED REJECTION HANDLER
// ========================================

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    logger.error("Unhandled Rejection", new Error(reason), LogCategory.SYSTEM, {
        promise: promise.toString(),
    });
    process.exit(1);
});

// ========================================
// START SERVER
// ========================================

startServer();
