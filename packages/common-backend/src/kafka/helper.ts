// packages/common-backend/src/kafka/helpers.ts
import { kafkaWrapper } from "./kafka-wrapper";
import { logger, LogCategory } from "../logger";

/**
 * Connect to Kafka broker
 * Creates producer, admin client, and initializes topics
 */
export async function connectKafka(): Promise<void> {
    try {
        await kafkaWrapper.connect();
        logger.info("Kafka connection established", LogCategory.SYSTEM, {
            clientId: process.env.KAFKA_CLIENT_ID,
            brokers: process.env.KAFKA_BROKERS,
        });
    } catch (error) {
        logger.error(
            "Failed to connect to Kafka",
            error as Error,
            LogCategory.SYSTEM
        );
        throw error;
    }
}

/**
 * Disconnect from Kafka broker
 * Closes all producers, consumers, and admin clients
 */
export async function disconnectKafka(): Promise<void> {
    try {
        await kafkaWrapper.disconnect();
        logger.info("Kafka disconnected successfully", LogCategory.SYSTEM);
    } catch (error) {
        logger.error(
            "Error disconnecting from Kafka",
            error as Error,
            LogCategory.SYSTEM
        );
        throw error;
    }
}

/**
 * Get Kafka producer instance
 * Throws error if not connected
 */
export function getKafkaProducer() {
    return kafkaWrapper.producer;
}

/**
 * Get Kafka admin client instance
 * Throws error if not connected
 */
export function getKafkaAdmin() {
    return kafkaWrapper.admin;
}

/**
 * Create a new Kafka consumer with the given group ID
 */
export function createKafkaConsumer(groupId: string) {
    return kafkaWrapper.createConsumer(groupId);
}

/**
 * Check if Kafka is connected
 */
export function isKafkaConnected(): boolean {
    try {
        kafkaWrapper.producer;
        return true;
    } catch {
        return false;
    }
}
