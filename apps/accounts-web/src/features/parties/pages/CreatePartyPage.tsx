// ========================================
// PARTY CREATE PAGE
// ========================================
// File: apps/accounts-web/src/features/parties/pages/CreatePartyPage.tsx

import { useNavigate } from "react-router-dom";
import { PartyForm } from "../components/PartyForm";
import { useCreateParty } from "../hooks/use-parties";
import { ArrowLeft } from "lucide-react";
import type { CreatePartyType, UpdatePartyType } from "@repo/common/schemas";

const CreatePartyPage = () => {
    const navigate = useNavigate();
    const createMutation = useCreateParty();

    const handleSubmit = async (data: CreatePartyType | UpdatePartyType) => {
        await createMutation.mutateAsync(data as CreatePartyType);
        navigate("/parties");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/parties")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Add New Party</h1>
                    <p className="text-gray-600">
                        Create a new supplier/vendor record
                    </p>
                </div>
            </div>

            {/* Form */}
            <PartyForm
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending}
            />
        </div>
    );
};
export default CreatePartyPage;
