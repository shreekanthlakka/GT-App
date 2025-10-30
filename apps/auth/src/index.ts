import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import { connectKafka, disconnectKafka } from "@repo/common-backend/kafka";
import { LogCategory, logger } from "@repo/common-backend/logger";

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        // Connect to Kafka
        await connectKafka();
        logger.info("Kafka connected successfully", LogCategory.SYSTEM);

        // Start Express server
        app.listen(PORT, () => {
            logger.info(
                `Auth service running on port ${PORT}`,
                LogCategory.SYSTEM,
                {
                    port: PORT,
                    nodeEnv: process.env.NODE_ENV,
                }
            );
        });
    } catch (error) {
        logger.error(
            "Failed to start Auth service",
            error as Error,
            LogCategory.SYSTEM
        );
        process.exit(1);
    }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
    logger.info(
        "SIGTERM received, shutting down gracefully",
        LogCategory.SYSTEM
    );
    await disconnectKafka();
    process.exit(0);
});

process.on("SIGINT", async () => {
    logger.info(
        "SIGINT received, shutting down gracefully",
        LogCategory.SYSTEM
    );
    await disconnectKafka();
    process.exit(0);
});
startServer();
