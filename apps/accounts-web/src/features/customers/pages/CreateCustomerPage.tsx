// apps/accounts-web/src/features/customers/pages/CreateCustomerPage.tsx

import { useNavigate } from "react-router-dom";
import { CustomerForm } from "../components/CustomerForm";
import { useCreateCustomer } from "../hooks/use-customers";
import { ArrowLeft } from "lucide-react";
import type { CreateCustomerType } from "@repo/common/schemas";

export const CreateCustomerPage = () => {
    const navigate = useNavigate();
    const createMutation = useCreateCustomer();

    const handleSubmit = async (data: CreateCustomerType) => {
        await createMutation.mutateAsync(data);
        navigate("/customers");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/customers")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Create New Customer</h1>
                    <p className="text-gray-600">
                        Add a new customer to your database
                    </p>
                </div>
            </div>

            {/* Form */}
            <CustomerForm
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending}
            />
        </div>
    );
};
