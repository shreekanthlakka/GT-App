// // notification-service/src/controllers/dashboardController.ts
// import { prisma } from "@repo/db/prisma";
// import {
//     asyncHandler,
//     CustomResponse,
//     CustomError,
// } from "@repo/common-backend/utils";

// export const getDashboardStats = asyncHandler(async (req, res) => {
//     const userId = req.user!.userId;
//     const { period = "7d" } = req.query;

//     const startDate = new Date();
//     switch (period) {
//         case "1d":
//             startDate.setDate(startDate.getDate() - 1);
//             break;
//         case "7d":
//             startDate.setDate(startDate.getDate() - 7);
//             break;
//         case "30d":
//             startDate.setDate(startDate.getDate() - 30);
//             break;
//     }

//     const [
//         totalNotifications,
//         deliveredNotifications,
//         failedNotifications,
//         channelBreakdown,
//     ] = await Promise.all([
//         prisma.notification.count({
//             where: { userId, createdAt: { gte: startDate } },
//         }),
//         prisma.notification.count({
//             where: {
//                 userId,
//                 status: { in: ["DELIVERED", "READ"] },
//                 createdAt: { gte: startDate },
//             },
//         }),
//         prisma.notification.count({
//             where: {
//                 userId,
//                 status: "FAILED",
//                 createdAt: { gte: startDate },
//             },
//         }),
//         prisma.notification.groupBy({
//             by: ["channel"],
//             _count: { id: true },
//             where: { userId, createdAt: { gte: startDate } },
//         }),
//     ]);

//     const deliveryRate =
//         totalNotifications > 0
//             ? ((deliveredNotifications / totalNotifications) * 100).toFixed(2)
//             : 0;

//     res.json(
//         new CustomResponse(200, "Dashboard statistics retrieved successfully", {
//             overview: {
//                 total: totalNotifications,
//                 delivered: deliveredNotifications,
//                 failed: failedNotifications,
//                 deliveryRate: parseFloat(deliveryRate as string),
//             },
//             channelBreakdown: channelBreakdown.map((item) => ({
//                 channel: item.channel,
//                 count: item._count.id,
//             })),
//             period,
//         })
//     );
// });

// notification-service/src/controllers/dashboardController.ts
import { Request, Response } from "express";
import { prisma } from "@repo/db/prisma";
import { asyncHandler, CustomResponse } from "@repo/common-backend/utils";

export const getDashboardStats = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { period } = req.parsedQuery;

        const startDate = new Date();
        switch (period) {
            case "1d":
                startDate.setDate(startDate.getDate() - 1);
                break;
            case "7d":
                startDate.setDate(startDate.getDate() - 7);
                break;
            case "30d":
                startDate.setDate(startDate.getDate() - 30);
                break;
            case "90d":
                startDate.setDate(startDate.getDate() - 90);
                break;
        }

        const [
            totalNotifications,
            deliveredNotifications,
            failedNotifications,
            pendingNotifications,
            channelBreakdown,
        ] = await Promise.all([
            prisma.notification.count({
                where: { userId, createdAt: { gte: startDate } },
            }),
            prisma.notification.count({
                where: {
                    userId,
                    status: { in: ["DELIVERED", "READ"] },
                    createdAt: { gte: startDate },
                },
            }),
            prisma.notification.count({
                where: {
                    userId,
                    status: "FAILED",
                    createdAt: { gte: startDate },
                },
            }),
            prisma.notification.count({
                where: {
                    userId,
                    status: "PENDING",
                    createdAt: { gte: startDate },
                },
            }),
            prisma.notification.groupBy({
                by: ["channel"],
                _count: { id: true },
                where: { userId, createdAt: { gte: startDate } },
            }),
        ]);

        const deliveryRate =
            totalNotifications > 0
                ? ((deliveredNotifications / totalNotifications) * 100).toFixed(
                      2
                  )
                : 0;

        res.json(
            new CustomResponse(
                200,
                "Dashboard statistics retrieved successfully",
                {
                    overview: {
                        total: totalNotifications,
                        delivered: deliveredNotifications,
                        failed: failedNotifications,
                        pending: pendingNotifications,
                        deliveryRate: parseFloat(deliveryRate as string),
                    },
                    channelBreakdown: channelBreakdown.map(
                        (item: (typeof channelBreakdown)[0]) => ({
                            channel: item.channel,
                            count: item._count.id,
                        })
                    ),
                    period,
                }
            )
        );
    }
);

export const getChannelPerformance = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { startDate, endDate } = req.parsedQuery;

        const dateFilter =
            startDate && endDate
                ? {
                      createdAt: {
                          gte: new Date(startDate),
                          lte: new Date(endDate),
                      },
                  }
                : {};

        const channelStats = await prisma.notification.groupBy({
            by: ["channel", "status"],
            _count: { id: true },
            _avg: { retryCount: true },
            where: { userId, ...dateFilter },
            orderBy: { channel: "asc" },
        });

        const formattedStats = channelStats.reduce((acc: any, stat: any) => {
            if (!acc[stat.channel]) {
                acc[stat.channel] = {
                    channel: stat.channel,
                    total: 0,
                    delivered: 0,
                    failed: 0,
                    pending: 0,
                    avgRetries: 0,
                };
            }

            acc[stat.channel].total += stat._count.id;
            acc[stat.channel][stat.status.toLowerCase()] = stat._count.id;
            acc[stat.channel].avgRetries = stat._avg.retryCount || 0;

            return acc;
        }, {});

        res.json(
            new CustomResponse(200, "Channel performance retrieved", {
                performance: Object.values(formattedStats),
            })
        );
    }
);

export const getCostAnalytics = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { period } = req.parsedQuery;

        // Mock cost data - in real implementation, track actual costs
        const mockCosts = {
            email: { costPerMessage: 0.01, count: 1500 },
            sms: { costPerMessage: 0.05, count: 800 },
            whatsapp: { costPerMessage: 0.02, count: 1200 },
        };

        const totalCost = Object.values(mockCosts).reduce(
            (sum, item) => sum + item.costPerMessage * item.count,
            0
        );

        res.json(
            new CustomResponse(200, "Cost analytics retrieved", {
                totalCost: totalCost.toFixed(2),
                breakdown: [
                    {
                        channel: "EMAIL",
                        cost: (
                            mockCosts.email.costPerMessage *
                            mockCosts.email.count
                        ).toFixed(2),
                        count: mockCosts.email.count,
                        costPerMessage: mockCosts.email.costPerMessage,
                    },
                    {
                        channel: "SMS",
                        cost: (
                            mockCosts.sms.costPerMessage * mockCosts.sms.count
                        ).toFixed(2),
                        count: mockCosts.sms.count,
                        costPerMessage: mockCosts.sms.costPerMessage,
                    },
                    {
                        channel: "WHATSAPP",
                        cost: (
                            mockCosts.whatsapp.costPerMessage *
                            mockCosts.whatsapp.count
                        ).toFixed(2),
                        count: mockCosts.whatsapp.count,
                        costPerMessage: mockCosts.whatsapp.costPerMessage,
                    },
                ],
                period,
            })
        );
    }
);

export const getFailureAnalysis = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { days } = req.parsedQuery;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [failureReasons, failuresByChannel] = await Promise.all([
            prisma.notification.groupBy({
                by: ["failureReason"],
                _count: { id: true },
                where: {
                    userId,
                    status: "FAILED",
                    failureReason: { not: null },
                    createdAt: { gte: startDate },
                },
                orderBy: { _count: { id: "desc" } },
            }),
            prisma.notification.groupBy({
                by: ["channel"],
                _count: { id: true },
                where: {
                    userId,
                    status: "FAILED",
                    createdAt: { gte: startDate },
                },
            }),
        ]);

        res.json(
            new CustomResponse(200, "Failure analysis retrieved", {
                failureReasons: failureReasons.map(
                    (item: (typeof failureReasons)[0]) => ({
                        reason: item.failureReason,
                        count: item._count.id,
                    })
                ),
                failuresByChannel: failuresByChannel.map(
                    (item: (typeof failuresByChannel)[0]) => ({
                        channel: item.channel,
                        failures: item._count.id,
                    })
                ),
                period: `${days} days`,
            })
        );
    }
);

export const getDeliveryTrends = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { days, groupBy } = req.parsedQuery;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const trends = await prisma.$queryRaw`
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered,
            COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
            COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending
        FROM notifications 
        WHERE user_id = ${userId}
        AND created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
    `;

        res.json(
            new CustomResponse(200, "Delivery trends retrieved", {
                trends,
                period: `${days} days`,
            })
        );
    }
);

export const getRecentActivity = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { limit } = req.parsedQuery;

        const recentNotifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                title: true,
                channel: true,
                status: true,
                recipientName: true,
                createdAt: true,
                sentAt: true,
                templateName: true,
            },
        });

        res.json(
            new CustomResponse(200, "Recent activity retrieved", {
                notifications: recentNotifications,
            })
        );
    }
);

export const getTopTemplates = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { period, limit } = req.parsedQuery;

        const startDate = new Date();
        switch (period) {
            case "7d":
                startDate.setDate(startDate.getDate() - 7);
                break;
            case "30d":
                startDate.setDate(startDate.getDate() - 30);
                break;
            case "90d":
                startDate.setDate(startDate.getDate() - 90);
                break;
        }

        const topTemplates = await prisma.notification.groupBy({
            by: ["templateName"],
            _count: { id: true },
            _sum: { retryCount: true },
            where: {
                userId,
                templateName: { not: null },
                createdAt: { gte: startDate },
            },
            orderBy: { _count: { id: "desc" } },
            take: limit,
        });

        const templatesWithStats = await Promise.all(
            topTemplates.map(async (template: (typeof topTemplates)[0]) => {
                const [total, delivered] = await Promise.all([
                    prisma.notification.count({
                        where: {
                            userId,
                            templateName: template.templateName,
                            createdAt: { gte: startDate },
                        },
                    }),
                    prisma.notification.count({
                        where: {
                            userId,
                            templateName: template.templateName,
                            status: { in: ["DELIVERED", "READ"] },
                            createdAt: { gte: startDate },
                        },
                    }),
                ]);

                return {
                    templateName: template.templateName,
                    usageCount: template._count.id,
                    totalRetries: template._sum.retryCount || 0,
                    successRate:
                        total > 0
                            ? ((delivered / total) * 100).toFixed(2)
                            : "0",
                    deliveredCount: delivered,
                };
            })
        );

        res.json(
            new CustomResponse(200, "Top templates retrieved", {
                templates: templatesWithStats,
                period,
            })
        );
    }
);
