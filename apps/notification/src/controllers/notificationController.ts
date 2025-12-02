// // notification-service/src/controllers/notificationController.ts
// import { Request, Response } from "express";
// import { prisma } from "@repo/db/prisma";
// import {
//     asyncHandler,
//     CustomResponse,
//     CustomError,
// } from "@repo/common-backend/utils";
// // import { z } from "zod";

// // const GetNotificationsSchema = z.object({
// //     page: z.string().transform(Number).optional().default(1),
// //     limit: z.string().transform(Number).optional().default(50),
// //     channel: z.enum(["EMAIL", "SMS", "WHATSAPP", "PUSH", "IN_APP"]).optional(),
// //     status: z
// //         .enum(["PENDING", "SENT", "DELIVERED", "READ", "FAILED", "CANCELLED"])
// //         .optional(),
// //     type: z.string().optional(),
// //     recipientType: z.enum(["CUSTOMER", "PARTY", "USER"]).optional(),
// //     recipientId: z.string().optional(),
// //     startDate: z.string().datetime().optional(),
// //     endDate: z.string().datetime().optional(),
// //     sortBy: z
// //         .enum(["createdAt", "sentAt", "status", "type"])
// //         .optional()
// //         .default("createdAt"),
// //     sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
// // });

// export const getNotifications = asyncHandler(async (req, res) => {
//     const userId = req.user!.userId;
//     const params = req.query;

//     const where = {
//         userId,
//         ...(params.channel && { channel: params.channel }),
//         ...(params.status && { status: params.status }),
//         ...(params.type && { type: params.type }),
//         ...(params.recipientType && {
//             recipientType: params.recipientType,
//         }),
//         ...(params.recipientId && { recipientId: params.recipientId }),
//         ...(params.startDate &&
//             params.endDate && {
//                 createdAt: {
//                     gte: new Date(params.startDate),
//                     lte: new Date(params.endDate),
//                 },
//             }),
//     };

//     const [notifications, total] = await Promise.all([
//         prisma.notification.findMany({
//             where,
//             skip: (params.page - 1) * params.limit,
//             take: params.limit,
//             orderBy: { [params.sortBy]: params.sortOrder },
//         }),
//         prisma.notification.count({ where }),
//     ]);

//     res.json(
//         new CustomResponse(200, "Notifications retrieved successfully", {
//             notifications,
//             pagination: {
//                 currentPage: params.page,
//                 totalPages: Math.ceil(total / params.limit),
//                 totalItems: total,
//                 itemsPerPage: params.limit,
//                 hasNextPage: params.page < Math.ceil(total / params.limit),
//                 hasPrevPage: params.page > 1,
//             },
//         })
//     );
// });

// export const getNotificationById = asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     const userId = req.user!.userId;

//     const notification = await prisma.notification.findFirst({
//         where: { id, userId },
//     });

//     if (!notification) {
//         throw new CustomError(404, "Notification not found");
//     }

//     res.json(
//         new CustomResponse(200, "Notification retrieved successfully", {
//             notification,
//         })
//     );
// });

// export const markAsRead = asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     const userId = req.user!.userId;

//     const notification = await prisma.notification.findFirst({
//         where: { id, userId },
//     });

//     if (!notification) {
//         throw new CustomError(404, "Notification not found");
//     }

//     const updatedNotification = await prisma.notification.update({
//         where: { id },
//         data: {
//             status: "READ",
//             readAt: new Date(),
//         },
//     });

//     res.json(
//         new CustomResponse(200, "Notification marked as read", {
//             notification: updatedNotification,
//         })
//     );
// });

// export const resendNotification = asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     const userId = req.user!.userId;

//     const notification = await prisma.notification.findFirst({
//         where: { id, userId },
//     });

//     if (!notification) {
//         throw new CustomError(404, "Notification not found");
//     }

//     if (notification.status === "DELIVERED" || notification.status === "READ") {
//         throw new CustomError(
//             400,
//             "Cannot resend already delivered notification"
//         );
//     }

//     const updatedNotification = await prisma.notification.update({
//         where: { id },
//         data: {
//             status: "PENDING",
//             retryCount: (notification.retryCount || 0) + 1,
//             failureReason: null,
//             sentAt: null,
//             deliveredAt: null,
//         },
//     });

//     // Here you would republish to Kafka topic for reprocessing

//     res.json(
//         new CustomResponse(200, "Notification queued for resending", {
//             notification: updatedNotification,
//         })
//     );
// });

// export const getNotificationStats = asyncHandler(
//     async (req: Request, res: Response) => {
//         const userId = req.user!.userId;
//         const { startDate, endDate } = req.query;

//         const dateFilter =
//             startDate && endDate
//                 ? {
//                       createdAt: {
//                           gte: new Date(startDate as string),
//                           lte: new Date(endDate as string),
//                       },
//                   }
//                 : {};

//         const [totalStats, channelStats, statusStats] = await Promise.all([
//             prisma.notification.groupBy({
//                 by: [],
//                 _count: { id: true },
//                 _sum: { retryCount: true },
//                 where: { userId, ...dateFilter },
//             }),
//             prisma.notification.groupBy({
//                 by: ["channel"],
//                 _count: { id: true },
//                 where: { userId, ...dateFilter },
//             }),
//             prisma.notification.groupBy({
//                 by: ["status"],
//                 _count: { id: true },
//                 where: { userId, ...dateFilter },
//             }),
//         ]);

//         res.json(
//             new CustomResponse(
//                 200,
//                 "Notification statistics retrieved successfully",
//                 {
//                     overview: {
//                         total: totalStats[0]?._count.id || 0,
//                         totalRetries: totalStats[0]?._sum.retryCount || 0,
//                     },
//                     byChannel: channelStats.map((stat) => ({
//                         channel: stat.channel,
//                         count: stat._count.id,
//                     })),
//                     byStatus: statusStats.map((stat) => ({
//                         status: stat.status,
//                         count: stat._count.id,
//                     })),
//                 }
//             )
//         );
//     }
// );

// notification-service/src/controllers/notificationController.ts
import { prisma } from "@repo/db/prisma";
import {
    asyncHandler,
    CustomResponse,
    CustomError,
} from "@repo/common-backend/utils";

export const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const params = req.parsedQuery;

    const where: any = {
        userId,
        ...(params.channel && { channel: params.channel }),
        ...(params.status && { status: params.status }),
        ...(params.type && { type: params.type }),
        ...(params.recipientType && {
            recipientType: params.recipientType,
        }),
        ...(params.recipientId && { recipientId: params.recipientId }),
        ...(params.startDate &&
            params.endDate && {
                createdAt: {
                    gte: new Date(params.startDate),
                    lte: new Date(params.endDate),
                },
            }),
    };

    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where,
            skip: (params.page - 1) * params.limit,
            take: params.limit,
            orderBy: { [params.sortBy]: params.sortOrder },
        }),
        prisma.notification.count({ where }),
    ]);

    res.json(
        new CustomResponse(200, "Notifications retrieved successfully", {
            notifications,
            pagination: {
                currentPage: params.page,
                totalPages: Math.ceil(total / params.limit),
                totalItems: total,
                itemsPerPage: params.limit,
                hasNextPage: params.page < Math.ceil(total / params.limit),
                hasPrevPage: params.page > 1,
            },
        })
    );
});

export const getNotificationById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const notification = await prisma.notification.findFirst({
        where: { id, userId },
    });

    if (!notification) {
        throw new CustomError(404, "Notification not found");
    }

    res.json(
        new CustomResponse(200, "Notification retrieved successfully", {
            notification,
        })
    );
});

export const updateNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const updateData = req.parsedBody;

    const notification = await prisma.notification.findFirst({
        where: { id, userId },
    });

    if (!notification) {
        throw new CustomError(404, "Notification not found");
    }

    const updatedNotification = await prisma.notification.update({
        where: { id },
        data: updateData,
    });

    res.json(
        new CustomResponse(200, "Notification updated successfully", {
            notification: updatedNotification,
        })
    );
});

export const deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const notification = await prisma.notification.findFirst({
        where: { id, userId },
    });

    if (!notification) {
        throw new CustomError(404, "Notification not found");
    }

    await prisma.notification.delete({
        where: { id },
    });

    res.json(new CustomResponse(200, "Notification deleted successfully"));
});

export const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const notification = await prisma.notification.findFirst({
        where: { id, userId },
    });

    if (!notification) {
        throw new CustomError(404, "Notification not found");
    }

    const updatedNotification = await prisma.notification.update({
        where: { id },
        data: {
            status: "READ",
            readAt: new Date(),
        },
    });

    res.json(
        new CustomResponse(200, "Notification marked as read", {
            notification: updatedNotification,
        })
    );
});

export const resendNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const notification = await prisma.notification.findFirst({
        where: { id, userId },
    });

    if (!notification) {
        throw new CustomError(404, "Notification not found");
    }

    if (notification.status === "DELIVERED" || notification.status === "READ") {
        throw new CustomError(
            400,
            "Cannot resend already delivered notification"
        );
    }

    const updatedNotification = await prisma.notification.update({
        where: { id },
        data: {
            status: "PENDING",
            retryCount: (notification.retryCount || 0) + 1,
            failureReason: null,
            sentAt: null,
            deliveredAt: null,
        },
    });

    res.json(
        new CustomResponse(200, "Notification queued for resending", {
            notification: updatedNotification,
        })
    );
});

export const bulkUpdateNotifications = asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { ids, action, status } = req.parsedBody;

    let updateData: any = {};

    switch (action) {
        case "mark_as_read":
            updateData = { status: "READ", readAt: new Date() };
            break;
        case "cancel":
            updateData = { status: "CANCELLED" };
            break;
        case "reset_for_retry":
            updateData = {
                status: "PENDING",
                retryCount: 0,
                failureReason: null,
            };
            break;
        default:
            if (status) {
                updateData = { status };
            }
    }

    const updated = await prisma.notification.updateMany({
        where: {
            id: { in: ids },
            userId,
        },
        data: updateData,
    });

    res.json(
        new CustomResponse(
            200,
            `${updated.count} notifications updated successfully`,
            {
                updatedCount: updated.count,
                action,
                ids,
            }
        )
    );
});

export const searchNotifications = asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { q, status, channel, type, page, limit } = req.parsedQuery;

    const searchConditions = [];

    if (q) {
        searchConditions.push({
            OR: [
                { title: { contains: q, mode: "insensitive" } },
                { message: { contains: q, mode: "insensitive" } },
                { recipientName: { contains: q, mode: "insensitive" } },
                { recipientContact: { contains: q, mode: "insensitive" } },
            ],
        });
    }

    const where: any = {
        userId,
        ...(status && { status }),
        ...(channel && { channel }),
        ...(type && { type }),
        ...(searchConditions.length > 0 && { AND: searchConditions }),
    };

    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.notification.count({ where }),
    ]);

    res.json(
        new CustomResponse(200, "Search results retrieved successfully", {
            notifications,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
            },
            searchQuery: q,
        })
    );
});

export const getNotificationStats = asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { startDate, endDate, groupBy } = req.parsedQuery;

    const dateFilter =
        startDate && endDate
            ? {
                  createdAt: {
                      gte: new Date(startDate),
                      lte: new Date(endDate),
                  },
              }
            : {};

    const [totalStats, channelStats, statusStats, typeStats] =
        await Promise.all([
            prisma.notification.groupBy({
                by: ["id"],
                _count: { id: true },
                _sum: { retryCount: true },
                where: { userId, ...dateFilter },
            }),
            prisma.notification.groupBy({
                by: ["channel"],
                _count: { id: true },
                where: { userId, ...dateFilter },
            }),
            prisma.notification.groupBy({
                by: ["status"],
                _count: { id: true },
                where: { userId, ...dateFilter },
            }),
            prisma.notification.groupBy({
                by: ["type"],
                _count: { id: true },
                where: { userId, ...dateFilter },
            }),
        ]);

    res.json(
        new CustomResponse(
            200,
            "Notification statistics retrieved successfully",
            {
                overview: {
                    total: totalStats[0]?._count.id || 0,
                    totalRetries: totalStats[0]?._sum.retryCount || 0,
                },
                byChannel: channelStats.map(
                    (stat: (typeof channelStats)[0]) => ({
                        channel: stat.channel,
                        count: stat._count.id,
                    })
                ),
                byStatus: statusStats.map((stat: (typeof statusStats)[0]) => ({
                    status: stat.status,
                    count: stat._count.id,
                })),
                byType: typeStats.map((stat: (typeof typeStats)[0]) => ({
                    type: stat.type,
                    count: stat._count.id,
                })),
            }
        )
    );
});
