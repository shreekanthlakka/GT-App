// apps/accounts-web/src/features/invoice-payments/pages/InvoicePaymentsPage.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    useInvoicePayments,
    useDeleteInvoicePayment,
} from "../hooks/use-invoice-payments";
import { Button, Input, Card, Table, Badge, Skeleton } from "@repo/ui";
import { useDebounce } from "@repo/ui";
import { Plus, Search, Eye, Trash2 } from "lucide-react";

export const InvoicePaymentsPage = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [methodFilter, setMethodFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const debouncedSearch = useDebounce(search, 300);

    const { data, isLoading } = useInvoicePayments({
        search: debouncedSearch,
        page,
        limit: 10,
        method: methodFilter || undefined,
        status: statusFilter || undefined,
    } as any);

    const deleteMutation = useDeleteInvoicePayment();

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this payment?")) {
            await deleteMutation.mutateAsync(id);
        }
    };

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

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Invoice Payments</h1>
                    <p className="text-gray-600">
                        Manage payments to suppliers
                    </p>
                </div>
                <Link to="/invoice-payments/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Payment
                    </Button>
                </Link>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search payments by party or invoice..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <select
                        value={methodFilter}
                        onChange={(e) => setMethodFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Methods</option>
                        <option value="CASH">Cash</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        <option value="ONLINE">Online</option>
                        <option value="OTHER">Other</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="PENDING">Pending</option>
                        <option value="FAILED">Failed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="REFUNDED">Refunded</option>
                    </select>
                </div>
            </Card>

            {/* Payments Table */}
            <Card>
                <Table>
                    <thead>
                        <tr>
                            <th>Party</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Invoice</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.data.map((payment) => (
                            <tr key={payment.id}>
                                <td className="font-medium">
                                    {payment.party.name}
                                </td>
                                <td>
                                    {new Date(
                                        payment.date
                                    ).toLocaleDateString()}
                                </td>
                                <td className="font-semibold text-red-600">
                                    ₹{payment.amount.toLocaleString()}
                                </td>
                                <td>{getMethodBadge(payment.method)}</td>
                                <td>
                                    {payment.invoice ? (
                                        <span className="text-blue-600">
                                            {payment.invoice.invoiceNo}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td>{getStatusBadge(payment.status)}</td>
                                <td>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                navigate(
                                                    `/invoice-payments/${payment.id}`
                                                )
                                            }
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                handleDelete(payment.id)
                                            }
                                            disabled={deleteMutation.isPending}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                {/* Pagination */}
                {data && data.meta.totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 border-t">
                        <div className="text-sm text-gray-600">
                            Showing {(page - 1) * data.meta.limit + 1} to{" "}
                            {Math.min(page * data.meta.limit, data.meta.total)}{" "}
                            of {data.meta.total} payments
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setPage((p) =>
                                        Math.min(data.meta.totalPages, p + 1)
                                    )
                                }
                                disabled={page === data.meta.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};
