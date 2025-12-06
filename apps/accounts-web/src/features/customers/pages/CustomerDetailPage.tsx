// apps/accounts-web/src/features/customers/pages/CustomerDetailPage.tsx

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    useCustomer,
    useCustomerLedger,
    useCustomerStatement,
} from "../hooks/use-customers";
import { Card, Badge, Button, Table, Skeleton } from "@repo/ui";
import { ArrowLeft, Edit, Mail, Phone } from "lucide-react";

export const CustomerDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<
        "details" | "ledger" | "statement"
    >("details");

    const { data: customer, isLoading } = useCustomer(id!);
    const { data: ledger } = useCustomerLedger(id!, undefined, {
        enabled: activeTab === "ledger",
    });
    const { data: statement } = useCustomerStatement(
        id!,
        {
            startDate: "1970-01-01",
            endDate: new Date().toISOString().substring(0, 10),
        },
        {
            enabled: activeTab === "statement",
        }
    );

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    if (!customer) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Customer not found</h2>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/customers")}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">{customer.name}</h1>
                        <p className="text-gray-600">Customer Details</p>
                    </div>
                </div>
                <Button onClick={() => navigate(`/customers/${id}/edit`)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Customer
                </Button>
            </div>

            {/* Customer Info Card */}
            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">
                            Contact Information
                        </h3>
                        <div className="space-y-2">
                            {customer.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{customer.phone}</span>
                                </div>
                            )}
                            {customer.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{customer.email}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">
                            Address
                        </h3>
                        <p className="text-sm">
                            {customer.address && <div>{customer.address}</div>}
                            {customer.city && <div>{customer.city}</div>}
                            {customer.state && <div>{customer.state}</div>}
                            {customer.pincode && <div>{customer.pincode}</div>}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">
                            Business Details
                        </h3>
                        <div className="space-y-2">
                            <div>
                                <span className="text-sm text-gray-600">
                                    Credit Limit:{" "}
                                </span>
                                <span className="font-semibold">
                                    ₹{customer.creditLimit.toLocaleString()}
                                </span>
                            </div>
                            {customer.gstNumber && (
                                <div>
                                    <span className="text-sm text-gray-600">
                                        GST:{" "}
                                    </span>
                                    <span>{customer.gstNumber}</span>
                                </div>
                            )}
                            <div>
                                <Badge
                                    variant={
                                        customer.isActive
                                            ? "success"
                                            : "secondary"
                                    }
                                >
                                    {customer.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {customer.notes && (
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">
                            Notes
                        </h3>
                        <p className="text-sm text-gray-700">
                            {customer.notes}
                        </p>
                    </div>
                )}
            </Card>

            {/* Tabs */}
            <div className="border-b">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("details")}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                            activeTab === "details"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab("ledger")}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                            activeTab === "ledger"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Ledger
                    </button>
                    <button
                        onClick={() => setActiveTab("statement")}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                            activeTab === "statement"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Statement
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === "details" && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Additional Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customer.dateOfBirth && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Date of Birth:{" "}
                                </span>
                                <span>
                                    {new Date(
                                        customer.dateOfBirth
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        {customer.anniversary && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Anniversary:{" "}
                                </span>
                                <span>
                                    {new Date(
                                        customer.anniversary
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        {customer.preferredContact && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Preferred Contact:{" "}
                                </span>
                                <span className="capitalize">
                                    {customer.preferredContact}
                                </span>
                            </div>
                        )}
                        {customer.tags.length > 0 && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Tags:{" "}
                                </span>
                                <div className="flex gap-2 mt-1">
                                    {customer.tags.map((tag) => (
                                        <Badge key={tag} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {activeTab === "ledger" && (
                <Card>
                    <Table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Debit</th>
                                <th>Credit</th>
                                <th>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger?.ledgerEntries.map((entry) => (
                                <tr key={entry.id}>
                                    <td>
                                        {new Date(
                                            entry.date
                                        ).toLocaleDateString()}
                                    </td>
                                    <td>{entry.description}</td>
                                    <td className="text-red-600">
                                        {entry.debit > 0
                                            ? `₹${entry.debit.toLocaleString()}`
                                            : "-"}
                                    </td>
                                    <td className="text-green-600">
                                        {entry.credit > 0
                                            ? `₹${entry.credit.toLocaleString()}`
                                            : "-"}
                                    </td>
                                    <td className="font-semibold">
                                        ₹{entry.balance.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
            )}

            {activeTab === "statement" && statement && (
                <Card className="p-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <div className="text-sm text-gray-600">
                                    Opening Balance
                                </div>
                                <div className="text-xl font-bold">
                                    ₹{statement.openingBalance.toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">
                                    Total Sales
                                </div>
                                <div className="text-xl font-bold text-red-600">
                                    ₹{statement.totalSales.toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">
                                    Total Receipts
                                </div>
                                <div className="text-xl font-bold text-green-600">
                                    ₹{statement.totalReceipts.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <Table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Debit</th>
                                    <th>Credit</th>
                                    <th>Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {statement.entries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>
                                            {new Date(
                                                entry.date
                                            ).toLocaleDateString()}
                                        </td>
                                        <td>{entry.description}</td>
                                        <td className="text-red-600">
                                            {entry.debit > 0
                                                ? `₹${entry.debit.toLocaleString()}`
                                                : "-"}
                                        </td>
                                        <td className="text-green-600">
                                            {entry.credit > 0
                                                ? `₹${entry.credit.toLocaleString()}`
                                                : "-"}
                                        </td>
                                        <td className="font-semibold">
                                            ₹{entry.balance.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">
                                Closing Balance
                            </div>
                            <div className="text-2xl font-bold">
                                ₹{statement.closingBalance.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default CustomerDetailPage;
