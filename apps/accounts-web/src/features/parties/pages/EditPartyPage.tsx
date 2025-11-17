// ========================================
// EDIT PARTY PAGE
// ========================================
// File: apps/accounts-web/src/features/parties/pages/EditPartyPage.tsx

import { useParams, useNavigate } from "react-router-dom";
import { PartyForm } from "../components/PartyForm";
import { useParty, useUpdateParty } from "../hooks/use-parties";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@repo/ui";
import type { UpdatePartyType } from "@repo/common/schemas";

const EditPartyPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: party, isLoading } = useParty(id!);
    const updateMutation = useUpdateParty(id!);

    const handleSubmit = async (data: UpdatePartyType) => {
        await updateMutation.mutateAsync(data);
        navigate(`/parties/${id}`);
    };

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    if (!party) {
        return <div>Party not found</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/parties/${id}`)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Edit Party</h1>
                    <p className="text-gray-600">{party.name}</p>
                </div>
            </div>

            <PartyForm
                onSubmit={handleSubmit}
                initialData={party}
                isLoading={updateMutation.isPending}
            />
        </div>
    );
};

export default EditPartyPage;
