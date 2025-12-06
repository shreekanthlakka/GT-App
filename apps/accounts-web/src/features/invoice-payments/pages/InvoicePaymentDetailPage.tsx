// apps/accounts-web/src/features/invoice-payments/pages/InvoicePaymentDetailPage.tsx

import { useParams, useNavigate } from "react-router-dom";
import { useInvoicePayment } from "../hooks/use-invoice-payments";
import { Card, Badge, Button, Skeleton } from "@repo/ui";
import { ArrowLeft, Edit, Mail, Phone } from "lucide-react";

export const InvoicePaymentDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: payment, isLoading } = useInvoicePayment(id!);

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    if (!payment) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Payment not found</h2>
            </div>
        );
    }

    const getMethodBadge = (method: string) => {
        switch (method) {
            case "CASH":
                return <Badge variant="success">Cash</Badge>;
            case "BANK_TRANSFER":
                return <Badge variant="default">Bank Transfer</Badge>;
            case "CHEQUE":
                return <Badge variant="warning">Cheque</Badge>;
            case "UPI":
                return <Badge variant="default">UPI</Badge>;
            case "CARD":
                return <Badge variant="default">Card</Badge>;
            default:
                return <Badge variant="secondary">{method}</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return <Badge variant="success">Completed</Badge>;
            case "PENDING":
                return <Badge variant="warning">Pending</Badge>;
            case "FAILED":
                return <Badge variant="destructive">Failed</Badge>;
            case "CANCELLED":
                return <Badge variant="secondary">Cancelled</Badge>;
            default:
                return <Badge variant="default">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/invoice-payments")}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Payment Details</h1>
                        <p className="text-gray-600">Invoice Payment Details</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {getMethodBadge(payment.method)}
                    {getStatusBadge(payment.status)}
                    <Button
                        onClick={() => navigate(`/invoice-payments/${id}/edit`)}
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                </div>
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Amount Paid
                    </h3>
                    <p className="text-2xl font-bold text-red-600">
                        ₹{payment.amount.toLocaleString()}
                    </p>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Payment Date
                    </h3>
                    <p className="text-lg font-bold">
                        {new Date(payment.date).toLocaleDateString()}
                    </p>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Voucher ID
                    </h3>
                    <p className="text-lg font-mono">{payment.voucherId}</p>
                </Card>
            </div>

            {/* Party Info */}
            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">
                            Supplier Information
                        </h3>
                        <div className="space-y-2">
                            <div className="text-lg font-semibold">
                                {payment.party?.name}
                            </div>
                            {payment.party?.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{payment.party.phone}</span>
                                </div>
                            )}
                            {payment.party?.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{payment.party.email}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">
                            Payment Details
                        </h3>
                        <div className="space-y-2">
                            <div>
                                <span className="text-sm text-gray-600">
                                    Payment Method:{" "}
                                </span>
                                <span className="font-semibold">
                                    {payment.method}
                                </span>
                            </div>
                            {payment.reference && (
                                <div>
                                    <span className="text-sm text-gray-600">
                                        Reference:{" "}
                                    </span>
                                    <span>{payment.reference}</span>
                                </div>
                            )}
                            {payment.invoice && (
                                <div>
                                    <span className="text-sm text-gray-600">
                                        Against Invoice:{" "}
                                    </span>
                                    <span className="text-blue-600 font-semibold">
                                        {payment.invoice.invoiceNo}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {payment.description && (
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">
                            Description
                        </h3>
                        <p className="text-sm text-gray-700">
                            {payment.description}
                        </p>
                    </div>
                )}
            </Card>

            {/* Banking Details */}
            {(payment.bankName || payment.chequeNo || payment.charges) && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Banking Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {payment.bankName && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Bank Name:{" "}
                                </span>
                                <span>{payment.bankName}</span>
                            </div>
                        )}
                        {payment.chequeNo && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Cheque Number:{" "}
                                </span>
                                <span>{payment.chequeNo}</span>
                            </div>
                        )}
                        {payment.chequeDate && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Cheque Date:{" "}
                                </span>
                                <span>
                                    {new Date(
                                        payment.chequeDate
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        {payment.clearanceDate && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Clearance Date:{" "}
                                </span>
                                <span>
                                    {new Date(
                                        payment.clearanceDate
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        {payment.charges && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Bank Charges:{" "}
                                </span>
                                <span className="text-red-600">
                                    ₹{payment.charges.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Gateway Details (for online payments) */}
            {(payment.gatewayOrderId ||
                payment.gatewayPaymentId ||
                payment.transactionId) && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Gateway Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {payment.gatewayOrderId && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Gateway Order ID:{" "}
                                </span>
                                <span className="font-mono">
                                    {payment.gatewayOrderId}
                                </span>
                            </div>
                        )}
                        {payment.gatewayPaymentId && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Gateway Payment ID:{" "}
                                </span>
                                <span className="font-mono">
                                    {payment.gatewayPaymentId}
                                </span>
                            </div>
                        )}
                        {payment.transactionId && (
                            <div>
                                <span className="text-sm text-gray-600">
                                    Transaction ID:{" "}
                                </span>
                                <span className="font-mono">
                                    {payment.transactionId}
                                </span>
                            </div>
                        )}
                    </div>
                    {payment.failureReason && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">
                                <strong>Failure Reason:</strong>{" "}
                                {payment.failureReason}
                            </p>
                        </div>
                    )}
                </Card>
            )}

            {/* Timestamps */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">System Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Created At: </span>
                        <span>
                            {new Date(payment.createdAt).toLocaleString()}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Last Updated: </span>
                        <span>
                            {new Date(payment.updatedAt).toLocaleString()}
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    );
};
