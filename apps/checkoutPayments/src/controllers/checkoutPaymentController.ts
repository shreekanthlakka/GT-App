// ========================================
// apps/payment/src/controllers/paymentController.ts
// ========================================

import {
    asyncHandler,
    CustomError,
    CustomResponse,
} from "@repo/common-backend/utils";
import { Request, Response } from "express";
import { PaymentService } from "../services/paymentService";
import {
    OnlinePaymentInitiatedPublisher,
    OnlinePaymentSucceededPublisher,
    OnlinePaymentFailedPublisher,
    OnlinePaymentRefundedPublisher,
} from "../events/publishers/paymentPublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import { LogCategory, logger } from "@repo/common-backend/logger";
import { prisma } from "@repo/db/prisma";

/**
 * Initiate payment
 * POST /api/payment/initiate
 */
export const initiatePayment = asyncHandler(async (req, res) => {
    const ecommUserId = req.user?.userId;
    const { orderId, paymentMethod } = req.body;

    if (!ecommUserId) {
        throw new CustomError(401, "Authentication required");
    }

    // Validate payment method
    if (!PaymentService.isValidPaymentMethod(paymentMethod)) {
        throw new CustomError(400, "Invalid payment method");
    }

    // Get order details
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            ecommerceUserId: ecommUserId,
        },
        include: {
            ecommerceUser: true,
        },
    });

    if (!order) {
        throw new CustomError(404, "Order not found");
    }

    const amount = Number(order.totalAmount);

    // Calculate processing fee
    const processingFee = PaymentService.calculateProcessingFee(
        amount,
        paymentMethod
    );

    // Initiate payment
    const paymentData = await PaymentService.initiatePayment(
        orderId,
        amount,
        paymentMethod,
        ecommUserId
    );

    // Publish payment initiated event
    const publisher = new OnlinePaymentInitiatedPublisher(
        kafkaWrapper.producer
    );

    await publisher.publish({
        paymentId: paymentData.paymentId,
        orderId: order.id,
        orderNumber: order.orderNo,
        ecommUserId: order.ecommerceUserId!,
        customerEmail: order.ecommerceUser?.email,
        customerName: order.ecommerceUser?.name,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod,
        gatewayOrderId: paymentData.gatewayOrderId,
        processingFee,
        initiatedAt: new Date().toISOString(),
    });

    logger.info("Payment initiated", LogCategory.ECOMMERCE, {
        paymentId: paymentData.paymentId,
        orderId,
        ecommUserId,
        amount,
        paymentMethod,
    });

    const response = new CustomResponse(200, "Payment initiated successfully", {
        paymentId: paymentData.paymentId,
        gatewayOrderId: paymentData.gatewayOrderId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        processingFee,
    });
    res.status(response.statusCode).json(response);
});

/**
 * Verify payment
 * POST /api/payment/verify
 */
export const verifyPayment = asyncHandler(async (req, res) => {
    const ecommUserId = req.user?.userId;
    const { paymentId, gatewayPaymentId, gatewaySignature } = req.body;

    if (!ecommUserId) {
        throw new CustomError(401, "Authentication required");
    }

    // Verify payment
    const { success, payment, order } = await PaymentService.verifyPayment(
        paymentId,
        gatewayPaymentId,
        gatewaySignature
    );

    if (!success) {
        throw new CustomError(400, "Payment verification failed");
    }

    // Verify ownership
    if (order.ecommerceUserId !== ecommUserId) {
        throw new CustomError(403, "Unauthorized access to payment");
    }

    // Publish payment succeeded event
    const publisher = new OnlinePaymentSucceededPublisher(
        kafkaWrapper.producer
    );

    await publisher.publish({
        paymentId: payment.id,
        orderId: order.id,
        orderNumber: order.orderNo,
        ecommUserId: order.ecommerceUserId,
        customerEmail: order.ecommerceUser.email,
        customerName: order.ecommerceUser.name,
        amount: Number(payment.amount),
        paymentMethod: payment.method,
        gatewayPaymentId: payment.gatewayPaymentId,
        transactionId: payment.transactionId,
        succeededAt: new Date().toISOString(),
    });

    logger.info("Payment verified successfully", LogCategory.ECOMMERCE, {
        paymentId,
        orderId: order.id,
        ecommUserId,
        amount: Number(payment.amount),
    });

    const response = new CustomResponse(200, "Payment verified successfully", {
        paymentId: payment.id,
        orderId: order.id,
        orderNumber: order.orderNo,
        status: payment.status,
        amount: Number(payment.amount),
        transactionId: payment.transactionId,
    });
    res.status(response.statusCode).json(response);
});

/**
 * Handle payment failure
 * POST /api/payment/failure
 */
export const handlePaymentFailure = asyncHandler(async (req, res) => {
    const ecommUserId = req.user?.userId;
    const { paymentId, failureReason } = req.body;

    if (!ecommUserId) {
        throw new CustomError(401, "Authentication required");
    }

    // Get payment details
    const payment = await PaymentService.getPaymentDetails(paymentId);

    // Verify ownership
    if (payment.order.ecommerceUserId !== ecommUserId) {
        throw new CustomError(403, "Unauthorized access to payment");
    }

    // Handle failure
    await PaymentService.handlePaymentFailure(paymentId, failureReason);

    // Publish payment failed event
    const publisher = new OnlinePaymentFailedPublisher(kafkaWrapper.producer);

    await publisher.publish({
        paymentId: payment.id,
        orderId: payment.orderId,
        orderNumber: payment.order.orderNo,
        ecommUserId: payment.order.ecommerceUserId,
        customerEmail: payment.order.ecommerceUser.email,
        customerName: payment.order.ecommerceUser.name,
        amount: Number(payment.amount),
        paymentMethod: payment.method,
        failureReason,
        failedAt: new Date().toISOString(),
    });

    logger.warn("Payment failed", LogCategory.ECOMMERCE, {
        paymentId,
        orderId: payment.orderId,
        ecommUserId,
        failureReason,
    });

    const response = new CustomResponse(200, "Payment failure recorded", {
        paymentId,
        status: "FAILED",
        message:
            "Payment failed. Please try again or use a different payment method.",
    });
    res.status(response.statusCode).json(response);
});

/**
 * Process refund
 * POST /api/payment/refund
 */
export const processRefund = asyncHandler(async (req, res) => {
    const ecommUserId = req.user?.userId;
    const { paymentId, refundAmount, refundReason } = req.body;

    if (!ecommUserId) {
        throw new CustomError(401, "Authentication required");
    }

    // Get payment details
    const payment = await PaymentService.getPaymentDetails(paymentId);

    // Verify ownership
    if (payment.order.ecommerceUserId !== ecommUserId) {
        throw new CustomError(403, "Unauthorized access to payment");
    }

    // Process refund
    const refund = await PaymentService.processRefund(
        paymentId,
        refundAmount,
        refundReason
    );

    // Publish refund event
    const publisher = new OnlinePaymentRefundedPublisher(kafkaWrapper.producer);

    await publisher.publish({
        paymentId: payment.id,
        orderId: payment.orderId,
        orderNumber: payment.order.orderNo,
        ecommUserId: payment.order.ecommerceUserId,
        customerEmail: payment.order.ecommerceUser.email,
        customerName: payment.order.ecommerceUser.name,
        originalAmount: Number(payment.amount),
        refundAmount,
        refundReason,
        refundId: refund.refundId,
        refundedAt: new Date().toISOString(),
    });

    logger.info("Payment refund processed", LogCategory.ECOMMERCE, {
        paymentId,
        refundId: refund.refundId,
        orderId: payment.orderId,
        ecommUserId,
        refundAmount,
    });

    const response = new CustomResponse(200, "Refund initiated successfully", {
        refundId: refund.refundId,
        paymentId,
        status: refund.status,
        refundAmount: refund.amount,
        message: "Refund is being processed. It may take 5-7 business days.",
    });
    res.status(response.statusCode).json(response);
});

/**
 * Get payment details
 * GET /api/payment/:paymentId
 */
export const getPaymentDetails = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommUserId = req.user?.userId;
        const { paymentId } = req.params;

        if (!ecommUserId) {
            throw new CustomError(401, "Authentication required");
        }

        const payment = await PaymentService.getPaymentDetails(paymentId);

        // Verify ownership
        if (payment.order.ecommerceUserId !== ecommUserId) {
            throw new CustomError(403, "Unauthorized access to payment");
        }

        const response = new CustomResponse(
            200,
            "Payment details retrieved successfully",
            {
                id: payment.id,
                orderId: payment.orderId,
                orderNumber: payment.order.orderNo,
                amount: Number(payment.amount),
                method: payment.method,
                status: payment.status,
                gatewayOrderId: payment.gatewayOrderId,
                gatewayPaymentId: payment.gatewayPaymentId,
                transactionId: payment.transactionId,
                failureReason: payment.failureReason,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt,
            }
        );
        res.status(response.statusCode).json(response);
    }
);

/**
 * Get payment history for an order
 * GET /api/payment/order/:orderId
 */
export const getOrderPayments = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommUserId = req.user?.userId;
        const { orderId } = req.params;

        if (!ecommUserId) {
            throw new CustomError(401, "Authentication required");
        }

        // Verify order ownership
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                ecommerceUserId: ecommUserId,
            },
        });

        if (!order) {
            throw new CustomError(404, "Order not found");
        }

        const payments = await PaymentService.getOrderPayments(orderId);

        const response = new CustomResponse(
            200,
            "Payment history retrieved successfully",
            {
                orderId,
                orderNumber: order.orderNo,
                payments: payments.map((p) => ({
                    id: p.id,
                    amount: Number(p.amount),
                    method: p.method,
                    status: p.status,
                    transactionId: p.transactionId,
                    failureReason: p.failureReason,
                    createdAt: p.createdAt,
                })),
            }
        );
        res.status(response.statusCode).json(response);
    }
);

/**
 * Webhook handler for payment gateway callbacks
 * POST /api/payment/webhook
 *
 * IMPORTANT: This publishes events after processing webhooks!
 */
export const handleWebhook = asyncHandler(
    async (req: Request, res: Response) => {
        const event = req.headers["x-webhook-event"] as string;
        const payload = req.body;

        // Verify webhook signature
        // TODO: Implement gateway-specific signature verification
        // For Razorpay: verify webhook signature
        // For Stripe: use stripe.webhooks.constructEvent()

        logger.info("Webhook received", LogCategory.ECOMMERCE, {
            event,
            payload,
        });

        // Process webhook and get result
        const result = await PaymentService.handleWebhook(event, payload);

        // Publish appropriate event based on webhook type
        if (result) {
            switch (event) {
                case "payment.captured":
                case "payment.success":
                case "payment_intent.succeeded":
                    // Payment succeeded - publish event
                    const successPublisher =
                        new OnlinePaymentSucceededPublisher(
                            kafkaWrapper.producer
                        );
                    await successPublisher.publish({
                        paymentId: result.paymentId,
                        orderId: result.orderId,
                        orderNumber: result.orderNumber,
                        ecommUserId: result.ecommUserId,
                        customerEmail: result.customerEmail,
                        customerName: result.customerName,
                        amount: result.amount,
                        paymentMethod: result.paymentMethod,
                        gatewayPaymentId: result.gatewayPaymentId,
                        transactionId: result.transactionId,
                        succeededAt: new Date().toISOString(),
                    });
                    logger.info(
                        "Payment success event published from webhook",
                        LogCategory.ECOMMERCE,
                        {
                            paymentId: result.paymentId,
                        }
                    );
                    break;

                case "payment.failed":
                case "payment_intent.payment_failed":
                    // Payment failed - publish event
                    const failurePublisher = new OnlinePaymentFailedPublisher(
                        kafkaWrapper.producer
                    );
                    await failurePublisher.publish({
                        paymentId: result.paymentId,
                        orderId: result.orderId,
                        orderNumber: result.orderNumber,
                        ecommUserId: result.ecommUserId,
                        customerEmail: result.customerEmail,
                        customerName: result.customerName,
                        amount: result.amount,
                        paymentMethod: result.paymentMethod,
                        failureReason: result.failureReason || "Payment failed",
                        failedAt: new Date().toISOString(),
                    });
                    logger.info(
                        "Payment failure event published from webhook",
                        LogCategory.ECOMMERCE,
                        {
                            paymentId: result.paymentId,
                        }
                    );
                    break;

                case "refund.processed":
                case "charge.refunded":
                    // Refund completed - publish event
                    const refundPublisher = new OnlinePaymentRefundedPublisher(
                        kafkaWrapper.producer
                    );
                    await refundPublisher.publish({
                        paymentId: result.paymentId,
                        orderId: result.orderId,
                        orderNumber: result.orderNumber,
                        ecommUserId: result.ecommUserId,
                        customerEmail: result.customerEmail,
                        customerName: result.customerName,
                        originalAmount: result.originalAmount,
                        refundAmount: result.refundAmount,
                        refundReason: result.refundReason || "Refund processed",
                        refundId: result.refundId,
                        refundedAt: new Date().toISOString(),
                    });
                    logger.info(
                        "Refund event published from webhook",
                        LogCategory.ECOMMERCE,
                        {
                            paymentId: result.paymentId,
                            refundId: result.refundId,
                        }
                    );
                    break;

                default:
                    logger.info(
                        "Unhandled webhook event type",
                        LogCategory.ECOMMERCE,
                        {
                            event,
                        }
                    );
            }
        }

        const response = new CustomResponse(200, "Webhook processed", {
            received: true,
            eventPublished: !!result,
        });
        res.status(response.statusCode).json(response);
    }
);
