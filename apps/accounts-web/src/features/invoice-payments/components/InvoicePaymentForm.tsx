// apps/accounts-web/src/features/invoice-payments/components/InvoicePaymentForm.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    CreateInvoicePaymentSchema,
    type CreateInvoicePaymentType,
} from "@repo/common/schemas";
import { Button, Input, Label, Card } from "@repo/ui";
import type { InvoicePayment } from "@repo/common/types";
import { useState } from "react";

interface InvoicePaymentFormProps {
    initialData?: InvoicePayment;
    onSubmit: (data: CreateInvoicePaymentType) => void;
    isLoading?: boolean;
    parties?: Array<{ id: string; name: string }>;
    invoices?: Array<{
        id: string;
        invoiceNo: string;
        remainingAmount: number;
    }>;
}

export const InvoicePaymentForm = ({
    initialData,
    onSubmit,
    isLoading,
    parties = [],
    invoices = [],
}: InvoicePaymentFormProps) => {
    const [selectedMethod, setSelectedMethod] = useState(
        initialData?.method || "CASH"
    );

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<CreateInvoicePaymentType>({
        resolver: zodResolver(CreateInvoicePaymentSchema),
        defaultValues: initialData
            ? {
                  amount: initialData.amount,
                  date: new Date(initialData.date).toISOString().split("T")[0],
                  method: initialData.method,
                  reference: initialData.reference || "",
                  description: initialData.description || "",
                  partyId: initialData.partyId,
                  invoiceId: initialData.invoiceId || undefined,
                  bankName: initialData.bankName || "",
                  chequeNo: initialData.chequeNo || "",
                  chequeDate: initialData.chequeDate
                      ? new Date(initialData.chequeDate)
                            .toISOString()
                            .split("T")[0]
                      : undefined,
                  gatewayOrderId: initialData.gatewayOrderId || "",
                  gatewayPaymentId: initialData.gatewayPaymentId || "",
                  transactionId: initialData.transactionId || "",
                  charges: initialData.charges || undefined,
              }
            : {
                  amount: 0,
                  date: new Date().toISOString().split("T")[0],
                  method: "CASH",
              },
    });

    const watchMethod = watch("method");
    const watchPartyId = watch("partyId");

    // Filter invoices based on selected party
    const filteredInvoices =
        watchPartyId && invoices
            ? invoices.filter((inv: any) => inv.partyId === watchPartyId)
            : [];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Payment Information */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Payment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="partyId">Party *</Label>
                        <select
                            id="partyId"
                            {...register("partyId")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Party</option>
                            {parties.map((party) => (
                                <option key={party.id} value={party.id}>
                                    {party.name}
                                </option>
                            ))}
                        </select>
                        {errors.partyId && (
                            <p className="text-sm text-red-500">
                                {errors.partyId.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="invoiceId">Invoice (Optional)</Label>
                        <select
                            id="invoiceId"
                            {...register("invoiceId")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!watchPartyId}
                        >
                            <option value="">Select Invoice (Optional)</option>
                            {filteredInvoices.map((invoice: any) => (
                                <option key={invoice.id} value={invoice.id}>
                                    {invoice.invoiceNo} - Remaining: ₹
                                    {invoice.remainingAmount?.toLocaleString()}
                                </option>
                            ))}
                        </select>
                        {errors.invoiceId && (
                            <p className="text-sm text-red-500">
                                {errors.invoiceId.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            {...register("amount", { valueAsNumber: true })}
                            error={errors.amount?.message}
                            placeholder="Enter payment amount"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Payment Date *</Label>
                        <Input
                            id="date"
                            type="date"
                            {...register("date")}
                            error={errors.date?.message}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="method">Payment Method *</Label>
                        <select
                            id="method"
                            {...register("method")}
                            onChange={(e) =>
                                setSelectedMethod(e.target.value as any)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="CASH">Cash</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="CHEQUE">Cheque</option>
                            <option value="UPI">UPI</option>
                            <option value="CARD">Card</option>
                            <option value="ONLINE">Online Gateway</option>
                            <option value="OTHER">Other</option>
                        </select>
                        {errors.method && (
                            <p className="text-sm text-red-500">
                                {errors.method.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference">Reference</Label>
                        <Input
                            id="reference"
                            {...register("reference")}
                            error={errors.reference?.message}
                            placeholder="Transaction reference"
                        />
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                        id="description"
                        {...register("description")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        placeholder="Payment description or notes"
                    />
                </div>
            </Card>

            {/* Cheque Details */}
            {(watchMethod === "CHEQUE" || selectedMethod === "CHEQUE") && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Cheque Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="chequeNo">Cheque Number</Label>
                            <Input
                                id="chequeNo"
                                {...register("chequeNo")}
                                error={errors.chequeNo?.message}
                                placeholder="Enter cheque number"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="chequeDate">Cheque Date</Label>
                            <Input
                                id="chequeDate"
                                type="date"
                                {...register("chequeDate")}
                                error={errors.chequeDate?.message}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input
                                id="bankName"
                                {...register("bankName")}
                                error={errors.bankName?.message}
                                placeholder="Enter bank name"
                            />
                        </div>
                    </div>
                </Card>
            )}

            {/* Bank Transfer Details */}
            {(watchMethod === "BANK_TRANSFER" ||
                selectedMethod === "BANK_TRANSFER") && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Bank Transfer Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input
                                id="bankName"
                                {...register("bankName")}
                                error={errors.bankName?.message}
                                placeholder="Enter bank name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="transactionId">
                                Transaction ID
                            </Label>
                            <Input
                                id="transactionId"
                                {...register("transactionId")}
                                error={errors.transactionId?.message}
                                placeholder="Enter transaction ID"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="charges">Transfer Charges</Label>
                            <Input
                                id="charges"
                                type="number"
                                step="0.01"
                                {...register("charges", {
                                    valueAsNumber: true,
                                })}
                                error={errors.charges?.message}
                                placeholder="Enter transfer charges"
                            />
                        </div>
                    </div>
                </Card>
            )}

            {/* UPI Details */}
            {(watchMethod === "UPI" || selectedMethod === "UPI") && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">UPI Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="transactionId">
                                UPI Transaction ID
                            </Label>
                            <Input
                                id="transactionId"
                                {...register("transactionId")}
                                error={errors.transactionId?.message}
                                placeholder="Enter UPI transaction ID"
                            />
                        </div>
                    </div>
                </Card>
            )}

            {/* Online Gateway Details */}
            {(watchMethod === "ONLINE" || selectedMethod === "ONLINE") && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Gateway Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="gatewayOrderId">
                                Gateway Order ID
                            </Label>
                            <Input
                                id="gatewayOrderId"
                                {...register("gatewayOrderId")}
                                error={errors.gatewayOrderId?.message}
                                placeholder="Enter gateway order ID"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gatewayPaymentId">
                                Gateway Payment ID
                            </Label>
                            <Input
                                id="gatewayPaymentId"
                                {...register("gatewayPaymentId")}
                                error={errors.gatewayPaymentId?.message}
                                placeholder="Enter gateway payment ID"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="transactionId">
                                Transaction ID
                            </Label>
                            <Input
                                id="transactionId"
                                {...register("transactionId")}
                                error={errors.transactionId?.message}
                                placeholder="Enter transaction ID"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="charges">Gateway Charges</Label>
                            <Input
                                id="charges"
                                type="number"
                                step="0.01"
                                {...register("charges", {
                                    valueAsNumber: true,
                                })}
                                error={errors.charges?.message}
                                placeholder="Enter gateway charges"
                            />
                        </div>
                    </div>
                </Card>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
                <Button type="submit" disabled={isLoading} loading={isLoading}>
                    {initialData ? "Update Payment" : "Create Payment"}
                </Button>
            </div>
        </form>
    );
};
