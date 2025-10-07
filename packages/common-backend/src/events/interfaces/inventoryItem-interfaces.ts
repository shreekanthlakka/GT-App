// // packages/common-backend/src/events/interfaces/inventoryItemInterfaces.ts

// import { BaseEvent } from "./base-interfaces";
// import { Subjects } from "@repo/common/subjects";

// // ========================================
// // INVENTORY ITEM LIFECYCLE EVENTS
// // ========================================

// export interface InventoryItemCreatedEvent extends BaseEvent {
//     subject: Subjects.InventoryItemCreated;
//     data: {
//         id: string;
//         name: string;
//         description?: string;
//         sku?: string;
//         barcode?: string;
//         category: string;
//         subCategory?: string;
//         brand?: string;

//         // Pricing details
//         sellingPrice: number;
//         costPrice?: number;
//         mrp?: number;
//         marginPercentage?: number;

//         // Stock information
//         currentStock: number;
//         minimumStock: number;
//         maximumStock?: number;
//         reorderLevel?: number;
//         unit: string; // PCS, MTR, KG, etc.

//         // Textile specific fields
//         textileDetails?: {
//             fabric?: string; // Cotton, Silk, Polyester, etc.
//             gsm?: number; // Grams per square meter
//             width?: number; // Width in inches/cm
//             color?: string;
//             design?: string;
//             pattern?: string;
//             weaveType?: string; // Plain, Twill, Satin, etc.
//         };

//         // Product attributes
//         images: string[]; // Array of image URLs
//         attributes: Record<string, any>; // Flexible product attributes

//         // Tax and compliance
//         hsnCode?: string;
//         taxRate?: number;

//         // Storage and supplier info
//         location?: string; // Storage location in shop
//         supplier?: string;
//         leadTime?: number; // Days
//         lastPurchaseDate?: string;
//         lastPurchasePrice?: number;

//         isActive: boolean;
//         userId: string;
//         createdBy: string;
//         createdAt: string;

//         // Initial stock entry details
//         initialStockEntry?: {
//             quantity: number;
//             reason: string;
//             reference?: string;
//             unitPrice?: number;
//             totalValue?: number;
//         };
//     };
// }

// export interface InventoryItemUpdatedEvent extends BaseEvent {
//     subject: Subjects.InventoryItemUpdated;
//     data: {
//         id: string;
//         updatedAt: string;
//         changes: Record<
//             string,
//             {
//                 oldValue: any;
//                 newValue: any;
//             }
//         >;
//         updatedBy: string;

//         // Specific change flags for event handling
//         priceChanged?: boolean;
//         stockLevelsChanged?: boolean;
//         textileDetailsChanged?: boolean;
//         imagesChanged?: boolean;
//         statusChanged?: boolean;
//         supplierChanged?: boolean;

//         // Context about the update
//         reason?: string;
//         autoUpdated?: boolean;
//         bulkUpdate?: boolean;

//         // Impact assessment
//         affectedOrders?: string[];
//         priceChangeImpact?: {
//             existingOrdersCount: number;
//             pendingQuotesCount: number;
//         };
//     };
// }

// export interface InventoryItemDeletedEvent extends BaseEvent {
//     subject: Subjects.InventoryItemDeleted;
//     data: {
//         id: string;
//         name: string;
//         sku?: string;
//         category: string;
//         currentStock: number;
//         sellingPrice: number;

//         deletedAt: string;
//         deletedBy: string;
//         reason?: string;

//         // Impact assessment
//         hasActiveOrders: boolean;
//         hasPendingStock: boolean;
//         hasWishlistItems: boolean;
//         hasReviews: boolean;

//         // Cleanup requirements
//         stockMovementCleanup: boolean;
//         orderItemsAffected: number;
//         wishlistItemsAffected: number;

//         // Backup data for potential restore
//         backupData: any;

//         userId: string;
//     };
// }

// export interface InventoryItemActivatedEvent extends BaseEvent {
//     subject: Subjects.InventoryItemActivated;
//     data: {
//         id: string;
//         name: string;
//         sku?: string;
//         category: string;
//         activatedAt: string;
//         activatedBy: string;
//         reason?: string;

//         // Stock status at activation
//         currentStock: number;
//         availableForSale: boolean;

//         // Impact on related entities
//         ecommerceVisibilityRestored: boolean;
//         ordersReactivated?: number;

//         userId: string;
//     };
// }

// export interface InventoryItemDeactivatedEvent extends BaseEvent {
//     subject: Subjects.InventoryItemDeactivated;
//     data: {
//         id: string;
//         name: string;
//         sku?: string;
//         category: string;
//         deactivatedAt: string;
//         deactivatedBy: string;
//         reason?:
//             | "OUT_OF_STOCK"
//             | "DISCONTINUED"
//             | "QUALITY_ISSUE"
//             | "SUPPLIER_UNAVAILABLE"
//             | "SEASONAL"
//             | "OTHER";

//         // Current state at deactivation
//         currentStock: number;
//         pendingOrders?: number;

//         // Actions taken
//         ecommerceHidden: boolean;
//         ordersHandled: boolean;
//         customersNotified: boolean;

//         // Reactivation plan
//         expectedReactivationDate?: string;
//         reactivationConditions?: string[];

//         userId: string;
//     };
// }

// export interface InventoryItemPriceUpdatedEvent extends BaseEvent {
//     subject: Subjects.InventoryItemPriceUpdated;
//     data: {
//         id: string;
//         name: string;
//         sku?: string;

//         // Price changes
//         priceChanges: {
//             sellingPrice?: {
//                 oldValue: number;
//                 newValue: number;
//                 changePercentage: number;
//             };
//             costPrice?: {
//                 oldValue?: number;
//                 newValue?: number;
//                 changePercentage?: number;
//             };
//             mrp?: {
//                 oldValue?: number;
//                 newValue?: number;
//                 changePercentage?: number;
//             };
//         };

//         // Updated margin calculation
//         newMarginPercentage: number;
//         oldMarginPercentage?: number;

//         updatedAt: string;
//         updatedBy: string;
//         reason?: string;

//         // Price change impact
//         impact: {
//             affectedActiveOrders: number;
//             affectedPendingQuotes: number;
//             customerNotificationRequired: boolean;
//             competitivenessScore?: "IMPROVED" | "MAINTAINED" | "DECREASED";
//         };

//         // Effective date for price change
//         effectiveDate: string;
//         priceChangeType: "IMMEDIATE" | "SCHEDULED" | "BULK_UPDATE";

//         userId: string;
//     };
// }

// export interface InventoryItemCostUpdatedEvent extends BaseEvent {
//     subject: Subjects.InventoryItemCostUpdated;
//     data: {
//         id: string;
//         name: string;
//         sku?: string;

//         oldCostPrice?: number;
//         newCostPrice: number;
//         costChangePercentage: number;

//         // Impact on margins
//         oldMargin?: number;
//         newMargin: number;
//         marginImpact: number;

//         updatedAt: string;
//         updatedBy: string;
//         reason?: string;

//         // Source of cost update
//         updateSource:
//             | "PURCHASE_INVOICE"
//             | "SUPPLIER_UPDATE"
//             | "MANUAL_ADJUSTMENT"
//             | "MARKET_ADJUSTMENT"
//             | "BULK_IMPORT";

//         sourceReference?: string; // Invoice ID, import batch ID, etc.

//         // Pricing recommendations
//         pricingRecommendation?: {
//             suggestedSellingPrice: number;
//             maintainMargin: boolean;
//             competitorPriceCheck: boolean;
//         };

//         userId: string;
//     };
// }

// // ========================================
// // STOCK MANAGEMENT EVENTS
// // ========================================

// export interface StockAddedEvent extends BaseEvent {
//     subject: Subjects.StockAdded;
//     data: {
//         id: string; // Stock movement ID
//         inventoryItemId: string;
//         inventoryItemName: string;
//         sku?: string;

//         // Stock change details
//         quantity: number;
//         previousStock: number;
//         newStock: number;
//         unit: string;

//         // Cost and value details
//         unitPrice?: number;
//         totalValue?: number;

//         // Source information
//         reason: string;
//         reference?: string; // Purchase order, invoice, etc.
//         batchNumber?: string;

//         // Supplier details if applicable
//         supplierId?: string;
//         supplierName?: string;

//         // Quality and condition
//         qualityGrade?: "A" | "B" | "C" | "DEFECTIVE";
//         condition: "NEW" | "USED" | "REFURBISHED" | "DAMAGED";

//         // Location and storage
//         storageLocation?: string;
//         warehouseSection?: string;

//         // Dates
//         receivedDate: string;
//         expiryDate?: string;
//         manufactureDate?: string;

//         createdBy: string;
//         createdAt: string;
//         userId: string;

//         // Post-addition status
//         stockStatus: "IN_STOCK" | "LOW_STOCK" | "ADEQUATE" | "OVERSTOCKED";
//         reorderTriggered?: boolean;
//     };
// }

// export interface StockReducedEvent extends BaseEvent {
//     subject: Subjects.StockReduced;
//     data: {
//         id: string; // Stock movement ID
//         inventoryItemId: string;
//         inventoryItemName: string;
//         sku?: string;

//         // Stock change details
//         quantity: number;
//         previousStock: number;
//         newStock: number;
//         unit: string;

//         // Reduction details
//         reason:
//             | "SALE"
//             | "DAMAGE"
//             | "THEFT"
//             | "EXPIRY"
//             | "SAMPLE"
//             | "TRANSFER"
//             | "RETURN_TO_SUPPLIER"
//             | "ADJUSTMENT"
//             | "OTHER";

//         reference?: string; // Sale ID, damage report, etc.

//         // Cost impact
//         unitCost?: number;
//         totalValueReduced?: number;

//         // Related transaction details
//         customerId?: string;
//         customerName?: string;
//         saleId?: string;
//         orderId?: string;

//         // Location details
//         fromLocation?: string;
//         toLocation?: string;

//         createdBy: string;
//         createdAt: string;
//         userId: string;

//         // Post-reduction status
//         stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "CRITICAL";
//         reorderRequired?: boolean;
//         autoDeactivationTriggered?: boolean;
//     };
// }

// export interface StockAdjustedEvent extends BaseEvent {
//     subject: Subjects.StockAdjusted;
//     data: {
//         id: string;
//         inventoryItemId: string;
//         inventoryItemName: string;
//         sku?: string;

//         // Adjustment details
//         previousStock: number;
//         adjustedStock: number;
//         adjustmentQuantity: number; // Can be positive or negative
//         adjustmentType: "INCREASE" | "DECREASE";

//         // Reason for adjustment
//         reason:
//             | "PHYSICAL_COUNT"
//             | "SYSTEM_ERROR"
//             | "DAMAGE_WRITEOFF"
//             | "THEFT_WRITEOFF"
//             | "EXPIRY_WRITEOFF"
//             | "QUALITY_REJECTION"
//             | "FOUND_STOCK"
//             | "CLERICAL_ERROR"
//             | "OTHER";

//         description?: string;
//         reference?: string;

//         // Financial impact
//         unitCost?: number;
//         totalValueImpact: number; // Positive for increase, negative for decrease

//         // Approval workflow
//         requiresApproval: boolean;
//         approvedBy?: string;
//         approvalDate?: string;

//         // Audit details
//         physicalCountDate?: string;
//         countedBy?: string;
//         variance: number;
//         variancePercentage: number;

//         createdBy: string;
//         createdAt: string;
//         userId: string;

//         // Impact assessment
//         stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "CRITICAL";
//         alertsTriggered: string[];
//     };
// }

// export interface StockTransferredEvent extends BaseEvent {
//     subject: Subjects.StockTransferred;
//     data: {
//         id: string;
//         inventoryItemId: string;
//         inventoryItemName: string;
//         sku?: string;

//         // Transfer details
//         quantity: number;
//         unit: string;
//         fromLocation: string;
//         toLocation: string;

//         // Stock impact
//         fromLocationPreviousStock: number;
//         fromLocationNewStock: number;
//         toLocationPreviousStock: number;
//         toLocationNewStock: number;

//         // Transfer metadata
//         transferReason:
//             | "LOCATION_CHANGE"
//             | "SHOP_TRANSFER"
//             | "WAREHOUSE_OPTIMIZATION"
//             | "CUSTOMER_PICKUP"
//             | "MAINTENANCE"
//             | "OTHER";

//         transferReference?: string;
//         batchNumber?: string;

//         // Personnel involved
//         transferredBy: string;
//         authorizedBy?: string;
//         receivedBy?: string;

//         // Timing
//         transferDate: string;
//         expectedDelivery?: string;
//         actualDelivery?: string;

//         // Transfer status
//         transferStatus: "INITIATED" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";

//         // Condition tracking
//         conditionBefore?: string;
//         conditionAfter?: string;
//         damageReported?: boolean;

//         createdAt: string;
//         userId: string;

//         // Impact on availability
//         fromLocationAvailability: boolean;
//         toLocationAvailability: boolean;
//     };
// }

// // ========================================
// // STOCK ALERT EVENTS
// // ========================================

// export interface StockLowEvent extends BaseEvent {
//     subject: Subjects.StockLow;
//     data: {
//         inventoryItemId: string;
//         inventoryItemName: string;
//         sku?: string;
//         category: string;

//         // Stock levels
//         currentStock: number;
//         minimumStock: number;
//         reorderLevel: number;
//         unit: string;

//         // Shortage details
//         shortageQuantity: number;
//         daysUntilStockOut?: number;

//         // Sales velocity
//         averageDailySales?: number;
//         lastSaleDate?: string;

//         // Supplier information
//         supplier?: string;
//         leadTime?: number;
//         lastPurchaseDate?: string;
//         lastPurchasePrice?: number;

//         // Alert metadata
//         alertLevel: "LOW" | "CRITICAL";
//         alertTriggeredAt: string;
//         previousAlertDate?: string;

//         // Recommended actions
//         recommendedOrderQuantity?: number;
//         suggestedSupplier?: string;
//         alternativeItems?: Array<{
//             id: string;
//             name: string;
//             availability: number;
//         }>;

//         userId: string;

//         // Business impact
//         activeOrdersAffected?: number;
//         potentialLostSales?: number;
//         customerImpact: "NONE" | "LOW" | "MEDIUM" | "HIGH";
//     };
// }

// export interface StockCriticalEvent extends BaseEvent {
//     subject: Subjects.StockCritical;
//     data: {
//         inventoryItemId: string;
//         inventoryItemName: string;
//         sku?: string;
//         category: string;

//         currentStock: number;
//         minimumStock: number;
//         unit: string;

//         // Critical status details
//         stockOutImminent: boolean;
//         estimatedStockOutDate: string;
//         averageDailySales: number;

//         // Business impact
//         pendingOrdersAffected: number;
//         backorderRequired: boolean;
//         immediateActionRequired: boolean;

//         // Supplier urgency
//         supplier?: string;
//         supplierContactRequired: boolean;
//         expeditedOrderRecommended: boolean;

//         // Alternative options
//         substituteItemsAvailable: boolean;
//         alternativeSuppliers?: string[];

//         alertTriggeredAt: string;
//         userId: string;

//         // Escalation details
//         managementNotified: boolean;
//         customerCommunicationRequired: boolean;
//         ecommerceStatusChange: boolean;
//     };
// }

// export interface StockOutEvent extends BaseEvent {
//     subject: Subjects.StockOut;
//     data: {
//         inventoryItemId: string;
//         inventoryItemName: string;
//         sku?: string;
//         category: string;

//         // Stock out details
//         stockOutDate: string;
//         lastStockQuantity: number;
//         unit: string;

//         // Last sale information
//         lastSaleDate?: string;
//         lastSaleQuantity?: number;
//         customerId?: string;

//         // Business impact assessment
//         impact: {
//             pendingOrders: number;
//             backorders: number;
//             wishlistItems: number;
//             averageDailySales: number;
//             estimatedLostSales: number;
//             customerInquiries: number;
//         };

//         // Immediate actions taken
//         actionsTaken: {
//             ecommerceHidden: boolean;
//             customersNotified: boolean;
//             ordersUpdated: boolean;
//             backorderEnabled: boolean;
//             alternativesOffered: boolean;
//         };

//         // Restock planning
//         restockPlan?: {
//             supplierContacted: boolean;
//             orderPlaced: boolean;
//             expectedRestockDate?: string;
//             orderReference?: string;
//         };

//         userId: string;

//         // Recovery metrics
//         stockOutDuration?: number; // Days since last stock out
//         frequentStockOut: boolean;
//         seasonalPattern: boolean;
//     };
// }

// export interface StockReorderRequiredEvent extends BaseEvent {
//     subject: Subjects.StockReorderRequired;
//     data: {
//         inventoryItemId: string;
//         inventoryItemName: string;
//         sku?: string;
//         category: string;

//         // Current status
//         currentStock: number;
//         reorderLevel: number;
//         minimumStock: number;
//         maximumStock?: number;
//         unit: string;

//         // Reorder calculation
//         recommendedOrderQuantity: number;
//         economicOrderQuantity?: number;
//         safetyStock: number;

//         // Lead time considerations
//         leadTime: number;
//         averageDailySales: number;
//         forecastedDemand?: number;

//         // Supplier information
//         preferredSupplier?: string;
//         lastPurchasePrice?: number;
//         lastOrderDate?: string;
//         supplierLeadTime?: number;

//         // Cost considerations
//         estimatedOrderValue: number;
//         budgetApprovalRequired: boolean;

//         // Urgency and priority
//         urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
//         daysUntilStockOut: number;

//         // Seasonal considerations
//         seasonalDemand: boolean;
//         upcomingEvents?: string[];

//         reorderTriggeredAt: string;
//         userId: string;

//         // Automation status
//         autoReorderEnabled: boolean;
//         manualApprovalRequired: boolean;

//         // Business rules applied
//         reorderRules: string[];
//         exceptions?: string[];
//     };
// }

// // ========================================
// // INVENTORY ANALYTICS EVENTS
// // ========================================

// export interface InventoryTurnoverCalculatedEvent extends BaseEvent {
//     subject: Subjects.InventoryTurnoverCalculated;
//     data: {
//         calculationId: string;
//         period: {
//             startDate: string;
//             endDate: string;
//         };

//         // Overall turnover metrics
//         overallTurnover: {
//             turnoverRatio: number;
//             daysInInventory: number;
//             totalCostOfGoodsSold: number;
//             averageInventoryValue: number;
//         };

//         // Category-wise analysis
//         categoryAnalysis: Array<{
//             category: string;
//             turnoverRatio: number;
//             daysInInventory: number;
//             totalValue: number;
//             itemCount: number;
//             fastMoving: number;
//             slowMoving: number;
//             performance: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR";
//         }>;

//         // Item-wise insights
//         topPerformers: Array<{
//             inventoryItemId: string;
//             inventoryItemName: string;
//             turnoverRatio: number;
//             totalSales: number;
//             averageStock: number;
//         }>;

//         slowMovingItems: Array<{
//             inventoryItemId: string;
//             inventoryItemName: string;
//             turnoverRatio: number;
//             daysInInventory: number;
//             currentStock: number;
//             lastSaleDate?: string;
//         }>;

//         deadStock: Array<{
//             inventoryItemId: string;
//             inventoryItemName: string;
//             daysWithoutSale: number;
//             currentStock: number;
//             tiedUpValue: number;
//         }>;

//         // Recommendations
//         recommendations: {
//             itemsToReorder: string[];
//             itemsToDiscount: string[];
//             itemsToDiscontinue: string[];
//             overstockedItems: string[];
//         };

//         // Business impact
//         workingCapitalInsights: {
//             totalInventoryValue: number;
//             excessInventoryValue: number;
//             cashTiedUp: number;
//             optimizationPotential: number;
//         };

//         calculatedAt: string;
//         calculatedBy: string;
//         userId: string;

//         // Comparison with previous periods
//         previousPeriodComparison?: {
//             turnoverImprovement: number;
//             inventoryReduction: number;
//             efficiencyGain: number;
//         };
//     };
// }

// export interface InventoryItemImageUpdatedEvent extends BaseEvent {
//     subject: Subjects.InventoryItemImageUpdated;
//     data: {
//         productId: string;
//         productName: string;
//         imageAction: "ADDED" | "REMOVED" | "UPDATED";
//         imageUrl: string;
//         imageIndex?: number;
//         updatedBy: string;
//         updatedAt: string;
//     };
// }

// export interface InventoryItemCategoryChangedEvent extends BaseEvent {
//     subject: Subjects.InventoryItemCategoryChanged;
//     data: {
//         productId: string;
//         productName: string;
//         oldCategory: string;
//         newCategory: string;
//         oldSubCategory?: string;
//         newSubCategory?: string;
//         changedBy: string;
//         changedAt: string;
//         reason?: string;
//     };
// }

// // ========================================
// // EXPORT ALL INVENTORY ITEM EVENT TYPES
// // ========================================

// export type InventoryItemEventTypes =
//     | InventoryItemCreatedEvent
//     | InventoryItemUpdatedEvent
//     | InventoryItemDeletedEvent
//     | InventoryItemActivatedEvent
//     | InventoryItemDeactivatedEvent
//     | InventoryItemPriceUpdatedEvent
//     | InventoryItemCostUpdatedEvent
//     | StockAddedEvent
//     | StockReducedEvent
//     | StockAdjustedEvent
//     | StockTransferredEvent
//     | StockLowEvent
//     | StockCriticalEvent
//     | StockOutEvent
//     | StockReorderRequiredEvent
//     | InventoryTurnoverCalculatedEvent
//     | InventoryItemImageUpdatedEvent;

// packages/common-backend/src/events/interfaces/inventoryItemInterfaces.ts

import { BaseEvent } from "./base-interfaces";
import { Subjects } from "@repo/common/subjects";

// ========================================
// INVENTORY ITEM LIFECYCLE EVENTS
// ========================================

export interface InventoryItemCreatedEvent extends BaseEvent {
    subject: Subjects.InventoryItemCreated;
    data: {
        id: string;
        name: string;
        description?: string;
        sku?: string;
        barcode?: string;
        category: string;
        subCategory?: string;
        brand?: string;

        // Pricing details
        sellingPrice: number;
        costPrice?: number;
        mrp?: number;
        marginPercentage?: number;

        // Stock information
        currentStock: number;
        minimumStock: number;
        maximumStock?: number;
        reorderLevel?: number;
        unit: string; // PCS, MTR, KG, etc.

        // Textile specific fields
        textileDetails?: {
            fabric?: string; // Cotton, Silk, Polyester, etc.
            gsm?: number; // Grams per square meter
            width?: number; // Width in inches/cm
            color?: string;
            design?: string;
            pattern?: string;
            weaveType?: string; // Plain, Twill, Satin, etc.
        };

        // Product attributes
        images: string[]; // Array of image URLs
        attributes: Record<string, any>; // Flexible product attributes

        // Tax and compliance
        hsnCode?: string;
        taxRate?: number;

        // Storage and supplier info
        location?: string; // Storage location in shop
        supplier?: string;
        leadTime?: number; // Days
        lastPurchaseDate?: string;
        lastPurchasePrice?: number;

        isActive: boolean;
        userId: string;
        createdBy: string;
        createdAt: string;

        // Initial stock entry details
        initialStockEntry?: {
            quantity: number;
            reason: string;
            reference?: string;
            unitPrice?: number;
            totalValue?: number;
        };
    };
}

export interface InventoryItemUpdatedEvent extends BaseEvent {
    subject: Subjects.InventoryItemUpdated;
    data: {
        id: string;
        name?: string;
        updatedAt: string;
        changes: Record<
            string,
            {
                oldValue: any;
                newValue: any;
            }
        >;
        updatedBy: string;

        // Specific change flags for event handling
        priceChanged?: boolean;
        stockLevelsChanged?: boolean;
        textileDetailsChanged?: boolean;
        imagesChanged?: boolean;
        statusChanged?: boolean;
        supplierChanged?: boolean;

        // Context about the update
        reason?: string;
        autoUpdated?: boolean;
        bulkUpdate?: boolean;

        // Impact assessment
        affectedOrders?: string[];
        priceChangeImpact?: {
            existingOrdersCount: number;
            pendingQuotesCount: number;
        };
    };
}

export interface InventoryItemDeletedEvent extends BaseEvent {
    subject: Subjects.InventoryItemDeleted;
    data: {
        id: string;
        name: string;
        sku?: string;
        category: string;
        currentStock: number;
        sellingPrice: number;

        deletedAt: string;
        deletedBy: string;
        reason?: string;

        // Impact assessment
        hasActiveOrders: boolean;
        hasPendingStock: boolean;
        hasWishlistItems: boolean;
        hasReviews: boolean;

        // Cleanup requirements
        stockMovementCleanup: boolean;
        orderItemsAffected: number;
        wishlistItemsAffected: number;

        // Backup data for potential restore
        backupData: any;

        userId: string;
    };
}

export interface InventoryItemActivatedEvent extends BaseEvent {
    subject: Subjects.InventoryItemActivated;
    data: {
        id: string;
        name: string;
        sku?: string;
        category: string;
        activatedAt: string;
        activatedBy: string;
        reason?: string;

        // Stock status at activation
        currentStock: number;
        availableForSale: boolean;

        // Impact on related entities
        ecommerceVisibilityRestored: boolean;
        ordersReactivated?: number;

        userId: string;
    };
}

export interface InventoryItemDeactivatedEvent extends BaseEvent {
    subject: Subjects.InventoryItemDeactivated;
    data: {
        id: string;
        name: string;
        sku?: string;
        category: string;
        deactivatedAt: string;
        deactivatedBy: string;
        reason?:
            | "OUT_OF_STOCK"
            | "DISCONTINUED"
            | "QUALITY_ISSUE"
            | "SUPPLIER_UNAVAILABLE"
            | "SEASONAL"
            | "OTHER";

        // Current state at deactivation
        currentStock: number;
        pendingOrders?: number;

        // Actions taken
        ecommerceHidden: boolean;
        ordersHandled: boolean;
        customersNotified: boolean;

        // Reactivation plan
        expectedReactivationDate?: string;
        reactivationConditions?: string[];

        userId: string;
    };
}

export interface InventoryItemPriceUpdatedEvent extends BaseEvent {
    subject: Subjects.InventoryItemPriceUpdated;
    data: {
        id: string;
        name: string;
        sku?: string;

        // Price changes
        priceChanges: {
            sellingPrice?: {
                oldValue: number;
                newValue: number;
                changePercentage: number;
            };
            costPrice?: {
                oldValue?: number;
                newValue?: number;
                changePercentage?: number;
            };
            mrp?: {
                oldValue?: number;
                newValue?: number;
                changePercentage?: number;
            };
        };

        // Updated margin calculation
        newMarginPercentage: number;
        oldMarginPercentage?: number;

        updatedAt: string;
        updatedBy: string;
        reason?: string;

        // Price change impact
        impact: {
            affectedActiveOrders: number;
            affectedPendingQuotes: number;
            customerNotificationRequired: boolean;
            competitivenessScore?: "IMPROVED" | "MAINTAINED" | "DECREASED";
        };

        // Effective date for price change
        effectiveDate: string;
        priceChangeType: "IMMEDIATE" | "SCHEDULED" | "BULK_UPDATE";

        userId: string;
    };
}

export interface InventoryItemCostUpdatedEvent extends BaseEvent {
    subject: Subjects.InventoryItemCostUpdated;
    data: {
        id: string;
        name: string;
        sku?: string;

        oldCostPrice?: number;
        newCostPrice: number;
        costChangePercentage: number;

        // Impact on margins
        oldMargin?: number;
        newMargin: number;
        marginImpact: number;

        updatedAt: string;
        updatedBy: string;
        reason?: string;

        // Source of cost update
        updateSource:
            | "PURCHASE_INVOICE"
            | "SUPPLIER_UPDATE"
            | "MANUAL_ADJUSTMENT"
            | "MARKET_ADJUSTMENT"
            | "BULK_IMPORT";

        sourceReference?: string; // Invoice ID, import batch ID, etc.

        // Pricing recommendations
        pricingRecommendation?: {
            suggestedSellingPrice: number;
            maintainMargin: boolean;
            competitorPriceCheck: boolean;
        };

        userId: string;
    };
}

export interface InventoryItemCategoryChangedEvent extends BaseEvent {
    subject: Subjects.InventoryItemCategoryChanged;
    data: {
        id: string;
        name: string;
        sku?: string;

        // Category changes
        oldCategory: string;
        newCategory: string;
        oldSubCategory?: string;
        newSubCategory?: string;

        // Reason for change
        reason?: string;
        changedBy: string;
        changedAt: string;

        // Impact assessment
        impact: {
            taxRateChanged: boolean;
            oldTaxRate?: number;
            newTaxRate?: number;

            reportingCategoryChanged: boolean;
            analyticsImpacted: boolean;

            ecommerceDisplayChanged: boolean;
            searchFiltersAffected: boolean;
        };

        // Business implications
        relatedItemsAffected?: number;
        inventoryReorganizationRequired: boolean;
        storageLocationChangeRequired: boolean;

        userId: string;

        // Auto-applied changes
        autoUpdatesApplied: {
            hsnCodeUpdated: boolean;
            attributesUpdated: boolean;
            pricingRulesApplied: boolean;
        };
    };
}

export interface InventoryItemImageUpdatedEvent extends BaseEvent {
    subject: Subjects.InventoryItemImageUpdated;
    data: {
        id: string;
        name: string;
        sku?: string;

        // Image changes
        imageChanges: {
            added: string[]; // Array of new image URLs
            removed: string[]; // Array of removed image URLs
            updated: Array<{
                oldUrl: string;
                newUrl: string;
            }>;
        };

        // Current state
        totalImages: number;
        primaryImageUrl?: string;
        primaryImageChanged: boolean;

        updatedBy: string;
        updatedAt: string;

        // Upload details
        uploadSource: "MANUAL" | "BULK_UPLOAD" | "API" | "CAMERA" | "SCANNER";
        imageQuality?: "HIGH" | "MEDIUM" | "LOW";
        imageSizes?: Array<{
            size: string; // "thumbnail", "medium", "large"
            dimensions: string; // "150x150", "500x500", etc.
            url: string;
        }>;

        // Business impact
        impact: {
            ecommerceVisibilityImproved: boolean;
            customerEngagementExpected: boolean;
            catalogQualityScore?: number;
        };

        userId: string;

        // Processing status
        imageProcessingStatus: "PENDING" | "COMPLETED" | "FAILED";
        compressionApplied: boolean;
        watermarkApplied: boolean;
    };
}

// ========================================
// STOCK MANAGEMENT EVENTS
// ========================================

export interface StockAddedEvent extends BaseEvent {
    subject: Subjects.StockAdded;
    data: {
        id: string; // Stock movement ID
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;

        // Stock change details
        quantity: number;
        previousStock: number;
        newStock: number;
        unit: string;

        // Cost and value details
        unitPrice?: number;
        totalValue?: number;

        // Source information
        reason: string;
        reference?: string; // Purchase order, invoice, etc.
        batchNumber?: string;

        // Supplier details if applicable
        supplierId?: string;
        supplierName?: string;

        // Quality and condition
        qualityGrade?: "A" | "B" | "C" | "DEFECTIVE";
        condition: "NEW" | "USED" | "REFURBISHED" | "DAMAGED";

        // Location and storage
        storageLocation?: string;
        warehouseSection?: string;

        // Dates
        receivedDate: string;
        expiryDate?: string;
        manufactureDate?: string;

        createdBy: string;
        createdAt: string;
        userId: string;

        // Post-addition status
        stockStatus: "IN_STOCK" | "LOW_STOCK" | "ADEQUATE" | "OVERSTOCKED";
        reorderTriggered?: boolean;
    };
}

export interface StockReducedEvent extends BaseEvent {
    subject: Subjects.StockReduced;
    data: {
        id: string; // Stock movement ID
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;

        // Stock change details
        quantity: number;
        previousStock: number;
        newStock: number;
        unit: string;

        // Reduction details
        reason:
            | "SALE"
            | "DAMAGE"
            | "THEFT"
            | "EXPIRY"
            | "SAMPLE"
            | "TRANSFER"
            | "RETURN_TO_SUPPLIER"
            | "ADJUSTMENT"
            | "OTHER";

        reference?: string; // Sale ID, damage report, etc.

        // Cost impact
        unitCost?: number;
        totalValueReduced?: number;

        // Related transaction details
        customerId?: string;
        customerName?: string;
        saleId?: string;
        orderId?: string;

        // Location details
        fromLocation?: string;
        toLocation?: string;

        createdBy: string;
        createdAt: string;
        userId: string;

        // Post-reduction status
        stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "CRITICAL";
        reorderRequired?: boolean;
        autoDeactivationTriggered?: boolean;
    };
}

export interface StockAdjustedEvent extends BaseEvent {
    subject: Subjects.StockAdjusted;
    data: {
        id: string;
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;

        // Adjustment details
        previousStock: number;
        adjustedStock: number;
        adjustmentQuantity: number; // Can be positive or negative
        adjustmentType: "INCREASE" | "DECREASE";

        // Reason for adjustment
        reason:
            | "PHYSICAL_COUNT"
            | "SYSTEM_ERROR"
            | "DAMAGE_WRITEOFF"
            | "THEFT_WRITEOFF"
            | "EXPIRY_WRITEOFF"
            | "QUALITY_REJECTION"
            | "FOUND_STOCK"
            | "CLERICAL_ERROR"
            | "OTHER";

        description?: string;
        reference?: string;

        // Financial impact
        unitCost?: number;
        totalValueImpact: number; // Positive for increase, negative for decrease

        // Approval workflow
        requiresApproval: boolean;
        approvedBy?: string;
        approvalDate?: string;

        // Audit details
        physicalCountDate?: string;
        countedBy?: string;
        variance: number;
        variancePercentage: number;

        createdBy: string;
        createdAt: string;
        userId: string;

        // Impact assessment
        stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "CRITICAL";
        alertsTriggered: string[];
    };
}

export interface StockTransferredEvent extends BaseEvent {
    subject: Subjects.StockTransferred;
    data: {
        id: string;
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;

        // Transfer details
        quantity: number;
        unit: string;
        fromLocation: string;
        toLocation: string;

        // Stock impact
        fromLocationPreviousStock: number;
        fromLocationNewStock: number;
        toLocationPreviousStock: number;
        toLocationNewStock: number;

        // Transfer metadata
        transferReason:
            | "LOCATION_CHANGE"
            | "SHOP_TRANSFER"
            | "WAREHOUSE_OPTIMIZATION"
            | "CUSTOMER_PICKUP"
            | "MAINTENANCE"
            | "OTHER";

        transferReference?: string;
        batchNumber?: string;

        // Personnel involved
        transferredBy: string;
        authorizedBy?: string;
        receivedBy?: string;

        // Timing
        transferDate: string;
        expectedDelivery?: string;
        actualDelivery?: string;

        // Transfer status
        transferStatus: "INITIATED" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";

        // Condition tracking
        conditionBefore?: string;
        conditionAfter?: string;
        damageReported?: boolean;

        createdAt: string;
        userId: string;

        // Impact on availability
        fromLocationAvailability: boolean;
        toLocationAvailability: boolean;
    };
}

export interface StockDamagedEvent extends BaseEvent {
    subject: Subjects.StockDamaged;
    data: {
        id: string;
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;

        // Damage details
        damagedQuantity: number;
        unit: string;
        previousStock: number;
        newStock: number;

        // Damage information
        damageType:
            | "PHYSICAL_DAMAGE"
            | "WATER_DAMAGE"
            | "FIRE_DAMAGE"
            | "PEST_DAMAGE"
            | "HANDLING_DAMAGE"
            | "MANUFACTURING_DEFECT"
            | "WEAR_AND_TEAR"
            | "OTHER";

        damageReason?: string;
        damageSeverity: "MINOR" | "MAJOR" | "TOTAL_LOSS";

        // Discovery details
        discoveredBy: string;
        discoveredAt: string;
        location?: string;

        // Assessment
        assessedBy?: string;
        assessmentDate?: string;
        assessmentNotes?: string;

        // Financial impact
        unitCost?: number;
        totalLoss: number;
        salvageValue?: number;
        netLoss: number;

        // Insurance and recovery
        insuranceClaim: boolean;
        claimReference?: string;
        supplierLiability?: boolean;
        recoveryExpected?: number;

        // Disposal details
        disposalMethod?:
            | "SCRAP"
            | "RETURN_TO_SUPPLIER"
            | "REPAIR"
            | "DISCOUNT_SALE"
            | "WRITEOFF";
        disposalDate?: string;
        disposalReference?: string;

        createdAt: string;
        userId: string;

        // Investigation
        investigationRequired: boolean;
        preventiveMeasures?: string[];
    };
}

export interface StockExpiredEvent extends BaseEvent {
    subject: Subjects.StockExpired;
    data: {
        id: string;
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;

        // Expiry details
        expiredQuantity: number;
        unit: string;
        previousStock: number;
        newStock: number;

        // Date information
        expiryDate: string;
        discoveredAt: string;
        daysOverdue: number;

        // Batch information
        batchNumber?: string;
        manufactureDate?: string;
        receivedDate?: string;

        // Financial impact
        unitCost?: number;
        totalLoss: number;

        // Handling decision
        disposalMethod:
            | "WRITEOFF"
            | "DISCOUNT_SALE"
            | "RETURN_TO_SUPPLIER"
            | "CHARITY"
            | "SCRAP";
        disposalDate?: string;
        disposalReference?: string;

        // Prevention analysis
        earlyWarningMissed: boolean;
        rotationPolicyFollowed: boolean;
        storageConditionsAdequate: boolean;

        // Supplier impact
        supplierNotified: boolean;
        supplierLiability?: boolean;
        replacementRequested?: boolean;

        discoveredBy: string;
        createdAt: string;
        userId: string;

        // Process improvement
        preventiveMeasures: string[];
        fifoViolation?: boolean;
    };
}

export interface StockReturnedEvent extends BaseEvent {
    subject: Subjects.StockReturned;
    data: {
        id: string;
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;

        // Return details
        returnedQuantity: number;
        unit: string;
        previousStock: number;
        newStock: number;

        // Return information
        returnType:
            | "CUSTOMER_RETURN"
            | "SUPPLIER_RETURN"
            | "INTERNAL_RETURN"
            | "DEFECTIVE_RETURN";
        returnReason:
            | "DEFECTIVE"
            | "WRONG_ITEM"
            | "CUSTOMER_DISSATISFACTION"
            | "SIZE_ISSUE"
            | "COLOR_MISMATCH"
            | "QUALITY_ISSUE"
            | "OVERSTOCK"
            | "OTHER";

        returnReference?: string;
        originalSaleId?: string;
        originalOrderId?: string;

        // Return source
        returnedBy?: string; // Customer/Supplier name
        returnedToLocation: string;
        returnDate: string;

        // Condition assessment
        conditionOnReturn: "NEW" | "GOOD" | "FAIR" | "POOR" | "DEFECTIVE";
        qualityCheck: boolean;
        qualityCheckBy?: string;
        qualityNotes?: string;

        // Restocking decision
        restockable: boolean;
        restockReason?: string;
        restockDate?: string;
        restockLocation?: string;

        // Financial impact
        originalPrice?: number;
        returnValue: number;
        restockingFee?: number;
        netReturnValue: number;

        // Customer/Supplier relations
        customerId?: string;
        customerName?: string;
        supplierId?: string;
        supplierName?: string;

        // Resolution
        resolutionType:
            | "REFUND"
            | "EXCHANGE"
            | "STORE_CREDIT"
            | "REPAIR"
            | "REPLACEMENT";
        resolutionReference?: string;

        processedBy: string;
        createdAt: string;
        userId: string;

        // Impact on related entities
        invoiceImpacted?: boolean;
        paymentAdjustmentRequired?: boolean;
    };
}

export interface StockReceivedEvent extends BaseEvent {
    subject: Subjects.StockReceived;
    data: {
        id: string;
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;

        // Received stock details
        receivedQuantity: number;
        unit: string;
        previousStock: number;
        newStock: number;

        // Order information
        purchaseOrderId?: string;
        purchaseOrderNumber?: string;
        expectedQuantity?: number;
        quantityVariance?: number;

        // Supplier information
        supplierId?: string;
        supplierName?: string;
        supplierInvoiceNo?: string;
        supplierDeliveryNote?: string;

        // Shipment details
        shipmentReference?: string;
        transportMode?: "ROAD" | "RAIL" | "AIR" | "SEA" | "COURIER";
        vehicleNumber?: string;
        driverName?: string;

        // Dates and timing
        scheduledDeliveryDate?: string;
        actualDeliveryDate: string;
        deliveryDelayDays?: number;

        // Quality inspection
        qualityInspection: {
            inspected: boolean;
            inspectedBy?: string;
            inspectionDate?: string;
            qualityGrade?: "A" | "B" | "C" | "REJECT";
            defectsFound?: string[];
            acceptedQuantity?: number;
            rejectedQuantity?: number;
        };

        // Batch and tracking
        batchNumber?: string;
        lotNumber?: string;
        manufactureDate?: string;
        expiryDate?: string;

        // Cost information
        unitCost?: number;
        totalCost?: number;
        shippingCost?: number;
        taxes?: number;

        // Storage and location
        receivedAt: string;
        storageLocation?: string;
        warehouseSection?: string;

        // Documentation
        documentsReceived: {
            invoice: boolean;
            deliveryNote: boolean;
            qualityCertificate: boolean;
            testCertificate: boolean;
            packingList: boolean;
        };

        // Receiving personnel
        receivedBy: string;
        authorizedBy?: string;

        createdAt: string;
        userId: string;

        // Post-receipt actions
        stockLevelsUpdated: boolean;
        reorderStatusUpdated: boolean;
        backordersProcessed?: number;
    };
}

export interface StockOrderedEvent extends BaseEvent {
    subject: Subjects.StockOrdered;
    data: {
        orderId: string;
        orderNumber?: string;
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;

        // Order details
        orderedQuantity: number;
        unit: string;
        unitPrice: number;
        totalOrderValue: number;

        // Current stock context
        currentStock: number;
        reorderLevel: number;
        minimumStock: number;

        // Supplier information
        supplierId: string;
        supplierName: string;
        supplierContactPerson?: string;
        supplierEmail?: string;
        supplierPhone?: string;

        // Order terms
        paymentTerms?: string;
        deliveryTerms?: string;
        leadTimeExpected: number; // days
        expectedDeliveryDate: string;

        // Order metadata
        orderType: "REGULAR" | "URGENT" | "BULK" | "TRIAL" | "REPLACEMENT";
        orderPriority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

        // Approval workflow
        requiresApproval: boolean;
        approvedBy?: string;
        approvalDate?: string;
        approvalAmount?: number;

        // Order placement details
        orderPlacedBy: string;
        orderPlacedAt: string;
        orderMethod: "PHONE" | "EMAIL" | "PORTAL" | "IN_PERSON" | "FAX";

        // Special instructions
        specialInstructions?: string;
        qualityRequirements?: string;
        packagingRequirements?: string;

        // Business context
        orderReason:
            | "REORDER_POINT_REACHED"
            | "STOCK_OUT"
            | "BULK_PURCHASE"
            | "SEASONAL_DEMAND"
            | "CUSTOMER_ORDER"
            | "TRIAL_ORDER"
            | "EMERGENCY_ORDER";

        customerOrdersWaiting?: number;
        estimatedLostSalesWithoutStock?: number;

        createdAt: string;
        userId: string;

        // Tracking setup
        trackingEnabled: boolean;
        followUpDate?: string;
        reminderScheduled?: boolean;
    };
}

// ========================================
// STOCK ALERT EVENTS
// ========================================

export interface StockLowEvent extends BaseEvent {
    subject: Subjects.StockLow;
    data: {
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;
        category: string;

        // Stock levels
        currentStock: number;
        minimumStock: number;
        reorderLevel: number;
        unit: string;

        // Shortage details
        shortageQuantity: number;
        daysUntilStockOut?: number;

        // Sales velocity
        averageDailySales?: number;
        lastSaleDate?: string;

        // Supplier information
        supplier?: string;
        leadTime?: number;
        lastPurchaseDate?: string;
        lastPurchasePrice?: number;

        // Alert metadata
        alertLevel: "LOW" | "CRITICAL";
        alertTriggeredAt: string;
        previousAlertDate?: string;

        // Recommended actions
        recommendedOrderQuantity?: number;
        suggestedSupplier?: string;
        alternativeItems?: Array<{
            id: string;
            name: string;
            availability: number;
        }>;

        userId: string;

        // Business impact
        activeOrdersAffected?: number;
        potentialLostSales?: number;
        customerImpact: "NONE" | "LOW" | "MEDIUM" | "HIGH";
    };
}

export interface StockCriticalEvent extends BaseEvent {
    subject: Subjects.StockCritical;
    data: {
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;
        category: string;

        currentStock: number;
        minimumStock: number;
        unit: string;

        // Critical status details
        stockOutImminent: boolean;
        estimatedStockOutDate: string;
        averageDailySales: number;

        // Business impact
        pendingOrdersAffected: number;
        backorderRequired: boolean;
        immediateActionRequired: boolean;

        // Supplier urgency
        supplier?: string;
        supplierContactRequired: boolean;
        expeditedOrderRecommended: boolean;

        // Alternative options
        substituteItemsAvailable: boolean;
        alternativeSuppliers?: string[];

        alertTriggeredAt: string;
        userId: string;

        // Escalation details
        managementNotified: boolean;
        customerCommunicationRequired: boolean;
        ecommerceStatusChange: boolean;
    };
}

export interface StockOutEvent extends BaseEvent {
    subject: Subjects.StockOut;
    data: {
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;
        category: string;

        // Stock out details
        stockOutDate: string;
        lastStockQuantity: number;
        unit: string;

        // Last sale information
        lastSaleDate?: string;
        lastSaleQuantity?: number;
        customerId?: string;

        // Business impact assessment
        impact: {
            pendingOrders: number;
            backorders: number;
            wishlistItems: number;
            averageDailySales: number;
            estimatedLostSales: number;
            customerInquiries: number;
        };

        // Immediate actions taken
        actionsTaken: {
            ecommerceHidden: boolean;
            customersNotified: boolean;
            ordersUpdated: boolean;
            backorderEnabled: boolean;
            alternativesOffered: boolean;
        };

        // Restock planning
        restockPlan?: {
            supplierContacted: boolean;
            orderPlaced: boolean;
            expectedRestockDate?: string;
            orderReference?: string;
        };

        userId: string;

        // Recovery metrics
        stockOutDuration?: number; // Days since last stock out
        frequentStockOut: boolean;
        seasonalPattern: boolean;
    };
}

export interface StockReorderRequiredEvent extends BaseEvent {
    subject: Subjects.StockReorderRequired;
    data: {
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;
        category: string;

        // Current status
        currentStock: number;
        reorderLevel: number;
        minimumStock: number;
        maximumStock?: number;
        unit: string;

        // Reorder calculation
        recommendedOrderQuantity: number;
        economicOrderQuantity?: number;
        safetyStock: number;

        // Lead time considerations
        leadTime: number;
        averageDailySales: number;
        forecastedDemand?: number;

        // Supplier information
        preferredSupplier?: string;
        lastPurchasePrice?: number;
        lastOrderDate?: string;
        supplierLeadTime?: number;

        // Cost considerations
        estimatedOrderValue: number;
        budgetApprovalRequired: boolean;

        // Urgency and priority
        urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        daysUntilStockOut: number;

        // Seasonal considerations
        seasonalDemand: boolean;
        upcomingEvents?: string[];

        reorderTriggeredAt: string;
        userId: string;

        // Automation status
        autoReorderEnabled: boolean;
        manualApprovalRequired: boolean;

        // Business rules applied
        reorderRules: string[];
        exceptions?: string[];
    };
}

// ========================================
// INVENTORY OPERATIONS EVENTS
// ========================================

export interface InventoryCountStartedEvent extends BaseEvent {
    subject: Subjects.InventoryCountStarted;
    data: {
        countId: string;
        countType: "FULL" | "PARTIAL" | "CYCLE" | "SPOT_CHECK";

        // Scope definition
        scope: {
            includeAllItems: boolean;
            specificCategories?: string[];
            specificLocations?: string[];
            specificItems?: string[];
            lowStockOnly?: boolean;
            fastMovingOnly?: boolean;
        };

        // Count parameters
        countMethod: "PHYSICAL" | "BARCODE_SCAN" | "RFID" | "HYBRID";
        expectedDuration: number; // hours

        // Personnel assignments
        countTeam: Array<{
            userId: string;
            userName: string;
            role: "LEAD" | "COUNTER" | "SUPERVISOR";
            assignedLocation?: string;
            assignedCategories?: string[];
        }>;

        // Business impact
        businessImpact: {
            salesSuspended: boolean;
            ecommerceUpdatesHalted: boolean;
            orderFulfillmentPaused: boolean;
            estimatedRevenueLoss?: number;
        };

        // Scheduling details
        scheduledStartTime: string;
        scheduledEndTime: string;
        actualStartTime: string;

        // Previous count reference
        lastCountDate?: string;
        lastCountVariance?: number;

        // Preparation checklist
        preparationCompleted: {
            systemBackupTaken: boolean;
            countersTrained: boolean;
            equipmentTested: boolean;
            locationsOrganized: boolean;
            safetyBriefingDone: boolean;
        };

        startedBy: string;
        userId: string;
        createdAt: string;

        // Count specifications
        allowPartialCounts: boolean;
        varianceThreshold: number; // Percentage
        recountRequired: boolean;

        // Technology support
        mobileAppEnabled: boolean;
        barcodeScannersDeployed: number;
        realTimeSync: boolean;
    };
}

export interface InventoryCountCompletedEvent extends BaseEvent {
    subject: Subjects.InventoryCountCompleted;
    data: {
        countId: string;
        countType: "FULL" | "PARTIAL" | "CYCLE" | "SPOT_CHECK";

        // Completion details
        startedAt: string;
        completedAt: string;
        actualDuration: number; // hours

        // Count results summary
        results: {
            totalItemsCounted: number;
            totalVariancesFound: number;
            variancePercentage: number;
            totalValueVariance: number;

            // Breakdown by variance type
            surplusItems: number;
            shortageItems: number;
            missingItems: number;
            foundItems: number;
            damagedItems: number;
        };

        // Accuracy metrics
        accuracy: {
            countAccuracy: number; // Percentage
            valueAccuracy: number; // Percentage
            errorRate: number; // Percentage
            recountsRequired: number;
        };

        // Team performance
        teamPerformance: Array<{
            userId: string;
            userName: string;
            itemsCounted: number;
            variancesFound: number;
            timeSpent: number; // minutes
            accuracy: number; // percentage
        }>;

        // Major findings
        significantVariances: Array<{
            inventoryItemId: string;
            inventoryItemName: string;
            systemQuantity: number;
            physicalQuantity: number;
            variance: number;
            valueImpact: number;
            possibleCause?: string;
        }>;

        // Business impact assessment
        businessImpact: {
            stockOutsIdentified: number;
            overstockIdentified: number;
            deadStockFound: number;
            shrinkageValue: number;
            adjustmentValue: number;
        };

        // Next steps
        nextSteps: {
            adjustmentsRequired: boolean;
            investigationRequired: boolean;
            managementReviewNeeded: boolean;
            systemUpdatesNeeded: boolean;
        };

        completedBy: string;
        approvedBy?: string;
        userId: string;

        // Quality assurance
        qualityChecks: {
            sampleRecountPerformed: boolean;
            supervisoryReviewDone: boolean;
            anomaliesInvestigated: boolean;
            documentationComplete: boolean;
        };

        // Follow-up scheduling
        followUpRequired: boolean;
        nextCountScheduled?: string;
        improvementAreasIdentified: string[];
    };
}

export interface InventoryVarianceDetectedEvent extends BaseEvent {
    subject: Subjects.InventoryVarianceDetected;
    data: {
        varianceId: string;
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;
        category: string;

        // Variance details
        systemQuantity: number;
        physicalQuantity: number;
        varianceQuantity: number;
        varianceType: "SURPLUS" | "SHORTAGE" | "MISSING" | "FOUND" | "DAMAGED";
        variancePercentage: number;

        // Financial impact
        unitCost?: number;
        unitPrice?: number;
        totalCostImpact: number;
        totalPriceImpact: number;

        // Detection details
        detectedBy: string;
        detectedAt: string;
        detectionMethod:
            | "PHYSICAL_COUNT"
            | "SYSTEM_ALERT"
            | "SALE_ATTEMPT"
            | "CYCLE_COUNT"
            | "CUSTOMER_COMPLAINT";

        // Location and batch information
        location?: string;
        batchNumber?: string;
        lotNumber?: string;

        // Investigation details
        possibleCauses: string[];
        investigationRequired: boolean;
        investigationPriority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

        // Historical context
        historicalVariances?: Array<{
            date: string;
            variance: number;
            resolved: boolean;
        }>;

        lastCountDate?: string;
        lastCountQuantity?: number;

        // Pattern analysis
        variancePattern?:
            | "FIRST_TIME"
            | "RECURRING"
            | "SEASONAL"
            | "SYSTEMATIC";
        riskAssessment: "LOW" | "MEDIUM" | "HIGH";

        // Business impact
        immediateActions: {
            stockAdjustmentNeeded: boolean;
            salesSuspended: boolean;
            reorderRequired: boolean;
            customerOrdersAffected: number;
        };

        // Approval and resolution
        requiresApproval: boolean;
        approvalThreshold?: number;
        resolutionDeadline?: string;

        userId: string;
        createdAt: string;

        // Compliance and audit
        auditTrailRequired: boolean;
        regulatoryImpact: boolean;
        documentationLevel: "BASIC" | "DETAILED" | "COMPREHENSIVE";
    };
}

export interface InventoryAdjustmentMadeEvent extends BaseEvent {
    subject: Subjects.InventoryAdjustmentMade;
    data: {
        adjustmentId: string;
        inventoryItemId: string;
        inventoryItemName: string;
        sku?: string;
        category: string;

        // Adjustment details
        previousQuantity: number;
        adjustedQuantity: number;
        adjustmentAmount: number; // Can be positive or negative
        adjustmentType: "INCREASE" | "DECREASE";
        unit: string;

        // Reason and justification
        reason:
            | "PHYSICAL_COUNT_VARIANCE"
            | "SYSTEM_ERROR_CORRECTION"
            | "DAMAGE_WRITEOFF"
            | "THEFT_WRITEOFF"
            | "EXPIRY_WRITEOFF"
            | "QUALITY_REJECTION"
            | "FOUND_STOCK"
            | "CLERICAL_ERROR"
            | "SUPPLIER_SHORTAGE"
            | "PRODUCTION_VARIANCE"
            | "OTHER";

        description?: string;
        supportingDocuments?: string[];

        // Reference information
        sourceReference?: string; // Count ID, investigation ID, etc.
        relatedVarianceId?: string;

        // Financial impact
        unitCost?: number;
        totalFinancialImpact: number;
        impactType: "LOSS" | "GAIN" | "NEUTRAL";

        // Approval workflow
        requiresApproval: boolean;
        approvalLevel: "SUPERVISOR" | "MANAGER" | "DIRECTOR";
        approvedBy?: string;
        approvalDate?: string;
        approvalComments?: string;

        // Processing details
        processedBy: string;
        processedAt: string;
        batchAdjustment: boolean;

        // Location and batch tracking
        location?: string;
        batchNumber?: string;
        serialNumbers?: string[];

        // System integration
        ledgerEntryCreated: boolean;
        stockMovementRecorded: boolean;
        reportsUpdated: boolean;
        alertsTriggered: string[];

        // Post-adjustment status
        newStockStatus:
            | "IN_STOCK"
            | "LOW_STOCK"
            | "OUT_OF_STOCK"
            | "OVERSTOCKED";
        reorderTriggered?: boolean;
        priceImpact?: boolean;

        userId: string;

        // Quality assurance
        verificationRequired: boolean;
        verifiedBy?: string;
        verificationDate?: string;

        // Follow-up actions
        followUpActions: {
            processImprovementNeeded: boolean;
            trainingRequired: boolean;
            systemFixNeeded: boolean;
            vendorContactRequired: boolean;
        };

        // Compliance tracking
        auditTrail: {
            beforeSnapshot: any;
            afterSnapshot: any;
            changeLog: string[];
        };
    };
}

export interface InventoryTurnoverCalculatedEvent extends BaseEvent {
    subject: Subjects.InventoryTurnoverCalculated;
    data: {
        calculationId: string;
        period: {
            startDate: string;
            endDate: string;
        };

        // Overall turnover metrics
        overallTurnover: {
            turnoverRatio: number;
            daysInInventory: number;
            totalCostOfGoodsSold: number;
            averageInventoryValue: number;
        };

        // Category-wise analysis
        categoryAnalysis: Array<{
            category: string;
            turnoverRatio: number;
            daysInInventory: number;
            totalValue: number;
            itemCount: number;
            fastMoving: number;
            slowMoving: number;
            performance: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR";
        }>;

        // Item-wise insights
        topPerformers: Array<{
            inventoryItemId: string;
            inventoryItemName: string;
            turnoverRatio: number;
            totalSales: number;
            averageStock: number;
        }>;

        slowMovingItems: Array<{
            inventoryItemId: string;
            inventoryItemName: string;
            turnoverRatio: number;
            daysInInventory: number;
            currentStock: number;
            lastSaleDate?: string;
        }>;

        deadStock: Array<{
            inventoryItemId: string;
            inventoryItemName: string;
            daysWithoutSale: number;
            currentStock: number;
            tiedUpValue: number;
        }>;

        // Recommendations
        recommendations: {
            itemsToReorder: string[];
            itemsToDiscount: string[];
            itemsToDiscontinue: string[];
            overstockedItems: string[];
        };

        // Business impact
        workingCapitalInsights: {
            totalInventoryValue: number;
            excessInventoryValue: number;
            cashTiedUp: number;
            optimizationPotential: number;
        };

        calculatedAt: string;
        calculatedBy: string;
        userId: string;

        // Comparison with previous periods
        previousPeriodComparison?: {
            turnoverImprovement: number;
            inventoryReduction: number;
            efficiencyGain: number;
        };
    };
}

// ========================================
// EXPORT ALL INVENTORY ITEM EVENT TYPES
// ========================================

export type InventoryItemEventTypes =
    | InventoryItemCreatedEvent
    | InventoryItemUpdatedEvent
    | InventoryItemDeletedEvent
    | InventoryItemActivatedEvent
    | InventoryItemDeactivatedEvent
    | InventoryItemPriceUpdatedEvent
    | InventoryItemCostUpdatedEvent
    | InventoryItemCategoryChangedEvent
    | InventoryItemImageUpdatedEvent
    | StockAddedEvent
    | StockReducedEvent
    | StockAdjustedEvent
    | StockTransferredEvent
    | StockDamagedEvent
    | StockExpiredEvent
    | StockReturnedEvent
    | StockLowEvent
    | StockCriticalEvent
    | StockOutEvent
    | StockReorderRequiredEvent
    | StockReceivedEvent
    | StockOrderedEvent
    | InventoryCountStartedEvent
    | InventoryCountCompletedEvent
    | InventoryVarianceDetectedEvent
    | InventoryAdjustmentMadeEvent
    | InventoryTurnoverCalculatedEvent
    | InventoryItemPriceUpdatedEvent
    | InventoryItemCostUpdatedEvent
    | StockAddedEvent
    | StockReducedEvent
    | StockAdjustedEvent
    | StockTransferredEvent
    | StockLowEvent
    | StockCriticalEvent
    | StockOutEvent
    | StockReorderRequiredEvent
    | InventoryTurnoverCalculatedEvent;
