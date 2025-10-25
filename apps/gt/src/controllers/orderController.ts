// ========================================
// orderController.ts (Key parts with ecommUserId)
// ========================================

import {
    asyncHandler,
    calculatePagination,
    CustomError,
    CustomResponse,
} from "@repo/common-backend/utils";
import { prisma } from "@repo/db/prisma";
import { Request, Response } from "express";
import {
    OrderCancelledPublisher,
    OrderCreatedPublisher,
    OrderReturnedPublisher,
} from "../events/publishers/orderPublisher";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import { LogCategory, logger } from "@repo/common-backend/logger";

export const getOrders = asyncHandler(async (req, res) => {
    const ecommUserId = req.user?.userId;
    const {
        page = 1,
        limit = 10,
        status,
        sortBy = "date",
        sortOrder = "desc",
    } = req.query;

    const { skip, take, pagination } = calculatePagination(
        Number(page),
        Number(limit),
        0
    );

    const whereClause: any = { ecommUserId };
    if (status) {
        whereClause.status = status;
    }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where: whereClause,
            include: {
                items: {
                    include: {
                        inventoryItem: {
                            select: { id: true, name: true, images: true },
                        },
                    },
                },
                shippingAddress: true,
            },
            orderBy: { [sortBy as string]: sortOrder },
            skip,
            take,
        }),
        prisma.order.count({ where: whereClause }),
    ]);

    pagination.total = total;
    pagination.totalPages = Math.ceil(total / take);
    pagination.hasNext = Number(page) < pagination.totalPages;
    pagination.hasPrev = Number(page) > 1;

    const response = new CustomResponse(200, "Orders retrieved successfully", {
        orders,
        pagination,
    });
    res.status(response.statusCode).json(response);
});

export const getOrderById = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommUserId = req.user?.userId;
        const { id } = req.params;

        const order = await prisma.order.findFirst({
            where: { id, ecommerceUserId },
            include: {
                items: {
                    include: {
                        inventoryItem: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                images: true,
                                sku: true,
                            },
                        },
                    },
                },
                shippingAddress: true,
                billingAddress: true,
            },
        });

        if (!order) {
            throw new CustomError(404, "Order not found");
        }

        const response = new CustomResponse(
            200,
            "Order retrieved successfully",
            order
        );
        res.status(response.statusCode).json(response);
    }
);

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
    const ecommUserId = req.user?.userId;
    const {
        items,
        shippingAddress,
        billingAddress,
        paymentMethod,
        shippingAmount = 0,
        discountAmount = 0,
        notes,
        priority = "NORMAL",
        couponCode,
        giftMessage,
        deliveryInstructions,
    } = req.body;

    // Validate inventory availability
    await OrderService.reserveInventory(items);

    // Create shipping address
    const shippingAddr = await prisma.address.create({
        data: {
            ecommUserId: ecommUserId!,
            ...shippingAddress,
        },
    });

    // Create billing address if different
    let billingAddr;
    if (billingAddress) {
        billingAddr = await prisma.address.create({
            data: {
                ecommUserId: ecommUserId!,
                ...billingAddress,
            },
        });
    }

    // Calculate order amounts
    const { subtotal, taxAmount, totalAmount } =
        OrderService.calculateOrderAmounts(
            items,
            shippingAmount,
            discountAmount
        );

    // Generate order number
    const orderNumber = await OrderService.generateOrderNumber();

    // Calculate estimated delivery
    const expectedDelivery = OrderService.calculateEstimatedDelivery();

    // Create order
    const order = await prisma.order.create({
        data: {
            orderNumber,
            ecommUserId: ecommUserId!,
            shippingAddressId: shippingAddr.id,
            billingAddressId: billingAddr?.id,
            status: "PENDING",
            priority,
            source: "ECOMMERCE",
            subtotal,
            discountAmount,
            taxAmount,
            shippingAmount,
            totalAmount,
            expectedDelivery,
            notes,
            giftMessage,
            deliveryInstructions,
            couponCode,
            items: {
                create: items.map((item: any) => ({
                    inventoryItemId: item.inventoryItemId,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    discount: item.discount || 0,
                    taxRate: 18,
                    totalPrice:
                        item.price * item.quantity - (item.discount || 0),
                })),
            },
        },
        include: {
            items: {
                include: {
                    inventoryItem: {
                        select: { id: true, name: true, sku: true },
                    },
                },
            },
            ecommUser: true,
        },
    });

    // Publish order created event
    const publisher = new OrderCreatedPublisher(kafkaWrapper.producer);

    await publisher.publish({
        orderId: order.id,
        orderNumber: order.orderNumber,
        ecommUserId: order.ecommUserId,
        customerEmail: order.ecommUser.email,
        customerName: order.ecommUser.name,
        totalAmount: Number(order.totalAmount),
        paymentMethod,
        status: order.status,
        createdAt: new Date().toISOString(),
        items: order.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            productName: item.inventoryItem.name,
            sku: item.inventoryItem.sku || undefined,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
        })),
        shippingAddress: {
            name: shippingAddr.name,
            phone: shippingAddr.phone,
            address: shippingAddr.address,
            city: shippingAddr.city,
            state: shippingAddr.state,
            pincode: shippingAddr.pincode,
        },
    });

    logger.info("Order created", LogCategory.ECOMMERCE, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        ecommUserId,
        totalAmount: Number(order.totalAmount),
    });

    const response = new CustomResponse(
        201,
        "Order created successfully. Proceed to payment.",
        {
            order,
            paymentRequired: true,
            nextStep: "PAYMENT",
        }
    );
    res.status(response.statusCode).json(response);
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const ecommUserId = req.user?.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findFirst({
        where: { id, ecommUserId },
        include: { items: true },
    });

    if (!order) {
        throw new CustomError(404, "Order not found");
    }

    if (!OrderService.canCancelOrder(order.status)) {
        throw new CustomError(
            400,
            `Cannot cancel order with status: ${order.status}`
        );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: "CANCELLED" },
    });

    // Restore inventory if order was confirmed
    if (order.status === "CONFIRMED" || order.status === "PROCESSING") {
        for (const item of order.items) {
            await prisma.inventoryItem.update({
                where: { id: item.inventoryItemId },
                data: { currentStock: { increment: item.quantity } },
            });
        }
    }

    // Publish order cancelled event
    const publisher = new OrderCancelledPublisher(kafkaWrapper.producer);

    await publisher.publish({
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        ecommUserId: updatedOrder.ecommUserId,
        totalAmount: Number(updatedOrder.totalAmount),
        cancelledAt: new Date().toISOString(),
        cancelReason: reason,
        refundRequired: order.status === "CONFIRMED",
    });

    logger.info("Order cancelled", LogCategory.ECOMMERCE, {
        orderId: id,
        orderNumber: order.orderNumber,
        ecommUserId,
        reason,
    });

    const response = new CustomResponse(
        200,
        "Order cancelled successfully",
        updatedOrder
    );
    res.status(response.statusCode).json(response);
});

export const returnOrder = asyncHandler(async (req: Request, res: Response) => {
    const ecommUserId = req.user?.userId;
    const { id } = req.params;
    const { reason, items } = req.body;

    const order = await prisma.order.findFirst({
        where: { id, ecommUserId },
        include: {
            items: {
                include: { inventoryItem: true },
            },
        },
    });

    if (!order) {
        throw new CustomError(404, "Order not found");
    }

    if (
        !OrderService.canReturnOrder(
            order.status,
            order.deliveredAt || undefined
        )
    ) {
        throw new CustomError(
            400,
            "Order cannot be returned. Either not delivered or return window expired."
        );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: "RETURNED" },
    });

    // Restore inventory
    for (const item of order.items) {
        await prisma.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: { currentStock: { increment: item.quantity } },
        });
    }

    // Publish order returned event
    const publisher = new OrderReturnedPublisher(kafkaWrapper.producer);

    await publisher.publish({
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        ecommUserId: updatedOrder.ecommUserId,
        totalAmount: Number(updatedOrder.totalAmount),
        returnedAt: new Date().toISOString(),
        returnReason: reason,
        refundAmount: Number(updatedOrder.totalAmount),
        items: order.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            productName: item.inventoryItem.name,
            quantity: item.quantity,
        })),
    });

    logger.info("Order returned", LogCategory.ECOMMERCE, {
        orderId: id,
        orderNumber: order.orderNumber,
        ecommUserId,
        reason,
    });

    const response = new CustomResponse(
        200,
        "Order return initiated successfully",
        updatedOrder
    );
    res.status(response.statusCode).json(response);
});

export const trackOrder = asyncHandler(async (req: Request, res: Response) => {
    const ecommUserId = req.user?.userId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
        where: { id, ecommUserId },
        select: {
            id: true,
            orderNumber: true,
            status: true,
            trackingNumber: true,
            courierService: true,
            expectedDelivery: true,
            deliveredAt: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!order) {
        throw new CustomError(404, "Order not found");
    }

    const trackingInfo = {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        courierService: order.courierService,
        expectedDelivery: order.expectedDelivery,
        deliveredAt: order.deliveredAt,
        timeline: [
            {
                status: "PENDING",
                timestamp: order.createdAt,
                description: "Order placed",
            },
        ],
    };

    const response = new CustomResponse(
        200,
        "Order tracking information",
        trackingInfo
    );
    res.status(response.statusCode).json(response);
});
