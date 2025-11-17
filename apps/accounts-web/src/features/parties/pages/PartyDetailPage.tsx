// ========================================
// PARTY DETAIL PAGE
// ========================================
// File: apps/accounts-web/src/features/parties/pages/PartyDetailPage.tsx

import { useParams, useNavigate } from "react-router-dom";
import { useParty, usePartyInvoices } from "../hooks/use-parties";
import { Card, Badge, Button, Skeleton } from "@repo/ui";
import {
    ArrowLeft,
    Edit,
    Mail,
    Phone,
    MapPin,
    Building,
    CreditCard,
    Globe,
    FileText,
} from "lucide-react";

const PartyDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: party, isLoading } = useParty(id!);
    const { data: invoices } = usePartyInvoices(id!);

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    if (!party) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Party not found</h2>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/parties")}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Building className="w-7 h-7 text-blue-600" />
                            {party.name}
                        </h1>
                        <p className="text-gray-600">Party Details</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {party.isActive ? (
                        <Badge variant="success">Active</Badge>
                    ) : (
                        <Badge variant="secondary">Inactive</Badge>
                    )}
                    {party.category && (
                        <Badge variant="default">{party.category}</Badge>
                    )}
                    <Button onClick={() => navigate(`/parties/${id}/edit`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Credit Limit
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                        ₹{Number(party.creditLimit).toLocaleString()}
                    </p>
                </Card>
                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Payment Terms
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                        {party.paymentTerms || 0} days
                    </p>
                </Card>
                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Total Invoices
                    </h3>
                    <p className="text-2xl font-bold text-purple-600">
                        {invoices?.length || 0}
                    </p>
                </Card>
            </div>

            {/* Contact Information */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {party.contactPerson && (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                    {party.contactPerson[0].toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">
                                    Contact Person
                                </div>
                                <div className="font-medium">
                                    {party.contactPerson}
                                </div>
                            </div>
                        </div>
                    )}
                    {party.phone && (
                        <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-sm text-gray-600">
                                    Phone
                                </div>
                                <div className="font-medium">{party.phone}</div>
                            </div>
                        </div>
                    )}
                    {party.email && (
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-sm text-gray-600">
                                    Email
                                </div>
                                <div className="font-medium">{party.email}</div>
                            </div>
                        </div>
                    )}
                    {party.website && (
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-sm text-gray-600">
                                    Website
                                </div>
                                <a
                                    href={party.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-600 hover:underline"
                                >
                                    {party.website}
                                </a>
                            </div>
                        </div>
                    )}
                    {party.address && (
                        <div className="flex items-start gap-3 md:col-span-2">
                            <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                            <div>
                                <div className="text-sm text-gray-600">
                                    Address
                                </div>
                                <div className="font-medium">
                                    {party.address}
                                </div>
                                {party.city && party.state && (
                                    <div className="text-sm text-gray-500 mt-1">
                                        {party.city}, {party.state}{" "}
                                        {party.pincode}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Tax & Compliance */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Tax & Compliance Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {party.gstNo && (
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-sm text-gray-600">
                                    GST Number
                                </div>
                                <div className="font-mono font-medium">
                                    {party.gstNo}
                                </div>
                            </div>
                        </div>
                    )}
                    {party.panNo && (
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-sm text-gray-600">
                                    PAN Number
                                </div>
                                <div className="font-mono font-medium">
                                    {party.panNo}
                                </div>
                            </div>
                        </div>
                    )}
                    {party.taxId && (
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-sm text-gray-600">
                                    Tax ID
                                </div>
                                <div className="font-mono font-medium">
                                    {party.taxId}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Notes */}
            {party.notes && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-3">Notes</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                        {party.notes}
                    </p>
                </Card>
            )}

            {/* Invoice History */}
            {invoices && invoices.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Recent Invoices
                    </h3>
                    <div className="space-y-2">
                        {invoices.slice(0, 10).map((invoice: any) => (
                            <div
                                key={invoice.id}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={() =>
                                    navigate(`/invoices/${invoice.id}`)
                                }
                            >
                                <div>
                                    <div className="font-medium">
                                        {invoice.invoiceNo}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {new Date(
                                            invoice.date
                                        ).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-red-600">
                                        ₹
                                        {Number(
                                            invoice.amount
                                        ).toLocaleString()}
                                    </div>
                                    <Badge
                                        variant={
                                            invoice.status === "PAID"
                                                ? "success"
                                                : invoice.status === "PENDING"
                                                  ? "warning"
                                                  : "secondary"
                                        }
                                        className="text-xs"
                                    >
                                        {invoice.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                    {invoices.length > 10 && (
                        <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => navigate(`/parties/${id}/invoices`)}
                        >
                            View All Invoices
                        </Button>
                    )}
                </Card>
            )}

            {/* System Info */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    System Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Party ID: </span>
                        <span className="font-mono">{party.id}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Created: </span>
                        <span>
                            {new Date(party.createdAt).toLocaleString()}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Last Updated: </span>
                        <span>
                            {new Date(party.updatedAt).toLocaleString()}
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PartyDetailPage;
