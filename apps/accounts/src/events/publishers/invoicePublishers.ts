import {
    InvoiceCreatedEvent,
    InvoiceDeletedEvent,
    InvoicePaidEvent,
    InvoiceUpdatedEvent,
} from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { KafkaPublisher } from "@repo/common-backend/kafka";
import { TopicNames } from "@repo/common/topics";

export class InvoiceCreatedPublisher extends KafkaPublisher<InvoiceCreatedEvent> {
    subject = Subjects.InvoiceCreated as const;
    topic = TopicNames.ACCOUNTS_INVOICE_EVENTS;
    protected generateMessageKey(data: InvoiceCreatedEvent["data"]): string {
        return `${data.voucherId} created by -> ${data.createdBy}`;
    }
}

export class InvoiceUpdatedPublisher extends KafkaPublisher<InvoiceUpdatedEvent> {
    subject = Subjects.InvoiceUpdated as const;
    topic = TopicNames.ACCOUNTS_INVOICE_EVENTS;
    protected generateMessageKey(data: InvoiceUpdatedEvent["data"]): string {
        return `${data.id} updated by -> ${data.updatedBy}`;
    }
}

export class InvoiceDeletedPublisher extends KafkaPublisher<InvoiceDeletedEvent> {
    subject = Subjects.InvoiceDeleted as const;
    topic = TopicNames.ACCOUNTS_INVOICE_EVENTS;
    protected generateMessageKey(data: InvoiceDeletedEvent["data"]): string {
        return `${data.id} deleted by -> ${data.deletedBy}`;
    }
}

export class InvoicePaidPublisher extends KafkaPublisher<InvoicePaidEvent> {
    subject = Subjects.InvoicePaid as const;
    topic = TopicNames.ACCOUNTS_INVOICE_EVENTS;
    protected generateMessageKey(data: InvoicePaidEvent["data"]): string {
        return `${data.invoiceId} -> ${data.paymentId}`;
    }
}
