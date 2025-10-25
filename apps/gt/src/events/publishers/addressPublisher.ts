// ========================================
// addressPublishers.ts
// ========================================
import { KafkaPublisher } from "@repo/common-backend/kafka";
import {
    EcommerceUserAddressAddedEvent,
    EcommerceUserAddressUpdatedEvent,
    EcommerceUserAddressDeletedEvent,
} from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { TopicNames } from "@repo/common/topics";

export class EcommerceUserAddressAddedPublisher extends KafkaPublisher<EcommerceUserAddressAddedEvent> {
    subject = Subjects.EcommerceUserAddressAdded as const;
    topic = TopicNames.ECOMMERCE_USER_EVENTS;

    protected generateMessageKey(
        data: EcommerceUserAddressAddedEvent["data"]
    ): string {
        return data.ecommerceUserId;
    }
}

export class EcommerceUserAddressUpdatedPublisher extends KafkaPublisher<EcommerceUserAddressUpdatedEvent> {
    subject = Subjects.EcommerceUserAddressUpdated as const;
    topic = TopicNames.ECOMMERCE_USER_EVENTS;

    protected generateMessageKey(
        data: EcommerceUserAddressUpdatedEvent["data"]
    ): string {
        return data.ecommerceUserId;
    }
}

export class EcommerceUserAddressDeletedPublisher extends KafkaPublisher<EcommerceUserAddressDeletedEvent> {
    subject = Subjects.EcommerceUserAddressDeleted as const;
    topic = TopicNames.ECOMMERCE_USER_EVENTS;

    protected generateMessageKey(
        data: EcommerceUserAddressDeletedEvent["data"]
    ): string {
        return data.ecommerceUserId;
    }
}
