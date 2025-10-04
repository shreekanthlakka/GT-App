// packages/common-backend/src/kafka/kafka-wrapper.ts
import { Kafka, Producer, Consumer, Admin } from "kafkajs";
import {
    kafkaConfig,
    producerConfig,
    consumerConfig,
    topicConfigs,
} from "./config";

class KafkaWrapper {
    private _client?: Kafka;
    private _producer?: Producer;
    private _admin?: Admin;
    private _consumers: Map<string, Consumer> = new Map();

    get client() {
        if (!this._client) {
            throw new Error("Must connect to Kafka first");
        }
        return this._client;
    }

    get producer() {
        if (!this._producer) {
            throw new Error("Must connect to Kafka first");
        }
        return this._producer;
    }

    get admin() {
        if (!this._admin) {
            throw new Error("Must connect to Kafka first");
        }
        return this._admin;
    }

    async connect(): Promise<void> {
        try {
            this._client = new Kafka(kafkaConfig);
            this._producer = this._client.producer(producerConfig);
            this._admin = this._client.admin();

            await Promise.all([
                this._producer.connect(),
                this._admin.connect(),
            ]);

            await this.createTopics();
            console.log("Connected to Kafka successfully");
        } catch (error) {
            console.error("Failed to connect to Kafka:", error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            const disconnectPromises: Promise<void>[] = [];

            if (this._producer) {
                disconnectPromises.push(this._producer.disconnect());
            }

            if (this._admin) {
                disconnectPromises.push(this._admin.disconnect());
            }

            for (const consumer of this._consumers.values()) {
                disconnectPromises.push(consumer.disconnect());
            }

            await Promise.all(disconnectPromises);

            this._client = undefined;
            this._producer = undefined;
            this._admin = undefined;
            this._consumers.clear();

            console.log("Disconnected from Kafka");
        } catch (error) {
            console.error("Error disconnecting from Kafka:", error);
            throw error;
        }
    }

    createConsumer(groupId: string): Consumer {
        if (!this._client) {
            throw new Error("Must connect to Kafka first");
        }

        if (this._consumers.has(groupId)) {
            return this._consumers.get(groupId)!;
        }

        const consumer = this._client.consumer({
            ...consumerConfig,
            groupId,
        });

        this._consumers.set(groupId, consumer);
        return consumer;
    }

    private async createTopics(): Promise<void> {
        try {
            const existingTopics = await this._admin!.listTopics();
            const topicsToCreate = topicConfigs.filter(
                (config) => !existingTopics.includes(config.topic)
            );

            if (topicsToCreate.length > 0) {
                await this._admin!.createTopics({
                    topics: topicsToCreate.map((config) => ({
                        topic: config.topic,
                        numPartitions: config.partitions,
                        replicationFactor: config.replicationFactor,
                        configEntries: [
                            { name: "cleanup.policy", value: "delete" },
                            { name: "retention.ms", value: "604800000" }, // 7 days
                            { name: "compression.type", value: "snappy" },
                        ],
                    })),
                });

                console.log(
                    "Created Kafka topics:",
                    topicsToCreate.map((t) => t.topic)
                );
            }
        } catch (error) {
            console.error("Error creating Kafka topics:", error);
            throw error;
        }
    }
}

export const kafkaWrapper = new KafkaWrapper();
