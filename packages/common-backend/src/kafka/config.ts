// packages/common-backend/src/kafka/config.ts
import { KafkaConfig, ProducerConfig, ConsumerConfig } from "kafkajs";

export const kafkaConfig: KafkaConfig = {
    clientId: process.env.KAFKA_CLIENT_ID || "gangadhara-textiles",
    brokers: process.env.KAFKA_BROKERS?.split(",") || ["localhost:9092"],
    connectionTimeout: 3000,
    authenticationTimeout: 1000,
    reauthenticationThreshold: 10000,
    ssl:
        process.env.KAFKA_SSL === "true"
            ? {
                  rejectUnauthorized: false,
              }
            : false,
    sasl: process.env.KAFKA_SASL_MECHANISM
        ? {
              mechanism: process.env.KAFKA_SASL_MECHANISM as any,
              username: process.env.KAFKA_SASL_USERNAME!,
              password: process.env.KAFKA_SASL_PASSWORD!,
          }
        : undefined,
    retry: {
        initialRetryTime: 100,
        retries: 8,
    },
};

export const producerConfig: ProducerConfig = {
    maxInFlightRequests: 1,
    idempotent: true,
    transactionTimeout: 30000,
    retry: {
        retries: 5,
        initialRetryTime: 300,
    },
};

export const consumerConfig: ConsumerConfig = {
    groupId: process.env.KAFKA_CONSUMER_GROUP || "default-group",
    sessionTimeout: 30000,
    rebalanceTimeout: 60000,
    heartbeatInterval: 3000,
    maxBytesPerPartition: 1048576,
    minBytes: 1,
    maxBytes: 10485760,
    maxWaitTimeInMs: 5000,
    retry: {
        retries: 10,
        initialRetryTime: 300,
    },
};

// Topic configurations
export const topicConfigs = [
    {
        topic: "auth-events",
        partitions: 3,
        replicationFactor: 1,
    },
    {
        topic: "customer-events",
        partitions: 3,
        replicationFactor: 1,
    },
    {
        topic: "party-events",
        partitions: 3,
        replicationFactor: 1,
    },
    {
        topic: "product-events",
        partitions: 3,
        replicationFactor: 1,
    },
    {
        topic: "sale-events",
        partitions: 3,
        replicationFactor: 1,
    },
    {
        topic: "invoice-events",
        partitions: 3,
        replicationFactor: 1,
    },
    {
        topic: "payment-events",
        partitions: 3,
        replicationFactor: 1,
    },
    {
        topic: "notification-events",
        partitions: 3,
        replicationFactor: 1,
    },
    {
        topic: "ocr-events",
        partitions: 2,
        replicationFactor: 1,
    },
    {
        topic: "system-events",
        partitions: 2,
        replicationFactor: 1,
    },
];
