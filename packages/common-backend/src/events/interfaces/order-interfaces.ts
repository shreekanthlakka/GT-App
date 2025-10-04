// packages/common-backend/src/events/interfaces/orderInterfaces.ts
import { BaseEvent } from "./base-interfaces";
import { Subjects } from "@repo/common/subjects";

export interface OrderCreatedEvent extends BaseEvent {
    subject: Subjects.OrderCreated;
    data: {
        id: string;
        orderNo: string;
        date: string;
        status:
            | "PENDING"
            | "CONFIRMED"
            | "PROCESSING"
            | "SHIPPED"
            | "DELIVERED"
            | "CANCELLED";
        totalAmount: number;
        paidAmount: number;
        shippingAmount: number;
        taxAmount: number;
        discountAmount: number;
        items: Array<{
            productId: string;
            productName: string;
            quantity: number;
            price: number;
            total: number;
            discount?: number;
        }>;
        shippingAddress?: {
            name: string;
            phone: string;
            address: string;
            city: string;
            state: string;
            pincode: string;
        };
        billingAddress?: {
            name: string;
            phone: string;
            address: string;
            city: string;
            state: string;
            pincode: string;
        };
        notes?: string;
        source?: string;
        priority?: string;
        expectedDelivery?: string;
        customerId: string;
        customerName: string;
        userId: string;
        createdBy?: string;
        createdAt: string;
    };
}

export interface OrderUpdatedEvent extends BaseEvent {
    subject: Subjects.OrderUpdated;
    data: {
        id: string;
        updatedAt: string;
        changes: Record<
            string,
            {
                oldValue: any;
                newValue: any;
            }
        >;
        updatedBy: string;
        customerId: string;
        statusChanged?: boolean;
        itemsModified?: boolean;
        addressChanged?: boolean;
        paymentUpdated?: boolean;
    };
}

export interface OrderConfirmedEvent extends BaseEvent {
    subject: Subjects.OrderConfirmed;
    data: {
        id: string;
        orderNo: string;
        customerId: string;
        customerName: string;
        totalAmount: number;
        estimatedDelivery?: string;
        paymentMethod?: string;
        confirmedBy: string;
        confirmedAt: string;
        inventoryReserved: boolean;
        customerNotified: boolean;
    };
}

export interface OrderPackedEvent extends BaseEvent {
    subject: Subjects.OrderPacked;
    data: {
        id: string;
        orderNo: string;
        customerId: string;
        customerName: string;
        packagedItems: Array<{
            productId: string;
            productName: string;
            quantity: number;
            packed: boolean;
        }>;
        packingNotes?: string;
        packageWeight?: number;
        packageDimensions?: {
            length: number;
            width: number;
            height: number;
        };
        packedBy: string;
        packedAt: string;
        readyForShipment: boolean;
    };
}

export interface OrderShippedEvent extends BaseEvent {
    subject: Subjects.OrderShipped;
    data: {
        id: string;
        orderNo: string;
        customerId: string;
        customerName: string;
        shippingProvider: string;
        trackingNumber: string;
        shippingAddress: {
            name: string;
            phone: string;
            address: string;
            city: string;
            state: string;
            pincode: string;
        };
        estimatedDelivery: string;
        shippingCost: number;
        shippedBy: string;
        shippedAt: string;
        customerNotified: boolean;
    };
}

export interface OrderDeliveredEvent extends BaseEvent {
    subject: Subjects.OrderDelivered;
    data: {
        id: string;
        orderNo: string;
        customerId: string;
        customerName: string;
        deliveredAt: string;
        deliveredBy?: string;
        receivedBy?: string;
        deliveryStatus: "DELIVERED" | "PARTIALLY_DELIVERED" | "FAILED_DELIVERY";
        deliveryProof?: {
            signature?: boolean;
            photo?: boolean;
            otp?: boolean;
        };
        customerFeedback?: {
            rating?: number;
            comments?: string;
        };
        finalAmount: number;
        orderCompletedAt: string;
    };
}

export interface OrderCancelledEvent extends BaseEvent {
    subject: Subjects.OrderCancelled;
    data: {
        id: string;
        orderNo: string;
        customerId: string;
        customerName: string;
        totalAmount: number;
        refundAmount?: number;
        cancellationReason: string;
        cancelledBy: string;
        cancelledAt: string;
        inventoryRestored: boolean;
        refundProcessed: boolean;
        customerNotified: boolean;
    };
}

export interface OrderReturnedEvent extends BaseEvent {
    subject: Subjects.OrderReturned;
    data: {
        id: string;
        orderNo: string;
        returnId: string;
        customerId: string;
        customerName: string;
        returnType: "FULL_RETURN" | "PARTIAL_RETURN";
        returnedItems: Array<{
            productId: string;
            productName: string;
            quantity: number;
            returnReason: string;
            condition: "NEW" | "USED" | "DAMAGED";
            refundAmount: number;
            restockable: boolean;
        }>;
        totalRefundAmount: number;
        returnReason: string;
        processedBy: string;
        returnedAt: string;
        customerSatisfaction?: "SATISFIED" | "NEUTRAL" | "DISSATISFIED";
    };
}

export interface OrderRefundedEvent extends BaseEvent {
    subject: Subjects.OrderRefunded;
    data: {
        id: string;
        orderNo: string;
        refundId: string;
        customerId: string;
        customerName: string;
        originalAmount: number;
        refundAmount: number;
        refundMethod:
            | "ORIGINAL_PAYMENT"
            | "BANK_TRANSFER"
            | "CASH"
            | "STORE_CREDIT";
        refundReason: string;
        refundReference?: string;
        processingFee?: number;
        processedBy: string;
        refundedAt: string;
        refundStatus: "INITIATED" | "PROCESSING" | "COMPLETED" | "FAILED";
    };
}

export interface OrderCompletedEvent extends BaseEvent {
    subject: Subjects.OrderCompleted;
    data: {
        id: string;
        orderNo: string;
        customerId: string;
        customerName: string;
        totalAmount: number;
        orderDate: string;
        completedAt: string;
        daysToComplete: number;
        customerSatisfactionRating?: number;
        completionMethod: "DELIVERY" | "PICKUP" | "DIGITAL";
        finalPaymentReceived: boolean;
        invoiceGenerated?: boolean;
        warrantyActivated?: boolean;
    };
}

export type OrderEventTypes =
    | OrderCreatedEvent
    | OrderUpdatedEvent
    | OrderConfirmedEvent
    | OrderPackedEvent
    | OrderShippedEvent
    | OrderDeliveredEvent
    | OrderCancelledEvent
    | OrderReturnedEvent
    | OrderRefundedEvent
    | OrderCompletedEvent;
