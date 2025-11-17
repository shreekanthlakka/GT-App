// ========================================
// EDIT PARTY PAGE
// ========================================
// File: apps/accounts-web/src/features/parties/pages/EditPartyPage.tsx

import { useParams, useNavigate } from "react-router-dom";
import { CustomerForm } from "../components/CustomerForm";
import { useCustomer, useUpdateCustomer } from "../hooks/use-customers";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@repo/ui";
import type { UpdateCustomerType } from "@repo/common/schemas";

const EditCustomerPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: customer, isLoading } = useCustomer(id!);
    const updateMutation = useUpdateCustomer(id!);

    const handleSubmit = async (data: UpdateCustomerType) => {
        await updateMutation.mutateAsync(data);
        navigate(`/parties/${id}`);
    };

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    if (!customer) {
        return <div>Party not found</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/customer/${id}`)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Edit Customer</h1>
                    <p className="text-gray-600">{customer.name}</p>
                </div>
            </div>

            <CustomerForm
                onSubmit={handleSubmit}
                initialData={customer}
                isLoading={updateMutation.isPending}
            />
        </div>
    );
};

export default EditCustomerPage;
