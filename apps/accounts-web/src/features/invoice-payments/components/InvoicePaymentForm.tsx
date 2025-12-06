// apps/accounts-web/src/features/invoice-payments/components/InvoicePaymentForm.tsx
// Enhanced version with dynamic invoice fetching

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
    CreateInvoicePaymentSchema,
    type CreateInvoicePaymentType,
} from "@repo/common/schemas";
import { Button, Input, Label, Card } from "@repo/ui";
import type { InvoicePayment } from "@repo/common/types";
import { invoicesApi } from "@/features/invoices/api/invoices.api";
import { useState } from "react";

interface InvoicePaymentFormProps {
    initialData?: InvoicePayment;
    onSubmit: (data: CreateInvoicePaymentType) => void;
    isLoading?: boolean;
    parties?: Array<{ id: string; name: string }>;
}

export const InvoicePaymentForm = ({
    initialData,
    onSubmit,
    isLoading,
    parties = [],
}: InvoicePaymentFormProps) => {
    const [, setSelectedMethod] = useState(initialData?.method || "CASH");

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
                  reference: initialData.reference || undefined,
                  description: initialData.description || undefined,
                  partyId: initialData.partyId,
                  invoiceId: initialData.invoiceId || undefined,
                  bankName: initialData.bankName || undefined,
                  chequeNo: initialData.chequeNo || undefined,
                  chequeDate: initialData.chequeDate
                      ? new Date(initialData.chequeDate)
                            .toISOString()
                            .split("T")[0]
                      : undefined,
                  clearanceDate: initialData.clearanceDate
                      ? new Date(initialData.clearanceDate)
                            .toISOString()
                            .split("T")[0]
                      : undefined,
                  charges: initialData.charges || undefined,
              }
            : {
                  amount: 0,
                  date: new Date().toISOString().split("T")[0],
                  method: "CASH",
                  partyId: "",
              },
    });

    const watchMethod = watch("method");
    const watchPartyId = watch("partyId");

    // Dynamically fetch invoices for selected party
    // Fetch all invoices then filter on frontend to avoid schema issues with comma-separated status
    const { data: partyInvoices, isLoading: loadingInvoices } = useQuery({
        queryKey: ["invoices", "party", watchPartyId, "unpaid"],
        queryFn: async () => {
            const response = await invoicesApi.getInvoices({
                partyId: watchPartyId,
                limit: 100,
                page: 1,
                sortOrder: "desc",
            });
            return response;
        },
        enabled: !!watchPartyId, // Only fetch when party is selected
    });

    // Filter for unpaid/partially paid invoices on the frontend
    const filteredInvoices = (partyInvoices?.data || []).filter(
        (invoice) =>
            invoice.status === "PENDING" || invoice.status === "PARTIALLY_PAID"
    );
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Payment Information */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Payment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            {...register("amount", { valueAsNumber: true })}
                            error={errors.amount?.message}
                            placeholder="Enter amount"
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
                        <Label htmlFor="partyId">Party/Supplier *</Label>
                        <select
                            id="partyId"
                            {...register("partyId")}
                            className={`w-full px-3 py-2 border rounded-md ${
                                errors.partyId
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        >
                            <option value="">Select party</option>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            disabled={!watchPartyId || loadingInvoices}
                        >
                            <option value="">
                                {!watchPartyId
                                    ? "Select party first"
                                    : loadingInvoices
                                      ? "Loading invoices..."
                                      : "Select invoice (optional)"}
                            </option>
                            {filteredInvoices.map((invoice) => (
                                <option key={invoice.id} value={invoice.id}>
                                    {invoice.invoiceNo} - ₹
                                    {invoice.remainingAmount.toFixed(2)}
                                </option>
                            ))}
                        </select>
                        {watchPartyId &&
                            filteredInvoices.length === 0 &&
                            !loadingInvoices && (
                                <p className="text-sm text-gray-500">
                                    No pending invoices for this party
                                </p>
                            )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="method">Payment Method *</Label>
                        <select
                            id="method"
                            {...register("method", {
                                onChange: (e) =>
                                    setSelectedMethod(e.target.value),
                            })}
                            className={`w-full px-3 py-2 border rounded-md ${
                                errors.method
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        >
                            <option value="CASH">Cash</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="CHEQUE">Cheque</option>
                            <option value="UPI">UPI</option>
                            <option value="CARD">Card</option>
                            <option value="ONLINE">Online</option>
                            <option value="OTHER">Other</option>
                        </select>
                        {errors.method && (
                            <p className="text-sm text-red-500">
                                {errors.method.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference">Reference Number</Label>
                        <Input
                            id="reference"
                            {...register("reference")}
                            error={errors.reference?.message}
                            placeholder="Transaction ID, Receipt No, etc."
                        />
                    </div>

                    <div className="col-span-full space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            {...register("description")}
                            error={errors.description?.message}
                            placeholder="Payment description or notes"
                        />
                    </div>
                </div>
            </Card>

            {/* Cheque Details - Show only for CHEQUE method */}
            {watchMethod === "CHEQUE" && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Cheque Details
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
                            <Label htmlFor="clearanceDate">
                                Clearance Date (Optional)
                            </Label>
                            <Input
                                id="clearanceDate"
                                type="date"
                                {...register("clearanceDate")}
                                error={errors.clearanceDate?.message}
                            />
                        </div>
                    </div>
                </Card>
            )}

            {/* Bank Transfer Details - Show for BANK_TRANSFER method */}
            {watchMethod === "BANK_TRANSFER" && (
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
                            <Label htmlFor="charges">
                                Transfer Charges (Optional)
                            </Label>
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

            {/* Online Payment Details - Show for ONLINE method */}
            {watchMethod === "ONLINE" && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Online Payment Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <p className="text-sm text-gray-500 mt-2">
                        Note: Gateway transaction IDs are automatically captured
                        by the system during payment processing.
                    </p>
                </Card>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
                <Button
                    type="submit"
                    disabled={isLoading}
                    isLoading={isLoading}
                >
                    {initialData ? "Update Payment" : "Create Payment"}
                </Button>
            </div>
        </form>
    );
};
