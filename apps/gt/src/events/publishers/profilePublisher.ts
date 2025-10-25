import { KafkaPublisher } from "@repo/common-backend/kafka";
import {
    EcommerceUserProfileUpdatedEvent,
    EcommerceUserPreferencesUpdatedEvent,
} from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { TopicNames } from "@repo/common/topics";

/**
 * Publisher for ecommerce user profile updates
 */
export class EcommerceUserProfileUpdatedPublisher extends KafkaPublisher<EcommerceUserProfileUpdatedEvent> {
    subject = Subjects.EcommerceUserProfileUpdated as const;
    topic = TopicNames.ECOMMERCE_USER_EVENTS;

    protected generateMessageKey(
        data: EcommerceUserProfileUpdatedEvent["data"]
    ): string {
        return `${data.updatedFields} - updatedBy - ${data.updateSource}`;
    }
}

/**
 * Publisher for user preferences updates
 */
export class EcommerceUserPreferencesUpdatedPublisher extends KafkaPublisher<EcommerceUserPreferencesUpdatedEvent> {
    subject = Subjects.EcommerceUserPreferencesUpdated as const;
    topic = TopicNames.ECOMMERCE_USER_EVENTS;

    protected generateMessageKey(
        data: EcommerceUserPreferencesUpdatedEvent["data"]
    ): string {
        return data.userId;
    }
}
