// apps/accounts-web/src/features/invoices/pages/InvoicesPage.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInvoices, useDeleteInvoice } from "../hooks/use-invoices";
import { Button, Input, Card, Table, Badge, Skeleton } from "@repo/ui";
import { useDebounce } from "@repo/ui";
import { Plus, Search, Eye, Trash2 } from "lucide-react";

export const InvoicesPage = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<
        "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED" | ""
    >("");
    const debouncedSearch = useDebounce(search, 300);
    const [sort] = useState<"asc" | "desc">("desc");

    const { data, isLoading } = useInvoices({
        search: debouncedSearch,
        page,
        limit: 10,
        status: statusFilter || undefined,
        sortOrder: sort,
    });

    const deleteMutation = useDeleteInvoice();

    const handleDelete = async (id: string, invoiceNo: string) => {
        if (
            window.confirm(
                `Are you sure you want to delete invoice "${invoiceNo}"?`
            )
        ) {
            await deleteMutation.mutateAsync(id);
        }
    };

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
                    <h1 className="text-2xl font-bold">Purchase Invoices</h1>
                    <p className="text-gray-600">
                        Manage purchase invoices from suppliers
                    </p>
                </div>
                <Link to="/invoices/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Invoice
                    </Button>
                </Link>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search invoices by number or party..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value as
                                    | "PENDING"
                                    | "PARTIALLY_PAID"
                                    | "PAID"
                                    | "OVERDUE"
                                    | "CANCELLED"
                                    | ""
                            )
                        }
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="PARTIALLY_PAID">Partially Paid</option>
                        <option value="PAID">Paid</option>
                        <option value="OVERDUE">Overdue</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </Card>

            {/* Invoices Table */}
            <Card>
                <Table>
                    <thead>
                        <tr>
                            <th>Invoice No</th>
                            <th>Party</th>
                            <th>Date</th>
                            <th>Due Date</th>
                            <th>Amount</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.data.map((invoice) => (
                            <tr key={invoice.id}>
                                <td className="font-medium">
                                    {invoice.invoiceNo}
                                </td>
                                <td>{invoice.party?.name}</td>
                                <td>
                                    {new Date(
                                        invoice.date
                                    ).toLocaleDateString()}
                                </td>
                                <td>
                                    {invoice.dueDate
                                        ? new Date(
                                              invoice.dueDate
                                          ).toLocaleDateString()
                                        : "-"}
                                </td>
                                <td>₹{invoice.amount.toLocaleString()}</td>
                                <td className="text-green-600">
                                    ₹{invoice.paidAmount.toLocaleString()}
                                </td>
                                <td className="text-red-600">
                                    ₹{invoice.remainingAmount.toLocaleString()}
                                </td>
                                <td>
                                    <Badge
                                        variant={getStatusVariant(
                                            invoice.status
                                        )}
                                    >
                                        {invoice.status}
                                    </Badge>
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                navigate(
                                                    `/invoices/${invoice.id}`
                                                )
                                            }
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                handleDelete(
                                                    invoice.id,
                                                    invoice.invoiceNo
                                                )
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
                            of {data.meta.total} invoices
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
