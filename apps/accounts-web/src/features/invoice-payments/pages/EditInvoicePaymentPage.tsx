// apps/accounts-web/src/features/invoice-payments/pages/EditInvoicePaymentPage.tsx

import { useParams, useNavigate } from "react-router-dom";
import { InvoicePaymentForm } from "../components/InvoicePaymentForm";
import {
    useInvoicePayment,
    useUpdateInvoicePayment,
} from "../hooks/use-invoice-payments";
import { ArrowLeft } from "lucide-react";
import type { CreateInvoicePaymentType } from "@repo/common/schemas";
import { useQuery } from "@tanstack/react-query";
import { partiesApi } from "@/features/parties/api/parties.api";
import { Skeleton } from "@repo/ui";

export const EditInvoicePaymentPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: payment, isLoading: paymentLoading } = useInvoicePayment(id!);
    const updateMutation = useUpdateInvoicePayment(id!);

    // Fetch parties for dropdown
    const { data: partiesData } = useQuery({
        queryKey: ["parties", "list"],
        queryFn: () =>
            partiesApi.getParties({
                page: 1,
                limit: 1000,
                sortOrder: "asc",
            }),
    });

    const handleSubmit = async (data: CreateInvoicePaymentType) => {
        await updateMutation.mutateAsync(data);
        navigate(`/invoice-payments/${id}`);
    };

    if (paymentLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    if (!payment) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Payment not found</h2>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/invoice-payments/${id}`)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Edit Payment</h1>
                    <p className="text-gray-600">
                        Update payment information for voucher{" "}
                        {payment.voucherId}
                    </p>
                </div>
            </div>

            {/* Form */}
            <InvoicePaymentForm
                initialData={payment}
                onSubmit={handleSubmit}
                isLoading={updateMutation.isPending}
                parties={partiesData?.data || []}
            />
        </div>
    );
};
