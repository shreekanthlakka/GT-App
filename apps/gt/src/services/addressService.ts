// ========================================
// apps/ecommerce/src/services/addressService.ts (FIXED)
// ========================================
import { prisma } from "@repo/db/prisma";
import { CustomError } from "@repo/common-backend/utils";
import { Address } from "@repo/db/prisma";

export class AddressService {
    /**
     * Get default shipping address
     */
    static async getDefaultShippingAddress(
        ecommerceUserId: string
    ): Promise<Address | null> {
        return await prisma.address.findFirst({
            where: {
                ecommerceUserId,
                isDefault: true,
                type: { in: ["SHIPPING", "BOTH"] },
            },
        });
    }

    /**
     * Get default billing address
     */
    static async getDefaultBillingAddress(
        ecommerceUserId: string
    ): Promise<Address | null> {
        return await prisma.address.findFirst({
            where: {
                ecommerceUserId,
                isDefault: true,
                type: { in: ["BILLING", "BOTH"] },
            },
        });
    }

    /**
     * Validate address for shipping
     */
    static async validateAddress(
        addressId: string,
        ecommerceUserId: string
    ): Promise<{ valid: boolean; address: Address }> {
        const address = await prisma.address.findFirst({
            where: { id: addressId, ecommerceUserId },
        });

        if (!address) {
            throw new CustomError(404, "Address not found");
        }

        const requiredFields = [
            "name",
            "phone",
            "address",
            "city",
            "state",
            "pincode",
        ];
        const missingFields = requiredFields.filter(
            (field) => !address[field as keyof typeof address]
        );

        if (missingFields.length > 0) {
            throw new CustomError(
                400,
                `Address incomplete. Missing: ${missingFields.join(", ")}`
            );
        }

        return { valid: true, address };
    }

    /**
     * Calculate shipping cost based on address
     */
    static calculateShippingCost(
        address: { state: string; pincode: string },
        orderTotal: number
    ): number {
        if (orderTotal >= 500) return 0;

        const localStates = ["ANDHRA_PRADESH", "TELANGANA"];
        if (localStates.includes(address.state)) return 40;

        const remotePincodePatterns = /^(7|8|9)/;
        if (remotePincodePatterns.test(address.pincode)) return 100;

        return 60;
    }

    /**
     * Verify pincode serviceability
     */
    static async verifyPincodeServiceability(pincode: string): Promise<{
        serviceable: boolean;
        estimatedDays: number;
        message?: string;
    }> {
        if (!/^\d{6}$/.test(pincode)) {
            return {
                serviceable: false,
                estimatedDays: 0,
                message: "Invalid pincode format",
            };
        }

        const remotePincodePatterns = /^(7|8|9)/;
        if (remotePincodePatterns.test(pincode)) {
            return {
                serviceable: true,
                estimatedDays: 7,
                message: "Delivery to remote areas",
            };
        }

        const localPincodePatterns = /^(5)/;
        if (localPincodePatterns.test(pincode)) {
            return {
                serviceable: true,
                estimatedDays: 3,
                message: "Express delivery available",
            };
        }

        return {
            serviceable: true,
            estimatedDays: 5,
            message: "Standard delivery",
        };
    }

    /**
     * Format address for display
     */
    static formatAddressForDisplay(address: Address): string {
        return `${address.name}, ${address.phone}\n${address.address}\n${address.city}, ${address.state} - ${address.pincode}`;
    }

    /**
     * Suggest address corrections
     */
    static suggestAddressCorrections(address: Partial<Address>): string[] {
        const suggestions: string[] = [];

        if (address.pincode && !/^\d{6}$/.test(address.pincode)) {
            suggestions.push("Pincode should be 6 digits");
        }

        if (
            address.phone &&
            !/^\d{10}$/.test(address.phone.replace(/[^0-9]/g, ""))
        ) {
            suggestions.push("Phone number should be 10 digits");
        }

        if (address.address && address.address.length < 10) {
            suggestions.push("Please provide a complete address");
        }

        return suggestions;
    }

    /**
     * Get nearby addresses
     */
    static async getNearbyAddresses(
        ecommerceUserId: string,
        pincode: string
    ): Promise<Address[]> {
        return await prisma.address.findMany({
            where: {
                ecommerceUserId,
                pincode: {
                    startsWith: pincode.substring(0, 3),
                },
            },
            take: 5,
        });
    }
}
