// packages/common-backend/src/kafka/base-publisher.ts
import { Producer, Message } from "kafkajs";
import { BaseEvent, KafkaMessage } from "../events/interfaces/base-interfaces";
import { v4 as uuidv4 } from "uuid";

export abstract class KafkaPublisher<T extends BaseEvent> {
    abstract subject: T["subject"];
    abstract topic: string;
    protected producer: Producer;

    constructor(producer: Producer) {
        this.producer = producer;
    }

    async publish(
        data: T["data"],
        userId?: string,
        correlationId?: string
    ): Promise<void> {
        const message: KafkaMessage<T> = {
            subject: this.subject,
            data,
            timestamp: new Date().toISOString(),
            eventId: uuidv4(),
            version: "1.0",
            userId,
            correlationId: correlationId || uuidv4(),
        };

        const kafkaMessage: Message = {
            key: this.generateMessageKey(data),
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
            headers: {
                "event-type": this.subject,
                "event-id": message.eventId,
                "correlation-id": message.correlationId,
                "user-id": userId || "",
            },
        };

        try {
            const result = await this.producer.send({
                topic: this.topic,
                messages: [kafkaMessage],
            });

            if (result && result.length > 0) {
                const { partition, baseOffset } = result[0]!;
                console.log(`Event published to topic ${this.topic}:`, {
                    subject: this.subject,
                    eventId: message.eventId,
                    partition,
                    offset: baseOffset,
                });
            } else {
                // Fallback logging if no metadata returned
                console.log(`Event published to topic ${this.topic}:`, {
                    subject: this.subject,
                    eventId: message.eventId,
                    status: "sent but no metadata returned",
                });
            }
        } catch (error) {
            console.error(
                `Failed to publish event to topic ${this.topic}:`,
                error
            );
            throw error;
        }
    }

    // Enhanced message key generation with better fallback logic
    protected generateMessageKey(data: T["data"]): string {
        // Try to find the most appropriate ID for partitioning

        // 1. Try entity-specific IDs first
        if ("customerId" in data && data.customerId) {
            return data.customerId;
        }
        if ("partyId" in data && data.partyId) {
            return data.partyId;
        }
        if ("userId" in data && data.userId) {
            return data.userId;
        }

        // 2. Try the main entity ID
        if ("id" in data && data.id) {
            return data.id;
        }

        // 3. Try action performer IDs
        if ("createdBy" in data && data.createdBy) {
            return data.createdBy;
        }
        if ("updatedBy" in data && data.updatedBy) {
            return data.updatedBy;
        }
        if ("deletedBy" in data && data.deletedBy) {
            return data.deletedBy;
        }

        // 4. Try related entity IDs
        if ("relatedTo" in data && data.relatedTo && data.relatedTo.id) {
            return data.relatedTo.id;
        }
        if ("account" in data && data.account && data.account.id) {
            return data.account.id;
        }

        // 5. Try other identifying fields
        if ("email" in data && data.email) {
            return data.email;
        }
        if ("sessionId" in data && data.sessionId) {
            return data.sessionId;
        }

        // 6. Fallback to random partitioning
        return Math.random().toString(36).substring(7);
    }
}

// ========================================
// MESSAGE KEY STRATEGY EXPLANATION
// ========================================

/*
MESSAGE KEY SELECTION STRATEGY:

1. **Entity-Specific Events**: Use the entity ID
   - Customer events → customerId
   - Party events → partyId
   - User events → id (user's own ID)

2. **Action-Based Events**: Use the actor ID
   - Creation events → createdBy
   - Update events → updatedBy
   - Delete events → deletedBy

3. **Relationship Events**: Use the most relevant entity
   - Payment events → customerId or partyId (who paid)
   - Ledger events → account holder ID
   - Sale events → customerId

4. **Session/Auth Events**: Use userId or sessionId
   - Login events → userId
   - Session events → userId
   - Failed login → email (no userId available)

5. **Alert/System Events**: Use most relevant context
   - Security alerts → userId or ipAddress
   - System events → service name or config key

BENEFITS OF PROPER MESSAGE KEYS:
- Ensures related events go to same partition
- Maintains event ordering for same entity
- Better consumer scalability
- Improved cache locality
- Easier debugging and monitoring
*/
