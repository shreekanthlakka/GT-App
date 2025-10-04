// packages/common-backend/src/kafka/base-consumer.ts
import { Consumer, EachMessagePayload, KafkaMessage } from "kafkajs";
import {
    BaseEvent,
    KafkaMessage as CustomKafkaMessage,
} from "../events/interfaces/base-interfaces";

export abstract class KafkaConsumer<T extends BaseEvent> {
    abstract subject: T["subject"];
    abstract queueGroupName: string;
    protected consumer: Consumer;

    constructor(consumer: Consumer) {
        this.consumer = consumer;
    }

    abstract onMessage(
        data: T["data"],
        message: CustomKafkaMessage<T>
    ): Promise<void>;

    async listen(topics: string[]): Promise<void> {
        await this.consumer.connect();
        await this.consumer.subscribe({
            topics,
            fromBeginning: false,
        });

        await this.consumer.run({
            eachMessage: async (payload: EachMessagePayload) => {
                await this.parseMessage(payload);
            },
        });
    }

    private async parseMessage(payload: EachMessagePayload): Promise<void> {
        try {
            const { message, topic, partition } = payload;

            if (!message.value) {
                console.warn("Received message with no value");
                return;
            }

            const parsedMessage = JSON.parse(
                message.value.toString()
            ) as CustomKafkaMessage<T>;

            if (parsedMessage.subject !== this.subject) {
                return; // Skip messages not for this consumer
            }

            console.log(
                `Processing message from topic ${topic}, partition ${partition}:`,
                {
                    subject: parsedMessage.subject,
                    eventId: parsedMessage.eventId,
                    offset: message.offset,
                }
            );

            await this.onMessage(parsedMessage.data, parsedMessage);
        } catch (error) {
            console.error("Error processing message:", error);
            throw error;
        }
    }
}
