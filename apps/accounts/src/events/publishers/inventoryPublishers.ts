import { Subjects } from "@repo/common/subjects";
import { KafkaPublisher } from "@repo/common-backend/kafka";
import { TopicNames } from "@repo/common/topics";
import {
    InventoryAdjustmentMadeEvent,
    InventoryCountCompletedEvent,
    InventoryCountStartedEvent,
    InventoryItemActivatedEvent,
    InventoryItemCategoryChangedEvent,
    InventoryItemCostUpdatedEvent,
    InventoryItemCreatedEvent,
    InventoryItemDeactivatedEvent,
    InventoryItemDeletedEvent,
    InventoryItemImageUpdatedEvent,
    InventoryItemPriceUpdatedEvent,
    InventoryItemUpdatedEvent,
    InventoryTurnoverCalculatedEvent,
    InventoryVarianceDetectedEvent,
    StockAddedEvent,
    StockAdjustedEvent,
    StockCriticalEvent,
    StockDamagedEvent,
    StockExpiredEvent,
    StockLowEvent,
    StockOrderedEvent,
    StockOutEvent,
    StockReceivedEvent,
    StockReducedEvent,
    StockReorderRequiredEvent,
    StockReturnedEvent,
    StockTransferredEvent,
} from "@repo/common-backend/interfaces";

/**
 * Publisher for inventory item creation events
 */
export class InventoryItemCreatedPublisher extends KafkaPublisher<InventoryItemCreatedEvent> {
    subject = Subjects.InventoryItemCreated as const;
    topic = TopicNames.INVENTORY_ITEM;

    protected generateMessageKey(
        data: InventoryItemCreatedEvent["data"]
    ): string {
        return `${data.name} - createdBy - ${data.createdBy}`;
    }
}

/**
 * Publisher for inventory item update events
 */
export class InventoryItemUpdatedPublisher extends KafkaPublisher<InventoryItemUpdatedEvent> {
    subject = Subjects.InventoryItemUpdated as const;
    topic = TopicNames.INVENTORY_ITEM;

    protected generateMessageKey(
        data: InventoryItemUpdatedEvent["data"]
    ): string {
        return `${data.id} -updatedBy - ${data.updatedBy}`;
    }
}

/**
 * Publisher for inventory item deletion events
 */
export class InventoryItemDeletedPublisher extends KafkaPublisher<InventoryItemDeletedEvent> {
    subject = Subjects.InventoryItemDeleted as const;
    topic = TopicNames.INVENTORY_ITEM;

    protected generateMessageKey(
        data: InventoryItemDeletedEvent["data"]
    ): string {
        return `${data.id} - deletedBy -${data.deletedBy}`;
    }
}

/**
 * Publisher for inventory item activation events
 */
export class InventoryItemActivatedPublisher extends KafkaPublisher<InventoryItemActivatedEvent> {
    subject = Subjects.InventoryItemActivated as const;
    topic = TopicNames.INVENTORY_ITEM;

    protected generateMessageKey(
        data: InventoryItemActivatedEvent["data"]
    ): string {
        return `${data.id} - activatedBy - ${data.activatedBy} `;
    }
}

/**
 * Publisher for inventory item deactivation events
 */
export class InventoryItemDeactivatedPublisher extends KafkaPublisher<InventoryItemDeactivatedEvent> {
    subject = Subjects.InventoryItemDeactivated as const;
    topic = TopicNames.INVENTORY_ITEM;

    protected generateMessageKey(
        data: InventoryItemDeactivatedEvent["data"]
    ): string {
        return `${data.id} - deactivatedBy - ${data.deactivatedBy}`;
    }
}

/**
 * Publisher for inventory item price update events
 */
export class InventoryItemPriceUpdatedPublisher extends KafkaPublisher<InventoryItemPriceUpdatedEvent> {
    subject = Subjects.InventoryItemPriceUpdated as const;
    topic = TopicNames.INVENTORY_ITEM;

    protected generateMessageKey(
        data: InventoryItemPriceUpdatedEvent["data"]
    ): string {
        return `${data.id} - PriceUpdatedBy - ${data.updatedBy}`;
    }
}

/**
 * Publisher for inventory item cost update events
 */
export class InventoryItemCostUpdatedPublisher extends KafkaPublisher<InventoryItemCostUpdatedEvent> {
    subject = Subjects.InventoryItemCostUpdated as const;
    topic = TopicNames.INVENTORY_ITEM;

    protected generateMessageKey(
        data: InventoryItemCostUpdatedEvent["data"]
    ): string {
        return `${data.id} - CostUpdatedTo - ${data.newCostPrice}`;
    }
}

/**
 * Publisher for inventory item category change events
 */
export class InventoryItemCategoryChangedPublisher extends KafkaPublisher<InventoryItemCategoryChangedEvent> {
    subject = Subjects.InventoryItemCategoryChanged as const;
    topic = TopicNames.INVENTORY_ITEM;

    protected generateMessageKey(
        data: InventoryItemCategoryChangedEvent["data"]
    ): string {
        return data.id;
    }
}

/**
 * Publisher for inventory item image update events
 */
export class InventoryItemImageUpdatedPublisher extends KafkaPublisher<InventoryItemImageUpdatedEvent> {
    subject = Subjects.InventoryItemImageUpdated as const;
    topic = TopicNames.INVENTORY_ITEM;

    protected generateMessageKey(
        data: InventoryItemImageUpdatedEvent["data"]
    ): string {
        return `${data.id} - imageUpdatedBy - ${data.updatedBy}`;
    }
}

// ========================================
// STOCK MOVEMENT PUBLISHERS
// ========================================

/**
 * Publisher for stock addition events
 */
export class StockAddedPublisher extends KafkaPublisher<StockAddedEvent> {
    subject = Subjects.StockAdded as const;
    topic = TopicNames.STOCK_MOVEMENT;

    protected generateMessageKey(data: StockAddedEvent["data"]): string {
        return ` ${data.inventoryItemId} - ${data.inventoryItemName}`;
    }
}

/**
 * Publisher for stock reduction events
 */
export class StockReducedPublisher extends KafkaPublisher<StockReducedEvent> {
    subject = Subjects.StockReduced as const;
    topic = TopicNames.STOCK_MOVEMENT;

    protected generateMessageKey(data: StockReducedEvent["data"]): string {
        return data.inventoryItemId;
    }
}

/**
 * Publisher for stock adjustment events
 */
export class StockAdjustedPublisher extends KafkaPublisher<StockAdjustedEvent> {
    subject = Subjects.StockAdjusted as const;
    topic = TopicNames.STOCK_MOVEMENT;

    protected generateMessageKey(data: StockAdjustedEvent["data"]): string {
        return `${data.inventoryItemId} - ${data.adjustmentType}`;
    }
}

/**
 * Publisher for stock transfer events
 */
export class StockTransferredPublisher extends KafkaPublisher<StockTransferredEvent> {
    subject = Subjects.StockTransferred as const;
    topic = TopicNames.STOCK_MOVEMENT;

    protected generateMessageKey(data: StockTransferredEvent["data"]): string {
        return data.inventoryItemId;
    }
}

/**
 * Publisher for stock damage events
 */
export class StockDamagedPublisher extends KafkaPublisher<StockDamagedEvent> {
    subject = Subjects.StockDamaged as const;
    topic = TopicNames.STOCK_MOVEMENT;

    protected generateMessageKey(data: StockDamagedEvent["data"]): string {
        return `${data.inventoryItemId} - ${data.discoveredBy}`;
    }
}

/**
 * Publisher for stock expiry events
 */
export class StockExpiredPublisher extends KafkaPublisher<StockExpiredEvent> {
    subject = Subjects.StockExpired as const;
    topic = TopicNames.STOCK_MOVEMENT;

    protected generateMessageKey(data: StockExpiredEvent["data"]): string {
        return data.inventoryItemId;
    }
}

/**
 * Publisher for stock return events
 */
export class StockReturnedPublisher extends KafkaPublisher<StockReturnedEvent> {
    subject = Subjects.StockReturned as const;
    topic = TopicNames.STOCK_MOVEMENT;

    protected generateMessageKey(data: StockReturnedEvent["data"]): string {
        return data.inventoryItemId;
    }
}

/**
 * Publisher for stock received events
 */
export class StockReceivedPublisher extends KafkaPublisher<StockReceivedEvent> {
    subject = Subjects.StockReceived as const;
    topic = TopicNames.STOCK_MOVEMENT;

    protected generateMessageKey(data: StockReceivedEvent["data"]): string {
        return data.inventoryItemId;
    }
}

/**
 * Publisher for stock ordered events
 */
export class StockOrderedPublisher extends KafkaPublisher<StockOrderedEvent> {
    subject = Subjects.StockOrdered as const;
    topic = TopicNames.STOCK_MOVEMENT;

    protected generateMessageKey(data: StockOrderedEvent["data"]): string {
        return data.inventoryItemId;
    }
}

// ========================================
// STOCK ALERT PUBLISHERS
// ========================================

/**
 * Publisher for low stock alert events
 */
export class StockLowPublisher extends KafkaPublisher<StockLowEvent> {
    subject = Subjects.StockLow as const;
    topic = TopicNames.STOCK_MOVEMENT;

    protected generateMessageKey(data: StockLowEvent["data"]): string {
        return data.inventoryItemId;
    }
}

/**
 * Publisher for critical stock alert events
 */
export class StockCriticalPublisher extends KafkaPublisher<StockCriticalEvent> {
    subject = Subjects.StockCritical as const;
    topic = TopicNames.STOCK_MOVEMENT;

    protected generateMessageKey(data: StockCriticalEvent["data"]): string {
        return data.inventoryItemId;
    }
}

/**
 * Publisher for out of stock alert events
 */
export class StockOutPublisher extends KafkaPublisher<StockOutEvent> {
    subject = Subjects.StockOut as const;
    topic = TopicNames.STOCK_MOVEMENT;

    protected generateMessageKey(data: StockOutEvent["data"]): string {
        return data.inventoryItemId;
    }
}

/**
 * Publisher for stock reorder required events
 */
export class StockReorderRequiredPublisher extends KafkaPublisher<StockReorderRequiredEvent> {
    subject = Subjects.StockReorderRequired as const;
    topic = TopicNames.STOCK_MOVEMENT;

    protected generateMessageKey(
        data: StockReorderRequiredEvent["data"]
    ): string {
        return data.inventoryItemId;
    }
}

// ========================================
// INVENTORY OPERATIONS PUBLISHERS
// ========================================

/**
 * Publisher for inventory count started events
 */
export class InventoryCountStartedPublisher extends KafkaPublisher<InventoryCountStartedEvent> {
    subject = Subjects.InventoryCountStarted as const;
    topic = TopicNames.INVENTORY_ANALYTICS;

    protected generateMessageKey(
        data: InventoryCountStartedEvent["data"]
    ): string {
        return data.countId;
    }
}

/**
 * Publisher for inventory count completed events
 */
export class InventoryCountCompletedPublisher extends KafkaPublisher<InventoryCountCompletedEvent> {
    subject = Subjects.InventoryCountCompleted as const;
    topic = TopicNames.INVENTORY_ANALYTICS;

    protected generateMessageKey(
        data: InventoryCountCompletedEvent["data"]
    ): string {
        return data.countId;
    }
}

/**
 * Publisher for inventory variance detected events
 */
export class InventoryVarianceDetectedPublisher extends KafkaPublisher<InventoryVarianceDetectedEvent> {
    subject = Subjects.InventoryVarianceDetected as const;
    topic = TopicNames.INVENTORY_ANALYTICS;

    protected generateMessageKey(
        data: InventoryVarianceDetectedEvent["data"]
    ): string {
        return data.varianceId;
    }
}

/**
 * Publisher for inventory adjustment made events
 */
export class InventoryAdjustmentMadePublisher extends KafkaPublisher<InventoryAdjustmentMadeEvent> {
    subject = Subjects.InventoryAdjustmentMade as const;
    topic = TopicNames.INVENTORY_ANALYTICS;

    protected generateMessageKey(
        data: InventoryAdjustmentMadeEvent["data"]
    ): string {
        return data.adjustmentId;
    }
}

/**
 * Publisher for inventory turnover calculated events
 */
export class InventoryTurnoverCalculatedPublisher extends KafkaPublisher<InventoryTurnoverCalculatedEvent> {
    subject = Subjects.InventoryTurnoverCalculated as const;
    topic = TopicNames.INVENTORY_ANALYTICS;

    protected generateMessageKey(
        data: InventoryTurnoverCalculatedEvent["data"]
    ): string {
        return data.calculationId;
    }
}
