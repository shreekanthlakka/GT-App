import { KafkaPublisher } from "@repo/common-backend/kafka";
import {
    OrderCreatedEvent,
    OrderUpdatedEvent,
    OrderConfirmedEvent,
    OrderShippedEvent,
    OrderDeliveredEvent,
    OrderCancelledEvent,
    OrderReturnedEvent,
} from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { TopicNames } from "@repo/common/topics";

/**
 * Publisher for order creation
 */
export class OrderCreatedPublisher extends KafkaPublisher<OrderCreatedEvent> {
    subject = Subjects.OrderCreated as const;
    topic = TopicNames.ECOMMERCE_ORDER_EVENTS;

    protected generateMessageKey(data: OrderCreatedEvent["data"]): string {
        return data.userId;
    }
}

/**
 * Publisher for order updates
 */
export class OrderUpdatedPublisher extends KafkaPublisher<OrderUpdatedEvent> {
    subject = Subjects.OrderUpdated as const;
    topic = TopicNames.ECOMMERCE_ORDER_EVENTS;

    protected generateMessageKey(data: OrderUpdatedEvent["data"]): string {
        return `${data.id} - updatedBy - ${data.updatedBy}`;
    }
}

/**
 * Publisher for order confirmation (after payment)
 */
export class OrderConfirmedPublisher extends KafkaPublisher<OrderConfirmedEvent> {
    subject = Subjects.OrderConfirmed as const;
    topic = TopicNames.ECOMMERCE_ORDER_EVENTS;

    protected generateMessageKey(data: OrderConfirmedEvent["data"]): string {
        return `${data.customerId} - confirmedBy - ${data.confirmedBy}`;
    }
}

/**
 * Publisher for order shipment
 */
export class OrderShippedPublisher extends KafkaPublisher<OrderShippedEvent> {
    subject = Subjects.OrderShipped as const;
    topic = TopicNames.ECOMMERCE_ORDER_EVENTS;

    protected generateMessageKey(data: OrderShippedEvent["data"]): string {
        return `${data.customerId} - shippedBy - ${data.shippedBy}`;
    }
}

/**
 * Publisher for order delivery
 */
export class OrderDeliveredPublisher extends KafkaPublisher<OrderDeliveredEvent> {
    subject = Subjects.OrderDelivered as const;
    topic = TopicNames.ECOMMERCE_ORDER_EVENTS;

    protected generateMessageKey(data: OrderDeliveredEvent["data"]): string {
        return data.customerId;
    }
}

/**
 * Publisher for order cancellation
 */
export class OrderCancelledPublisher extends KafkaPublisher<OrderCancelledEvent> {
    subject = Subjects.OrderCancelled as const;
    topic = TopicNames.ECOMMERCE_ORDER_EVENTS;

    protected generateMessageKey(data: OrderCancelledEvent["data"]): string {
        return data.customerId;
    }
}

/**
 * Publisher for order returns
 */
export class OrderReturnedPublisher extends KafkaPublisher<OrderReturnedEvent> {
    subject = Subjects.OrderReturned as const;
    topic = TopicNames.ECOMMERCE_ORDER_EVENTS;

    protected generateMessageKey(data: OrderReturnedEvent["data"]): string {
        return data.customerId;
    }
}
