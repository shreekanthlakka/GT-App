// ========================================
// reviewPublishers.ts
// ========================================
import { KafkaPublisher } from "@repo/common-backend/kafka";
import {
    ReviewCreatedEvent,
    ReviewUpdatedEvent,
    ReviewDeletedEvent,
} from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { TopicNames } from "@repo/common/topics";

export class ReviewCreatedPublisher extends KafkaPublisher<ReviewCreatedEvent> {
    subject = Subjects.ReviewCreated as const;
    topic = TopicNames.ECOMMERCE_REVIEW_EVENTS;

    protected generateMessageKey(data: ReviewCreatedEvent["data"]): string {
        return data.ecommUserId;
    }
}

export class ReviewUpdatedPublisher extends KafkaPublisher<ReviewUpdatedEvent> {
    subject = Subjects.ReviewUpdated as const;
    topic = TopicNames.ECOMMERCE_REVIEW_EVENTS;

    protected generateMessageKey(data: ReviewUpdatedEvent["data"]): string {
        return data.ecommUserId;
    }
}

export class ReviewDeletedPublisher extends KafkaPublisher<ReviewDeletedEvent> {
    subject = Subjects.ReviewDeleted as const;
    topic = TopicNames.ECOMMERCE_REVIEW_EVENTS;

    protected generateMessageKey(data: ReviewDeletedEvent["data"]): string {
        return data.ecommUserId;
    }
}
