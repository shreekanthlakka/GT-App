// packages/common-backend/src/events/interfaces/base-interfaces.ts

import { Subjects } from "@repo/common/subjects";

// Base event interface
export interface BaseEvent {
    subject: Subjects;
    data: any;
}

// Kafka message wrapper
export interface KafkaMessage<T extends BaseEvent> {
    subject: T["subject"];
    data: T["data"];
    timestamp: string;
    eventId: string;
    version: string;
    userId?: string;
    correlationId?: string;
}
