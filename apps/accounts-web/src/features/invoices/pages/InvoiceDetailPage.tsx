// apps/accounts-web/src/features/invoices/pages/InvoiceDetailPage.tsx

import { useParams, useNavigate } from "react-router-dom";
import { useInvoice } from "../hooks/use-invoices";
import { Card, Badge, Button, Table, Skeleton } from "@repo/ui";
import { ArrowLeft, Edit, Mail, Phone } from "lucide-react";

export const InvoiceDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: invoice, isLoading } = useInvoice(id!);

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    if (!invoice) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Invoice not found</h2>
            </div>
        );
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "PAID":
                return "success";
            case "PARTIALLY_PAID":
                return "warning";
            case "OVERDUE":
                return "destructive";
            case "CANCELLED":
                return "secondary";
            default:
                return "default";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/invoices")}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            Invoice #{invoice.invoiceNo}
                        </h1>
                        <p className="text-gray-600">Invoice Details</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant={getStatusVariant(invoice.status)}>
                        {invoice.status}
                    </Badge>
                    <Button onClick={() => navigate(`/invoices/${id}/edit`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                </div>
            </div>

            {/* Invoice Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Total Amount
                    </h3>
                    <p className="text-2xl font-bold">
                        ₹{invoice.amount.toLocaleString()}
                    </p>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Paid Amount
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                        ₹{invoice.paidAmount.toLocaleString()}
                    </p>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Balance
                    </h3>
                    <p className="text-2xl font-bold text-red-600">
                        ₹{invoice.remainingAmount.toLocaleString()}
                    </p>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Due Date
                    </h3>
                    <p className="text-lg font-bold">
                        {invoice.dueDate
                            ? new Date(invoice.dueDate).toLocaleDateString()
                            : "Not set"}
                    </p>
                </Card>
            </div>

            {/* Party & Invoice Info */}
            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">
                            Supplier Information
                        </h3>
                        <div className="space-y-2">
                            <div className="text-lg font-semibold">
                                {invoice.party?.name}
                            </div>
                            {invoice.party?.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{invoice.party.phone}</span>
                                </div>
                            )}
                            {invoice.party?.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{invoice.party.email}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">
                            Invoice Details
                        </h3>
                        <div className="space-y-2">
                            <div>
                                <span className="text-sm text-gray-600">
                                    Invoice Date:{" "}
                                </span>
                                <span className="font-semibold">
                                    {new Date(
                                        invoice.date
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                            {invoice.poNumber && (
                                <div>
                                    <span className="text-sm text-gray-600">
                                        PO Number:{" "}
                                    </span>
                                    <span>{invoice.poNumber}</span>
                                </div>
                            )}
                            {invoice.supplierRef && (
                                <div>
                                    <span className="text-sm text-gray-600">
                                        Supplier Ref:{" "}
                                    </span>
                                    <span>{invoice.supplierRef}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Invoice Items */}
            {invoice.items && invoice.items.length > 0 && (
                <Card>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Invoice Items
                        </h3>
                    </div>
                    <Table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>HSN Code</th>
                                <th>Quantity</th>
                                <th>Rate</th>
                                <th>Tax %</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.description}</td>
                                    <td>{item.hsnCode || "-"}</td>
                                    <td>{item.quantity}</td>
                                    <td>₹{item.rate.toLocaleString()}</td>
                                    <td>{item.taxRate || 0}%</td>
                                    <td className="font-semibold">
                                        ₹{item.amount.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    <div className="p-6 border-t">
                        <div className="grid grid-cols-2 gap-4 max-w-md ml-auto">
                            {invoice.discountAmount != null &&
                                invoice.discountAmount > 0 && (
                                    <>
                                        <div className="text-gray-600">
                                            Discount:
                                        </div>
                                        <div className="text-right font-semibold">
                                            -₹
                                            {invoice.discountAmount.toLocaleString()}
                                        </div>
                                    </>
                                )}
                            {invoice.taxAmount && (
                                <>
                                    <div className="text-gray-600">
                                        Tax Amount:
                                    </div>
                                    <div className="text-right font-semibold">
                                        ₹{invoice.taxAmount.toLocaleString()}
                                    </div>
                                </>
                            )}
                            <div className="text-lg font-semibold">Total:</div>
                            <div className="text-right text-lg font-bold text-blue-600">
                                ₹{invoice.amount.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Transport Details */}
            {(invoice.transportMode ||
                invoice.vehicleNo ||
                invoice.dispatchedThrough ||
                invoice.destination) && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Transport Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {invoice.transportMode && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Transport Mode:{" "}
                                </span>
                                <span>{invoice.transportMode}</span>
                            </div>
                        )}
                        {invoice.vehicleNo && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Vehicle No:{" "}
                                </span>
                                <span>{invoice.vehicleNo}</span>
                            </div>
                        )}
                        {invoice.dispatchedThrough && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Dispatched Through:{" "}
                                </span>
                                <span>{invoice.dispatchedThrough}</span>
                            </div>
                        )}
                        {invoice.destination && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Destination:{" "}
                                </span>
                                <span>{invoice.destination}</span>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Notes */}
            {invoice.notes && (
                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Notes
                    </h3>
                    <p className="text-sm text-gray-700">{invoice.notes}</p>
                </Card>
            )}
        </div>
    );
};
