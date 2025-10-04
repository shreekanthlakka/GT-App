import { LogCategory, logger } from "@repo/common-backend/logger";
import {
    asyncHandler,
    buildSearchFilter,
    buildSortFilter,
    calculatePagination,
    CustomError,
    CustomResponse,
} from "@repo/common-backend/utils";
import {
    IdParamSchema,
    IdParamType,
    PaginationSchema,
    PaginationType,
} from "@repo/common/schemas";

import { prisma } from "@repo/db/prisma";

export const getUsers = asyncHandler(async (req, res) => {
    const query: PaginationType = PaginationSchema.parse(req.query);

    const searchFilter = buildSearchFilter(query.search, ["name", "email"]);
    const sortFilter = buildSortFilter(query.sortBy, query.sortOrder);

    // Count total users
    const total = await prisma.user.count({
        where: {
            ...searchFilter,
        },
    });

    const { skip, take, pagination } = calculatePagination(
        query.page,
        query.limit,
        total
    );

    // Get users
    const users = await prisma.user.findMany({
        where: {
            ...searchFilter,
        },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: sortFilter,
        skip,
        take,
    });

    logger.info("Users retrieved", LogCategory.SYSTEM, {
        count: users.length,
        total,
        requestedBy: req.user?.userId,
    });

    const response = new CustomResponse(200, "Users retrieved successfully", {
        users,
        pagination,
    });

    res.status(response.statusCode).json(response);
});

export const getUserById = asyncHandler(async (req, res) => {
    const params: IdParamType = IdParamSchema.parse(req.params);

    const user = await prisma.user.findUnique({
        where: { id: params.id },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new CustomError(404, "User not found");
    }

    const response = new CustomResponse(200, "User retrieved successfully", {
        user,
    });
    res.status(response.statusCode).json(response);
});

export const updateUserRole = asyncHandler(async (req, res) => {
    const params: IdParamType = IdParamSchema.parse(req.params);
    const { role } = req.body;

    if (!["OWNER", "MANAGER", "STAFF", "VIEWER", "ACCOUNTANT"].includes(role)) {
        throw new CustomError(400, "Invalid role");
    }

    const updatedUser = await prisma.user.update({
        where: { id: params.id },
        data: { role },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            updatedAt: true,
        },
    });

    logger.info("User role updated", LogCategory.SYSTEM, {
        userId: params.id,
        newRole: role,
        updatedBy: req.user?.userId,
    });

    // Audit log
    logger.audit(
        "UPDATE",
        "User",
        params.id,
        req.user?.userId,
        null,
        { role },
        {
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        }
    );

    const response = new CustomResponse(200, "User role updated successfully", {
        user: updatedUser,
    });

    res.status(response.statusCode).json(response);
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
    const params: IdParamType = IdParamSchema.parse(req.params);
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
        throw new CustomError(400, "isActive must be a boolean");
    }

    const updatedUser = await prisma.user.update({
        where: { id: params.id },
        data: { isActive },
        select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            updatedAt: true,
        },
    });

    logger.info(
        `User ${isActive ? "activated" : "deactivated"}`,
        LogCategory.SYSTEM,
        {
            userId: params.id,
            isActive,
            updatedBy: req.user?.userId,
        }
    );

    const response = new CustomResponse(
        200,
        `User ${isActive ? "activated" : "deactivated"} successfully`,
        { user: updatedUser }
    );

    res.status(response.statusCode).json(response);
});

export const getUserSession = asyncHandler(async (req, res) => {
    const params: IdParamType = IdParamSchema.parse(req.params);

    const sessions = await prisma.userSession.findMany({
        where: { userId: params.id },
        select: {
            id: true,
            deviceInfo: true,
            ipAddress: true,
            userAgent: true,
            isActive: true,
            createdAt: true,
            expiresAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10, // Last 10 sessions
    });

    const response = new CustomResponse(
        200,
        "User sessions retrieved successfully",
        {
            sessions,
        }
    );

    res.status(response.statusCode).json(response);
});

export const terminateUserSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    await prisma.userSession.update({
        where: { id: sessionId },
        data: { isActive: false },
    });

    logger.info("User session terminated", LogCategory.SECURITY, {
        sessionId,
        terminatedBy: req.user?.userId,
    });

    const response = new CustomResponse(200, "Session terminated successfully");
    res.status(response.statusCode).json(response);
});
