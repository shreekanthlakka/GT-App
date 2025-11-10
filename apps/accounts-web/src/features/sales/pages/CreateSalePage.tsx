// apps/accounts-web/src/features/sales/pages/CreateSalePage.tsx

import { useNavigate } from "react-router-dom";
import { SaleForm } from "../components/SaleForm";
import { useCreateSale } from "../hooks/use-sales";
import { ArrowLeft } from "lucide-react";
import type { CreateSaleType } from "@repo/common/schemas";

export const CreateSalePage = () => {
    const navigate = useNavigate();
    const createMutation = useCreateSale();

    // You'll need to fetch customers list here
    // const { data: customers } = useCustomers({ limit: 1000 });

    const handleSubmit = async (data: CreateSaleType) => {
        await createMutation.mutateAsync(data);
        navigate("/sales");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/sales")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Create New Sale</h1>
                    <p className="text-gray-600">Add a new sale transaction</p>
                </div>
            </div>

            {/* Form */}
            <SaleForm
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending}
                // customers={customers?.data || []}
            />
        </div>
    );
};
