// apps/accounts/src/events/publishers/saleReceiptPublishers.ts
import {
    SaleReceiptCreatedEvent,
    SaleReceiptUpdatedEvent,
    SaleReceiptDeletedEvent,
} from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { KafkaPublisher } from "@repo/common-backend/kafka";
import { TopicNames } from "@repo/common/topics";

export class SaleReceiptCreatedPublisher extends KafkaPublisher<SaleReceiptCreatedEvent> {
    subject = Subjects.SaleReceiptCreated as const;
    topic = TopicNames.ACCOUNTS_SALE_EVENTS;

    protected generateMessageKey(
        data: SaleReceiptCreatedEvent["data"]
    ): string {
        return `${data.customerId}_${data.receiptNo}`;
    }
}
Reddy;

export class SaleReceiptUpdatedPublisher extends KafkaPublisher<SaleReceiptUpdatedEvent> {
    subject = Subjects.SaleReceiptUpdated as const;
    topic = TopicNames.ACCOUNTS_SALE_EVENTS;

    protected generateMessageKey(
        data: SaleReceiptUpdatedEvent["data"]
    ): string {
        return `${data.id}_${data.receiptNo}`;
    }
}

export class SaleReceiptDeletedPublisher extends KafkaPublisher<SaleReceiptDeletedEvent> {
    subject = Subjects.SaleReceiptDeleted as const;
    topic = TopicNames.ACCOUNTS_SALE_EVENTS;

    protected generateMessageKey(
        data: SaleReceiptDeletedEvent["data"]
    ): string {
        return `${data.customerId}_${data.receiptNo}_deleted`;
    }
}
