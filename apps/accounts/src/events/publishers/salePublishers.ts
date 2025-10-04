// apps/accounts/src/events/publishers/salePublishers.ts
import {
    SaleCreatedEvent,
    SaleUpdatedEvent,
    SaleCancelledEvent,
    SalePaidEvent,
    SaleOverdueEvent,
} from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { KafkaPublisher } from "@repo/common-backend/kafka";
import { TopicNames } from "@repo/common/topics";

export class SaleCreatedPublisher extends KafkaPublisher<SaleCreatedEvent> {
    subject = Subjects.SaleCreated as const;
    topic = TopicNames.ACCOUNTS_SALE_EVENTS;

    protected generateMessageKey(data: SaleCreatedEvent["data"]): string {
        return `${data.customerId}_${data.saleNo}`;
    }
}

export class SaleUpdatedPublisher extends KafkaPublisher<SaleUpdatedEvent> {
    subject = Subjects.SaleUpdated as const;
    topic = TopicNames.ACCOUNTS_SALE_EVENTS;

    protected generateMessageKey(data: SaleUpdatedEvent["data"]): string {
        return `${data.id}_${data.updatedBy}`;
    }
}

export class SaleCancelledPublisher extends KafkaPublisher<SaleCancelledEvent> {
    subject = Subjects.SaleCancelled as const;
    topic = TopicNames.ACCOUNTS_SALE_EVENTS;

    protected generateMessageKey(data: SaleCancelledEvent["data"]): string {
        return `${data.customerId}_${data.saleNo}_cancelled`;
    }
}

export class SalePaidPublisher extends KafkaPublisher<SalePaidEvent> {
    subject = Subjects.SalePaid as const;
    topic = TopicNames.ACCOUNTS_SALE_EVENTS;

    protected generateMessageKey(data: SalePaidEvent["data"]): string {
        return `${data.customerId}_${data.saleNo}_paid`;
    }
}

export class SaleOverduePublisher extends KafkaPublisher<SaleOverdueEvent> {
    subject = Subjects.SaleOverdue as const;
    topic = TopicNames.ACCOUNTS_SALE_EVENTS;

    protected generateMessageKey(data: SaleOverdueEvent["data"]): string {
        return `${data.customerId}_${data.saleNo}_overdue`;
    }
}
