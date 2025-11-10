// apps/accounts-web/src/features/invoices/pages/CreateInvoicePage.tsx

import { useNavigate } from "react-router-dom";
import { InvoiceForm } from "../components/InvoiceForm";
import { useCreateInvoice } from "../hooks/use-invoices";
import { ArrowLeft } from "lucide-react";
import type { CreateInvoiceType } from "@repo/common/schemas";

export const CreateInvoicePage = () => {
    const navigate = useNavigate();
    const createMutation = useCreateInvoice();

    // You'll need to fetch parties list here
    // const { data: parties } = useParties({ limit: 1000 });

    const handleSubmit = async (data: CreateInvoiceType) => {
        await createMutation.mutateAsync(data);
        navigate("/invoices");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/invoices")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">
                        Create Purchase Invoice
                    </h1>
                    <p className="text-gray-600">
                        Add a new purchase invoice from supplier
                    </p>
                </div>
            </div>

            {/* Form */}
            <InvoiceForm
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending}
                // parties={parties?.data || []}
            />
        </div>
    );
};
