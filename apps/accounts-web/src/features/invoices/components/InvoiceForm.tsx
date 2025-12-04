// apps/accounts-web/src/features/invoices/components/InvoiceForm.tsx

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    CreateInvoiceSchema,
    type CreateInvoiceType,
} from "@repo/common/schemas";
import { Button, Input, Label, Card } from "@repo/ui";
import { Plus, Trash2 } from "lucide-react";
import type { Invoice } from "@repo/common/types";

interface InvoiceFormProps {
    initialData?: Invoice;
    onSubmit: (data: CreateInvoiceType) => void;
    isLoading?: boolean;
    parties?: Array<{ id: string; name: string }>;
}

export const InvoiceForm = ({
    initialData,
    onSubmit,
    isLoading,
    parties = [],
}: InvoiceFormProps) => {
    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CreateInvoiceType>({
        resolver: zodResolver(CreateInvoiceSchema),
        defaultValues: initialData
            ? {
                  invoiceNo: initialData.invoiceNo,
                  date: new Date(initialData.date).toISOString(),
                  dueDate: initialData.dueDate
                      ? new Date(initialData.dueDate).toISOString()
                      : undefined,
                  amount: initialData.amount,
                  items: initialData.items || [],
                  description: initialData.description || "",
                  taxAmount: initialData.taxAmount || undefined,
                  discountAmount: initialData.discountAmount || 0,
                  roundOffAmount: initialData.roundOffAmount || 0,
                  notes: initialData.notes || "",
                  poNumber: initialData.poNumber || "",
                  transportMode: initialData.transportMode || "",
                  vehicleNo: initialData.vehicleNo || "",
                  deliveryNote: initialData.deliveryNote || "",
                  supplierRef: initialData.supplierRef || "",
                  otherRef: initialData.otherRef || "",
                  buyersOrderNo: initialData.buyersOrderNo || "",
                  dispatchedThrough: initialData.dispatchedThrough || "",
                  destination: initialData.destination || "",
                  partyId: initialData.partyId,
              }
            : {
                  date: new Date().toISOString(),
                  amount: 0,
                  discountAmount: 0,
                  roundOffAmount: 0,
                  items: [
                      {
                          description: "",
                          quantity: 1,
                          rate: 0,
                          amount: 0,
                          hsnCode: "",
                          taxRate: 0,
                      },
                  ],
                  partyId: "",
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
        let totalTax = 0;

        watchItems.forEach((item, index) => {
            const quantity = item.quantity || 0;
            const rate = item.rate || 0;
            const taxRate = item.taxRate || 0;

            const itemAmount = quantity * rate;
            const taxAmount = (itemAmount * taxRate) / 100;

            subtotal += itemAmount;
            totalTax += taxAmount;

            // Update item amount
            setValue(`items.${index}.amount`, itemAmount);
        });

        const discount = watchDiscountAmount || 0;
        const total = subtotal + totalTax - discount;

        setValue("taxAmount", totalTax);
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
                        <Label htmlFor="invoiceNo">Invoice Number *</Label>
                        <Input
                            id="invoiceNo"
                            {...register("invoiceNo")}
                            error={errors.invoiceNo?.message}
                            placeholder="Enter invoice number"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="partyId">Supplier/Party *</Label>
                        <select
                            id="partyId"
                            {...register("partyId")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select supplier</option>
                            {parties.map((party) => (
                                <option key={party.id} value={party.id}>
                                    {party.name}
                                </option>
                            ))}
                        </select>
                        {errors.partyId && (
                            <p className="text-red-500 text-sm">
                                {errors.partyId.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Invoice Date *</Label>
                        <Input
                            id="date"
                            type="date"
                            {...register("date")}
                            error={errors.date?.message}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            {...register("dueDate")}
                            error={errors.dueDate?.message}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="poNumber">PO Number</Label>
                        <Input
                            id="poNumber"
                            {...register("poNumber")}
                            placeholder="Purchase Order Number"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="supplierRef">Supplier Reference</Label>
                        <Input
                            id="supplierRef"
                            {...register("supplierRef")}
                            placeholder="Supplier reference number"
                        />
                    </div>
                </div>
            </Card>

            {/* Invoice Items */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Invoice Items</h3>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                            append({
                                description: "",
                                quantity: 1,
                                rate: 0,
                                amount: 0,
                                hsnCode: "",
                                taxRate: 0,
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
                            <div className="col-span-12 md:col-span-4">
                                <Label>Description *</Label>
                                <Input
                                    {...register(`items.${index}.description`)}
                                    placeholder="Item description"
                                    error={
                                        errors.items?.[index]?.description
                                            ?.message
                                    }
                                />
                            </div>

                            <div className="col-span-6 md:col-span-2">
                                <Label>Quantity *</Label>
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

                            <div className="col-span-6 md:col-span-2">
                                <Label>Rate *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    {...register(`items.${index}.rate`, {
                                        valueAsNumber: true,
                                    })}
                                    placeholder="0.00"
                                    error={errors.items?.[index]?.rate?.message}
                                />
                            </div>

                            <div className="col-span-6 md:col-span-2">
                                <Label>Tax %</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    {...register(`items.${index}.taxRate`, {
                                        valueAsNumber: true,
                                    })}
                                    placeholder="0"
                                />
                            </div>

                            <div className="col-span-6 md:col-span-1">
                                <Label>Amount</Label>
                                <Input
                                    type="number"
                                    {...register(`items.${index}.amount`, {
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
                            <Label htmlFor="taxAmount">Tax Amount</Label>
                            <Input
                                id="taxAmount"
                                type="number"
                                {...register("taxAmount", {
                                    valueAsNumber: true,
                                })}
                                readOnly
                                className="bg-gray-50"
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

            {/* Transport Details */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Transport Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="transportMode">Transport Mode</Label>
                        <Input
                            id="transportMode"
                            {...register("transportMode")}
                            placeholder="Road, Rail, Air, etc."
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

                    <div className="space-y-2">
                        <Label htmlFor="dispatchedThrough">
                            Dispatched Through
                        </Label>
                        <Input
                            id="dispatchedThrough"
                            {...register("dispatchedThrough")}
                            placeholder="Courier/Transport company"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="destination">Destination</Label>
                        <Input
                            id="destination"
                            {...register("destination")}
                            placeholder="Delivery destination"
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
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            {...register("description")}
                            placeholder="Invoice description"
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
                    {initialData ? "Update Invoice" : "Create Invoice"}
                </Button>
            </div>
        </form>
    );
};
