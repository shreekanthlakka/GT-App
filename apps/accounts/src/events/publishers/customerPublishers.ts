import {
    CustomerCreatedEvent,
    CustomerDeletedEvent,
    CustomerUpdatedEvent,
} from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { KafkaPublisher } from "@repo/common-backend/kafka";
import { TopicNames } from "@repo/common/topics";

export class CustomerCreatedPublisher extends KafkaPublisher<CustomerCreatedEvent> {
    subject = Subjects.CustomerCreated as const;
    topic = TopicNames.CUSTOMER_EVENTS;

    protected generateMessageKey(data: CustomerCreatedEvent["data"]): string {
        return `${data.email} created by -> ${data.createdBy}`;
    }
}

export class CustomerUpdatedPublisher extends KafkaPublisher<CustomerUpdatedEvent> {
    subject = Subjects.CustomerUpdated as const;
    topic = TopicNames.CUSTOMER_EVENTS;

    protected generateMessageKey(data: CustomerUpdatedEvent["data"]): string {
        return `${data.id} updated by -> ${data.updatedBy}`;
    }
}

export class CustomerDeletedPublisher extends KafkaPublisher<CustomerDeletedEvent> {
    subject = Subjects.CustomerDeleted as const;
    topic = TopicNames.CUSTOMER_EVENTS;

    protected generateMessageKey(data: CustomerDeletedEvent["data"]): string {
        return `${data.email} deleted by -> ${data.deletedBy}`;
    }
}
