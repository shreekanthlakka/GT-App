// apps/accounts-web/src/features/parties/pages/PartiesPage.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useParties, useDeleteParty } from "../hooks/use-parties";
import { Button, Input, Card, Table, Badge, Skeleton } from "@repo/ui";
import { useDebounce } from "@repo/ui";
import {
    Plus,
    Search,
    Eye,
    Edit,
    Trash2,
    FileText,
    Building,
} from "lucide-react";

const PartiesPage = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [cityFilter, setCityFilter] = useState<string>("");
    const [stateFilter, setStateFilter] = useState<string>("");
    const [activeFilter, setActiveFilter] = useState<string>("");
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const debouncedSearch = useDebounce(search, 300);

    const { data, isLoading } = useParties({
        search: debouncedSearch,
        page,
        limit: 10,
        city: cityFilter || undefined,
        state: stateFilter || undefined,
        isActive: activeFilter ? activeFilter === "true" : undefined,
        category: categoryFilter || undefined,
    } as any);

    const deleteMutation = useDeleteParty();

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this party?")) {
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
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Building className="w-8 h-8 text-blue-600" />
                        Parties / Suppliers
                    </h1>
                    <p className="text-gray-600">
                        Manage your suppliers and vendors
                    </p>
                </div>
                <Link to="/parties/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Party
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-6">
                        <div className="text-sm text-gray-600">
                            Total Parties
                        </div>
                        <div className="text-2xl font-bold">
                            {data.meta.total}
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-gray-600">
                            Active Parties
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                            {data.data.filter((p) => p.isActive).length}
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-gray-600">With GST</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {data.data.filter((p) => p.gstNo).length}
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-gray-600">
                            Credit Limit
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                            ₹
                            {data.data
                                .reduce(
                                    (sum, p) => sum + Number(p.creditLimit),
                                    0
                                )
                                .toLocaleString()}
                        </div>
                    </Card>
                </div>
            )}

            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search parties by name, GST, phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Categories</option>
                        <option value="Manufacturer">Manufacturer</option>
                        <option value="Distributor">Distributor</option>
                        <option value="Wholesaler">Wholesaler</option>
                        <option value="Retailer">Retailer</option>
                        <option value="Supplier">Supplier</option>
                    </select>
                    <select
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Cities</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Bangalore">Bangalore</option>
                        <option value="Chennai">Chennai</option>
                        <option value="Kolkata">Kolkata</option>
                    </select>
                    <select
                        value={stateFilter}
                        onChange={(e) => setStateFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All States</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Delhi">Delhi</option>
                    </select>
                    <select
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
            </Card>

            {/* Parties Table */}
            <Card>
                <Table>
                    <thead>
                        <tr>
                            <th>Party Name</th>
                            <th>Contact</th>
                            <th>Category</th>
                            <th>Location</th>
                            <th>GST Number</th>
                            <th>Credit Limit</th>
                            <th>Payment Terms</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.data.map((party) => (
                            <tr key={party.id}>
                                <td className="font-medium">
                                    <div>{party.name}</div>
                                    {party.contactPerson && (
                                        <div className="text-sm text-gray-600">
                                            {party.contactPerson}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {party.phone && <div>{party.phone}</div>}
                                    {party.email && (
                                        <div className="text-sm text-gray-600">
                                            {party.email}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {party.category ? (
                                        <Badge variant="default">
                                            {party.category}
                                        </Badge>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td>
                                    {party.city && <div>{party.city}</div>}
                                    {party.state && (
                                        <div className="text-sm text-gray-600">
                                            {party.state}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {party.gstNo ? (
                                        <span className="font-mono text-sm">
                                            {party.gstNo}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="font-semibold text-green-600">
                                    ₹
                                    {Number(party.creditLimit).toLocaleString()}
                                </td>
                                <td>
                                    {party.paymentTerms ? (
                                        <span>{party.paymentTerms} days</span>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td>
                                    {party.isActive ? (
                                        <Badge variant="success">Active</Badge>
                                    ) : (
                                        <Badge variant="secondary">
                                            Inactive
                                        </Badge>
                                    )}
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                navigate(`/parties/${party.id}`)
                                            }
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                navigate(
                                                    `/parties/${party.id}/edit`
                                                )
                                            }
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                handleDelete(party.id)
                                            }
                                            disabled={deleteMutation.isPending}
                                            title="Delete"
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
                            of {data.meta.total} parties
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

export default PartiesPage;
