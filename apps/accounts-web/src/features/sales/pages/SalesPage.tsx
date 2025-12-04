// apps/accounts-web/src/features/sales/pages/SalesPage.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSales, useDeleteSale, useCancelSale } from "../hooks/use-sales";
import { Button, Input, Card, Table, Badge, Skeleton } from "@repo/ui";
import { useDebounce } from "@repo/ui";
import { Plus, Search, Eye, Trash2, XCircle } from "lucide-react";

export const SalesPage = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const debouncedSearch = useDebounce(search, 300);

    const { data, isLoading } = useSales({
        search: debouncedSearch,
        page,
        limit: 10,
        status: statusFilter || undefined,
    } as any);

    const deleteMutation = useDeleteSale();
    const cancelMutation = useCancelSale();

    const handleDelete = async (id: string, saleNo: string) => {
        if (
            window.confirm(`Are you sure you want to delete sale "${saleNo}"?`)
        ) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleCancel = async (id: string, saleNo: string) => {
        if (
            window.confirm(`Are you sure you want to cancel sale "${saleNo}"?`)
        ) {
            await cancelMutation.mutateAsync(id);
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
            case "RETURNED":
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
                    <h1 className="text-2xl font-bold">Sales</h1>
                    <p className="text-gray-600">
                        Manage customer sales and orders
                    </p>
                </div>
                <Link to="/sales/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Sale
                    </Button>
                </Link>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search sales by number or customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="PARTIALLY_PAID">Partially Paid</option>
                        <option value="PAID">Paid</option>
                        <option value="OVERDUE">Overdue</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="RETURNED">Returned</option>
                    </select>
                </div>
            </Card>

            {/* Sales Table */}
            <Card>
                <Table>
                    <thead>
                        <tr>
                            <th>Sale No</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.data.map((sale) => (
                            <tr key={sale.id}>
                                <td className="font-medium">{sale.saleNo}</td>
                                <td>{sale.customer?.name}</td>
                                <td>
                                    {new Date(sale.date).toLocaleDateString()}
                                </td>
                                <td>₹{sale.amount.toLocaleString()}</td>
                                <td className="text-green-600">
                                    ₹{sale.paidAmount.toLocaleString()}
                                </td>
                                <td className="text-red-600">
                                    ₹{sale.remainingAmount.toLocaleString()}
                                </td>
                                <td>
                                    <Badge
                                        variant={getStatusVariant(sale.status)}
                                    >
                                        {sale.status}
                                    </Badge>
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                navigate(`/sales/${sale.id}`)
                                            }
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        {sale.status !== "CANCELLED" && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleCancel(
                                                        sale.id,
                                                        sale.saleNo
                                                    )
                                                }
                                                disabled={
                                                    cancelMutation.isPending
                                                }
                                            >
                                                <XCircle className="w-4 h-4 text-orange-500" />
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                handleDelete(
                                                    sale.id,
                                                    sale.saleNo
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
                            of {data.meta.total} sales
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
