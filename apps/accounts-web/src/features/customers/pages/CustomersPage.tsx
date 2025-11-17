// apps/accounts-web/src/features/customers/pages/CustomersPage.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCustomers, useDeleteCustomer } from "../hooks/use-customers";
import { Button, Input, Card, Table, Badge, Skeleton } from "@repo/ui";
import { useDebounce } from "@repo/ui";
import { Plus, Search, Eye, Trash2 } from "lucide-react";

export const CustomersPage = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const debouncedSearch = useDebounce(search, 300);

    const { data, isLoading } = useCustomers({
        search: debouncedSearch,
        page,
        limit: 10,
        sortOrder: "desc",
    });

    const deleteMutation = useDeleteCustomer();

    const handleDelete = async (id: string, name: string) => {
        if (
            window.confirm(
                `Are you sure you want to delete customer "${name}"?`
            )
        ) {
            await deleteMutation.mutateAsync(id);
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
                    <h1 className="text-2xl font-bold">Customers</h1>
                    <p className="text-gray-600">
                        Manage your customer database
                    </p>
                </div>
                <Link to="/customers/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Customer
                    </Button>
                </Link>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search customers by name, phone, or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </Card>

            {/* Customers Table */}
            <Card>
                <Table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>City</th>
                            <th>Credit Limit</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.data.map((customer) => (
                            <tr key={customer.id}>
                                <td className="font-medium">{customer.name}</td>
                                <td>
                                    <div className="text-sm">
                                        {customer.phone && (
                                            <div>{customer.phone}</div>
                                        )}
                                        {customer.email && (
                                            <div className="text-gray-600">
                                                {customer.email}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td>{customer.city || "-"}</td>
                                <td>
                                    ₹{customer.creditLimit.toLocaleString()}
                                </td>
                                <td>
                                    <Badge
                                        variant={
                                            customer.isActive
                                                ? "success"
                                                : "secondary"
                                        }
                                    >
                                        {customer.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </Badge>
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                navigate(
                                                    `/customers/${customer.id}`
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
                                                    customer.id,
                                                    customer.name
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
                            of {data.meta.total} customers
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

export default CustomersPage;
