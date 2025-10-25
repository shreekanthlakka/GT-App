// ========================================
// addressController.ts
// ========================================
import { Request, Response } from "express";
import { prisma } from "@repo/db/prisma";
import {
    asyncHandler,
    CustomError,
    CustomResponse,
} from "@repo/common-backend/utils";
import { logger, LogCategory } from "@repo/common-backend/logger";
import {
    EcommerceUserAddressAddedPublisher,
    EcommerceUserAddressUpdatedPublisher,
    EcommerceUserAddressDeletedPublisher,
} from "../events/publishers/addressPublisher";
import { kafkaWrapper } from "@repo/common-backend/kafka";

export const getAddresses = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;

        const addresses = await prisma.address.findMany({
            where: { ecommerceUserId },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        });

        const response = new CustomResponse(
            200,
            "Addresses retrieved successfully",
            addresses
        );
        res.status(response.statusCode).json(response);
    }
);

export const getAddressById = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const { id } = req.params;

        const address = await prisma.address.findFirst({
            where: { id, ecommerceUserId },
        });

        if (!address) {
            throw new CustomError(404, "Address not found");
        }

        const response = new CustomResponse(
            200,
            "Address retrieved successfully",
            address
        );
        res.status(response.statusCode).json(response);
    }
);

export const createAddress = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const {
            type,
            name,
            phone,
            address,
            city,
            state,
            pincode,
            landmark,
            instructions,
            isDefault,
        } = req.body;

        if (isDefault) {
            await prisma.address.updateMany({
                where: { ecommerceUserId, isDefault: true },
                data: { isDefault: false },
            });
        }

        const newAddress = await prisma.address.create({
            data: {
                ecommerceUserId: ecommerceUserId!,
                type,
                name,
                phone,
                address,
                city,
                state,
                pincode,
                landmark,
                instructions,
                isDefault,
            },
        });

        const publisher = new EcommerceUserAddressAddedPublisher(
            kafkaWrapper.producer
        );
        await publisher.publish({
            ecommerceUserId: ecommerceUserId!,
            addressId: newAddress.id,
            type: newAddress.type,
            city: newAddress.city,
            state: newAddress.state,
            isDefault: newAddress.isDefault,
            addedAt: new Date().toISOString(),
        });

        logger.info("Address created", LogCategory.ECOMMERCE, {
            ecommerceUserId,
            addressId: newAddress.id,
        });

        const response = new CustomResponse(
            201,
            "Address created successfully",
            newAddress
        );
        res.status(response.statusCode).json(response);
    }
);

export const updateAddress = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const { id } = req.params;

        const existingAddress = await prisma.address.findFirst({
            where: { id, ecommerceUserId },
        });

        if (!existingAddress) {
            throw new CustomError(404, "Address not found");
        }

        if (req.body.isDefault) {
            await prisma.address.updateMany({
                where: { ecommerceUserId, isDefault: true, id: { not: id } },
                data: { isDefault: false },
            });
        }

        const updatedAddress = await prisma.address.update({
            where: { id },
            data: req.body,
        });

        const publisher = new EcommerceUserAddressUpdatedPublisher(
            kafkaWrapper.producer
        );
        await publisher.publish({
            ecommerceUserId: ecommerceUserId!,
            addressId: updatedAddress.id,
            type: updatedAddress.type,
            city: updatedAddress.city,
            state: updatedAddress.state,
            isDefault: updatedAddress.isDefault,
            updatedAt: new Date().toISOString(),
            updatedFields: Object.keys(req.body),
        });

        logger.info("Address updated", LogCategory.ECOMMERCE, {
            ecommerceUserId,
            addressId: updatedAddress.id,
        });

        const response = new CustomResponse(
            200,
            "Address updated successfully",
            updatedAddress
        );
        res.status(response.statusCode).json(response);
    }
);

export const deleteAddress = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const { id } = req.params;

        const address = await prisma.address.findFirst({
            where: { id, ecommerceUserId },
        });

        if (!address) {
            throw new CustomError(404, "Address not found");
        }

        await prisma.address.delete({ where: { id } });

        const publisher = new EcommerceUserAddressDeletedPublisher(
            kafkaWrapper.producer
        );
        await publisher.publish({
            ecommerceUserId: ecommerceUserId!,
            addressId: id,
            type: address.type,
            deletedAt: new Date().toISOString(),
        });

        logger.info("Address deleted", LogCategory.ECOMMERCE, {
            ecommerceUserId,
            addressId: id,
        });

        const response = new CustomResponse(
            200,
            "Address deleted successfully",
            null
        );
        res.status(response.statusCode).json(response);
    }
);

export const setDefaultAddress = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const { id } = req.params;

        const address = await prisma.address.findFirst({
            where: { id, ecommerceUserId },
        });

        if (!address) {
            throw new CustomError(404, "Address not found");
        }

        await prisma.address.updateMany({
            where: { ecommerceUserId, isDefault: true },
            data: { isDefault: false },
        });

        const updatedAddress = await prisma.address.update({
            where: { id },
            data: { isDefault: true },
        });

        logger.info("Default address set", LogCategory.ECOMMERCE, {
            ecommerceUserId,
            addressId: id,
        });

        const response = new CustomResponse(
            200,
            "Default address set successfully",
            updatedAddress
        );
        res.status(response.statusCode).json(response);
    }
);
