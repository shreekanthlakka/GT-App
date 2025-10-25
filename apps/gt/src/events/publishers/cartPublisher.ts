// ========================================
// cartPublishers.ts
// ========================================
import { KafkaPublisher } from "@repo/common-backend/kafka";
import {
    CartItemAddedEvent,
    CartItemRemovedEvent,
    CartUpdatedEvent,
    CartAbandonedEvent,
} from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { TopicNames } from "@repo/common/topics";

export class CartItemAddedPublisher extends KafkaPublisher<CartItemAddedEvent> {
    subject = Subjects.CartItemAdded as const;
    topic = TopicNames.ECOMMERCE_CART_EVENTS;

    protected generateMessageKey(data: CartItemAddedEvent["data"]): string {
        return data.ecommUserId;
    }
}

export class CartItemRemovedPublisher extends KafkaPublisher<CartItemRemovedEvent> {
    subject = Subjects.CartItemRemoved as const;
    topic = TopicNames.ECOMMERCE_CART_EVENTS;

    protected generateMessageKey(data: CartItemRemovedEvent["data"]): string {
        return data.ecommUserId;
    }
}

export class CartUpdatedPublisher extends KafkaPublisher<CartUpdatedEvent> {
    subject = Subjects.CartUpdated as const;
    topic = TopicNames.ECOMMERCE_CART_EVENTS;

    protected generateMessageKey(data: CartUpdatedEvent["data"]): string {
        return data.ecommUserId;
    }
}

export class CartAbandonedPublisher extends KafkaPublisher<CartAbandonedEvent> {
    subject = Subjects.CartAbandoned as const;
    topic = TopicNames.ECOMMERCE_CART_EVENTS;

    protected generateMessageKey(data: CartAbandonedEvent["data"]): string {
        return data.ecommUserId;
    }
}
