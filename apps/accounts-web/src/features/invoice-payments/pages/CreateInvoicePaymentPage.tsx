// apps/accounts-web/src/features/invoice-payments/pages/CreateInvoicePaymentPage.tsx

import { useNavigate } from "react-router-dom";
import { InvoicePaymentForm } from "../components/InvoicePaymentForm";
import { useCreateInvoicePayment } from "../hooks/use-invoice-payments";
import { ArrowLeft } from "lucide-react";
import type { CreateInvoicePaymentType } from "@repo/common/schemas";
import { useQuery } from "@tanstack/react-query";
import { partiesApi } from "@/features/parties/api/parties.api";
import { invoicesApi } from "@/features/invoices/api/invoices.api";

export const CreateInvoicePaymentPage = () => {
    const navigate = useNavigate();
    const createMutation = useCreateInvoicePayment();

    // Fetch parties for dropdown
    const { data: partiesData } = useQuery({
        queryKey: ["parties", "list"],
        queryFn: () => partiesApi.getParties({ limit: 1000 }),
    });

    // Fetch unpaid/partially paid invoices for dropdown
    const { data: invoicesData } = useQuery({
        queryKey: ["invoices", "unpaid"],
        queryFn: () =>
            invoicesApi.getInvoices({
                status: "PENDING,PARTIALLY_PAID",
                limit: 1000,
            }),
    });

    const handleSubmit = async (data: CreateInvoicePaymentType) => {
        await createMutation.mutateAsync(data);
        navigate("/invoice-payments");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/invoice-payments")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Record New Payment</h1>
                    <p className="text-gray-600">
                        Create a new invoice payment record
                    </p>
                </div>
            </div>

            {/* Form */}
            <InvoicePaymentForm
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending}
                parties={partiesData?.data || []}
                invoices={invoicesData?.data || []}
            />
        </div>
    );
};
