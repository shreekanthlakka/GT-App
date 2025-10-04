import {
    InvoicePaymentCreatedEvent,
    InvoicePaymentDeletedEvent,
    InvoicePaymentProcessedEvent,
    InvoicePaymentUpdatedEvent,
} from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { KafkaPublisher } from "@repo/common-backend/kafka";
import { TopicNames } from "@repo/common/topics";

export class InvoicePaymentCreatedPublisher extends KafkaPublisher<InvoicePaymentCreatedEvent> {
    subject = Subjects.InvoicePaymentCreated as const;
    topic = TopicNames.ACCOUNTS_INVOICE_PAYMENT_EVENTS;
    protected generateMessageKey(
        data: InvoicePaymentCreatedEvent["data"]
    ): string {
        return `${data.voucherId} created by -> ${data.createdBy}`;
    }
}

export class InvoicePaymentUpdatedPublisher extends KafkaPublisher<InvoicePaymentUpdatedEvent> {
    subject = Subjects.InvoicePaymentUpdated as const;
    topic = TopicNames.ACCOUNTS_INVOICE_PAYMENT_EVENTS;
    protected generateMessageKey(
        data: InvoicePaymentUpdatedEvent["data"]
    ): string {
        return `${data.voucherId} updated by -> ${data.updatedBy}`;
    }
}

export class InvoicePaymentDeletedPublisher extends KafkaPublisher<InvoicePaymentDeletedEvent> {
    subject = Subjects.InvoicePaymentDeleted as const;
    topic = TopicNames.ACCOUNTS_INVOICE_PAYMENT_EVENTS;
    protected generateMessageKey(
        data: InvoicePaymentDeletedEvent["data"]
    ): string {
        return `${data.voucherId} deleted by -> ${data.deletedBy}`;
    }
}
export class InvoicePaymentProcessedPublisher extends KafkaPublisher<InvoicePaymentProcessedEvent> {
    subject = Subjects.InvoicePaymentProcessed as const;
    topic = TopicNames.ACCOUNTS_INVOICE_PAYMENT_EVENTS;
    protected generateMessageKey(
        data: InvoicePaymentProcessedEvent["data"]
    ): string {
        return `${data.voucherId} gatewatPaymentId -> ${data.gatewayPaymentId}`;
    }
}
