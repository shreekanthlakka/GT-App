// apps/accounts-web/src/features/sales/components/SaleForm.tsx

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateSaleSchema, type CreateSaleType } from "@repo/common/schemas";
import { Button, Input, Label, Card } from "@repo/ui";
import { Plus, Trash2 } from "lucide-react";
import type { Sale } from "@repo/common/types";

interface SaleFormProps {
    initialData?: Sale;
    onSubmit: (data: CreateSaleType) => void;
    isLoading?: boolean;
    customers?: Array<{ id: string; name: string }>;
}

export const SaleForm = ({
    initialData,
    onSubmit,
    isLoading,
    customers = [],
}: SaleFormProps) => {
    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CreateSaleType>({
        resolver: zodResolver(CreateSaleSchema),
        defaultValues: initialData
            ? {
                  saleNo: initialData.saleNo,
                  date: new Date(initialData.date).toISOString(),
                  amount: initialData.amount,
                  items: initialData.items || [],
                  taxAmount: initialData.taxAmount || undefined,
                  discountAmount: initialData.discountAmount || 0,
                  roundOffAmount: initialData.roundOffAmount || 0,
                  salesPerson: initialData.salesPerson || "",
                  deliveryDate: initialData.deliveryDate
                      ? new Date(initialData.deliveryDate).toISOString()
                      : undefined,
                  deliveryAddress: initialData.deliveryAddress || "",
                  transportation: initialData.transportation || "",
                  vehicleNo: initialData.vehicleNo || "",
                  reference: initialData.reference || "",
                  terms: initialData.terms || "",
                  notes: initialData.notes || "",
                  customerId: initialData.customerId,
              }
            : {
                  date: new Date().toISOString(),
                  amount: 0,
                  discountAmount: 0,
                  roundOffAmount: 0,
                  items: [
                      {
                          itemName: "",
                          price: 0,
                          quantity: 1,
                          total: 0,
                          unit: "PCS",
                      },
                  ],
                  customerId: "",
              },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const watchItems = watch("items");
    const watchDiscountAmount = watch("discountAmount");

    // Auto-calculate amounts
    useEffect(() => {
        if (!watchItems || watchItems.length === 0) return;

        let subtotal = 0;

        watchItems.forEach((item, index) => {
            const quantity = item.quantity || 0;
            const price = item.price || 0;
            const itemTotal = quantity * price;

            subtotal += itemTotal;

            // Update item total
            setValue(`items.${index}.total`, itemTotal);
        });

        const discount = watchDiscountAmount || 0;
        const total = subtotal - discount;

        setValue("amount", Math.round(total * 100) / 100);
    }, [watchItems, watchDiscountAmount, setValue]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="saleNo">Sale Number *</Label>
                        <Input
                            id="saleNo"
                            {...register("saleNo")}
                            error={errors.saleNo?.message}
                            placeholder="Enter sale number"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="customerId">Customer *</Label>
                        <select
                            id="customerId"
                            {...register("customerId")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select customer</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name}
                                </option>
                            ))}
                        </select>
                        {errors.customerId && (
                            <p className="text-red-500 text-sm">
                                {errors.customerId.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Sale Date *</Label>
                        <Input
                            id="date"
                            type="date"
                            {...register("date")}
                            error={errors.date?.message}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="salesPerson">Sales Person</Label>
                        <Input
                            id="salesPerson"
                            {...register("salesPerson")}
                            placeholder="Sales person name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference">Reference</Label>
                        <Input
                            id="reference"
                            {...register("reference")}
                            placeholder="Customer reference"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deliveryDate">Delivery Date</Label>
                        <Input
                            id="deliveryDate"
                            type="date"
                            {...register("deliveryDate")}
                        />
                    </div>
                </div>
            </Card>

            {/* Sale Items */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Sale Items</h3>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                            append({
                                itemName: "",
                                price: 0,
                                quantity: 1,
                                total: 0,
                                unit: "PCS",
                            })
                        }
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                    </Button>
                </div>

                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div
                            key={field.id}
                            className="grid grid-cols-12 gap-3 p-4 border rounded-lg"
                        >
                            <div className="col-span-12 md:col-span-3">
                                <Label>Item Name *</Label>
                                <Input
                                    {...register(`items.${index}.itemName`)}
                                    placeholder="Item name"
                                    error={
                                        errors.items?.[index]?.itemName?.message
                                    }
                                />
                            </div>

                            <div className="col-span-6 md:col-span-2">
                                <Label>Type</Label>
                                <Input
                                    {...register(`items.${index}.itemType`)}
                                    placeholder="Saree, Fabric"
                                />
                            </div>

                            <div className="col-span-6 md:col-span-2">
                                <Label>Design</Label>
                                <Input
                                    {...register(`items.${index}.design`)}
                                    placeholder="Design"
                                />
                            </div>

                            <div className="col-span-6 md:col-span-1">
                                <Label>Color</Label>
                                <Input
                                    {...register(`items.${index}.color`)}
                                    placeholder="Color"
                                />
                            </div>

                            <div className="col-span-6 md:col-span-1">
                                <Label>Qty *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    {...register(`items.${index}.quantity`, {
                                        valueAsNumber: true,
                                    })}
                                    placeholder="0"
                                    error={
                                        errors.items?.[index]?.quantity?.message
                                    }
                                />
                            </div>

                            <div className="col-span-6 md:col-span-1">
                                <Label>Price *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    {...register(`items.${index}.price`, {
                                        valueAsNumber: true,
                                    })}
                                    placeholder="0.00"
                                    error={
                                        errors.items?.[index]?.price?.message
                                    }
                                />
                            </div>

                            <div className="col-span-6 md:col-span-1">
                                <Label>Total</Label>
                                <Input
                                    type="number"
                                    {...register(`items.${index}.total`, {
                                        valueAsNumber: true,
                                    })}
                                    readOnly
                                    className="bg-gray-50"
                                />
                            </div>

                            <div className="col-span-12 md:col-span-1 flex items-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => remove(index)}
                                    disabled={fields.length === 1}
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="mt-6 border-t pt-4">
                    <div className="grid grid-cols-2 gap-4 max-w-md ml-auto">
                        <div className="space-y-2">
                            <Label htmlFor="discountAmount">Discount</Label>
                            <Input
                                id="discountAmount"
                                type="number"
                                step="0.01"
                                {...register("discountAmount", {
                                    valueAsNumber: true,
                                })}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="roundOffAmount">Round Off</Label>
                            <Input
                                id="roundOffAmount"
                                type="number"
                                step="0.01"
                                {...register("roundOffAmount", {
                                    valueAsNumber: true,
                                })}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="amount" className="font-semibold">
                                Total Amount
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                {...register("amount", {
                                    valueAsNumber: true,
                                })}
                                readOnly
                                className="bg-gray-50 font-semibold text-lg"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Delivery Details */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Delivery Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                        <Label htmlFor="deliveryAddress">
                            Delivery Address
                        </Label>
                        <Input
                            id="deliveryAddress"
                            {...register("deliveryAddress")}
                            placeholder="Full delivery address"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="transportation">Transportation</Label>
                        <Input
                            id="transportation"
                            {...register("transportation")}
                            placeholder="Transport method"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vehicleNo">Vehicle Number</Label>
                        <Input
                            id="vehicleNo"
                            {...register("vehicleNo")}
                            placeholder="Vehicle number"
                        />
                    </div>
                </div>
            </Card>

            {/* Additional Information */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Additional Information
                </h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="terms">Payment Terms</Label>
                        <Input
                            id="terms"
                            {...register("terms")}
                            placeholder="Payment terms and conditions"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <textarea
                            id="notes"
                            {...register("notes")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                            placeholder="Any additional notes"
                        />
                    </div>
                </div>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
                <Button
                    type="submit"
                    disabled={isLoading}
                    isLoading={isLoading}
                >
                    {initialData ? "Update Sale" : "Create Sale"}
                </Button>
            </div>
        </form>
    );
};
